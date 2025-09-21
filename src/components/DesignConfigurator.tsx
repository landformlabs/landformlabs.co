"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Rnd } from "react-rnd";
import RichFontDropdown from "./RichFontDropdown";
import RichColorDropdown from "./RichColorDropdown";
import RichTileSizeDropdown from "./RichTileSizeDropdown";
import RichPrintTypeDropdown from "./RichPrintTypeDropdown";
import JSZip from "jszip";
import { logger } from "@/utils/logger";
import { tileRequestThrottle } from "@/utils/requestThrottle";

interface DesignConfiguratorProps {
  gpxData: any;
  boundingBox: string;
  mapSnapshot?: string | null;
  designConfig: {
    routeColor: string;
    printType: "tile" | "ornament";
    tileSize: "basecamp" | "ridgeline" | "summit";
    labels: Array<{
      text: string;
      x: number;
      y: number;
      size: number;
      rotation: number;
      width: number;
      height: number;
      fontFamily: "Garamond" | "Poppins" | "Trispace";
      textAlign: "left" | "center" | "right";
      bold: boolean;
      italic: boolean;
      color?: string;
      // Ornament-specific properties (only used when printType is "ornament")
      angle?: number; // Position around circle in degrees (0 = top)
      radius?: number; // Distance from center
    }>;
    ornamentLabels: Array<{
      text: string;
      angle: number; // Position around circle in degrees (0 = top)
      radius: number; // Distance from center
      size: number;
      fontFamily: "Garamond" | "Poppins" | "Trispace";
      bold: boolean;
      italic: boolean;
      color?: string;
    }>;
    ornamentCircle: {
      x: number;
      y: number;
      radius: number;
    };
  };
  onConfigChange: (config: any) => void;
  onRestart?: () => void;
}

export default function DesignConfigurator({
  gpxData,
  boundingBox,
  mapSnapshot,
  designConfig,
  onConfigChange,
  onRestart,
}: DesignConfiguratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hillshadeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRenderingHillshade, setIsRenderingHillshade] = useState(false);
  const [hillshadeError, setHillshadeError] = useState<string | null>(null);
  const [hillshadeReady, setHillshadeReady] = useState(false);
  const [activeLabel, setActiveLabel] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const editableRef = useRef<HTMLDivElement>(null);

  const [selectedOrnamentLabelIndex, setSelectedOrnamentLabelIndex] = useState<
    number | null
  >(null);
  const [editingOrnamentLabel, setEditingOrnamentLabel] = useState<
    number | null
  >(null);
  const ornamentEditableRef = useRef<HTMLInputElement>(null);
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');

  // Parse bounding box coordinates (memoized to prevent unnecessary re-renders)
  const bbox = useMemo(() => {
    if (!boundingBox) return [];
    return boundingBox.split(",").map(Number); // [minLng, minLat, maxLng, maxLat]
  }, [boundingBox]);

  // Color options for routes and text
  const colorOptions = [
    { name: "Black", value: "#000000" },
    { name: "Blue", value: "#2563eb" },
    { name: "Red", value: "#ef4444" },
  ];

  // Font family options
  const fontFamilyOptions = useMemo(
    () => [
      {
        name: "Trispace",
        value: "Trispace" as const,
        cssFont: "Trispace, monospace",
      },
      {
        name: "Garamond",
        value: "Garamond" as const,
        cssFont: "EB Garamond, serif",
      },
      {
        name: "Poppins",
        value: "Poppins" as const,
        cssFont: "Poppins, sans-serif",
      },
    ],
    [],
  );

  // Text alignment options
  const textAlignOptions = [
    {
      name: "Left",
      value: "left" as const,
      icon: "M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2z",
    },
    {
      name: "Center",
      value: "center" as const,
      icon: "M5 3h14v2H5V3zm-2 4h18v2H3V7zm2 4h14v2H5v-2z",
    },
    {
      name: "Right",
      value: "right" as const,
      icon: "M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2z",
    },
  ];

  // Helper function to get tile size scaling factor
  const getTileSizeScaling = () => {
    // Scale text relative to physical size - larger prints need smaller relative text
    switch (designConfig.tileSize) {
      case "basecamp": // 100mm - smallest tile, largest relative text
        return 1.4;
      case "ridgeline": // 155mm - baseline size
        return 1.0;
      case "summit": // 210mm - largest tile, smallest relative text
        return 0.7;
      default:
        return 1.0;
    }
  };

  // Helper function to generate font string with weight and style
  const generateFontString = (
    fontSize: number,
    fontFamily: string,
    bold: boolean = true,
    italic: boolean = false,
  ) => {
    const weight = bold ? "bold" : "normal";
    const style = italic ? "italic" : "normal";
    return `${style} ${weight} ${fontSize}px ${fontFamily}`;
  };

  // Helper function to get ornament circle properties - now fills the entire canvas
  const getOrnamentCircle = useCallback(() => {
    const canvasSize = 400;
    return {
      x: canvasSize / 2, // center of canvas
      y: canvasSize / 2,
      radius: canvasSize / 2 - 10, // Fill canvas with small padding
    };
  }, []);

  // Helper function to format distance based on selected unit
  const formatDistance = useCallback((distanceInMeters: number) => {
    if (distanceUnit === 'miles') {
      const miles = distanceInMeters * 0.000621371; // Convert meters to miles
      return `${miles.toFixed(2)} mi`;
    } else {
      const kilometers = distanceInMeters / 1000; // Convert meters to kilometers
      return `${kilometers.toFixed(2)} km`;
    }
  }, [distanceUnit]);

  // Helper function to fetch and render hillshade background to cache canvas
  const renderHillshadeBackground = useCallback(
    async (
      canvasSize: number,
      bboxData: number[],
      snapshotData?: string | null,
    ) => {
      setIsRenderingHillshade(true);
      setHillshadeError(null);
      setHillshadeReady(false);

      logger.debug("🗻 Starting hillshade rendering...");

      // Create or get the hillshade cache canvas
      if (!hillshadeCanvasRef.current) {
        hillshadeCanvasRef.current = document.createElement("canvas");
      }
      const hillshadeCanvas = hillshadeCanvasRef.current;
      hillshadeCanvas.width = canvasSize;
      hillshadeCanvas.height = canvasSize;

      const ctx = hillshadeCanvas.getContext("2d");
      if (!ctx) {
        logger.error("Failed to get hillshade canvas context");
        setHillshadeError("Canvas not supported");
        setIsRenderingHillshade(false);
        return;
      }

      try {
        // Start with white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Validate bounding box
        if (
          !bboxData ||
          bboxData.length !== 4 ||
          bboxData[0] >= bboxData[2] ||
          bboxData[1] >= bboxData[3]
        ) {
          const errorMessage = "Invalid bounding box coordinates";
          logger.error("❌ Invalid bounding box:", bboxData);
          setHillshadeError(errorMessage);
          return;
        }

        logger.debug("📍 Bounding box:", bboxData);

        // Calculate appropriate zoom level based on bounding box size
        const latDiff = bboxData[3] - bboxData[1]; // maxLat - minLat
        const lngDiff = bboxData[2] - bboxData[0]; // maxLng - minLng
        const maxDiff = Math.max(latDiff, lngDiff);

        // Enhanced zoom level selection for better detail on small areas
        let zoom = 10;
        if (maxDiff < 0.0002)
          zoom = 19; // Ultra small areas - maximum detail
        else if (maxDiff < 0.0004)
          zoom = 18; // Very small areas
        else if (maxDiff < 0.0007)
          zoom = 17; // Tiny areas
        else if (maxDiff < 0.001)
          zoom = 16; // Small areas
        else if (maxDiff < 0.002) zoom = 15;
        else if (maxDiff < 0.005) zoom = 14;
        else if (maxDiff < 0.01) zoom = 13;
        else if (maxDiff < 0.02) zoom = 12;
        else if (maxDiff < 0.05) zoom = 11;
        else if (maxDiff < 0.1) zoom = 10;
        else if (maxDiff < 0.5) zoom = 9;
        else zoom = 8;

        // If we have map metadata, override with exact zoom from selection page
        if (
          snapshotData &&
          snapshotData.startsWith("data:application/json;base64,")
        ) {
          logger.debug("📸 Using map metadata for consistent rendering");
          try {
            // Browser compatibility check for atob
            if (typeof atob === "undefined") {
              throw new Error("Base64 decoding not supported in this browser");
            }

            const base64Data = snapshotData.split(",")[1];
            const metadataJson = atob(base64Data);
            const metadata = JSON.parse(metadataJson);

            logger.debug("🔍 Map metadata:", metadata);

            // Use the exact zoom level from the selection page
            const exactZoom = metadata.zoom;
            logger.debug(
              `🎯 Using exact zoom level ${exactZoom} from selection page`,
            );

            // Override the automatic zoom calculation
            const originalZoomCalculation = zoom;
            zoom = Math.round(exactZoom); // Use the exact zoom from selection
            logger.debug(
              `🔄 Overriding calculated zoom ${originalZoomCalculation} with selection zoom ${zoom}`,
            );
          } catch (error) {
            logger.warn(
              "⚠️ Failed to parse map metadata, falling back to calculated zoom",
            );
          }
        }

        // Check if area might be outside main US coverage (rough bounds check)
        const centerLat = (bboxData[1] + bboxData[3]) / 2;
        const centerLng = (bboxData[0] + bboxData[2]) / 2;
        const isOutsideMainUS =
          centerLat < 24 ||
          centerLat > 50 ||
          centerLng < -125 ||
          centerLng > -65;

        // Be more conservative with zoom levels outside main US coverage
        if (isOutsideMainUS && zoom > 14) {
          logger.debug(
            `Area appears to be outside main US coverage, reducing max zoom from ${zoom} to 14`,
          );
          zoom = Math.min(zoom, 14);
        }

        // Clamp zoom to available range (USGS supports up to level 23)
        zoom = Math.max(3, Math.min(19, zoom));

        logger.debug(
          `🔍 Using zoom level ${zoom} for bbox size ${maxDiff.toFixed(6)}`,
        );

        // Helper functions for tile coordinate conversion
        const lng2tile = (lng: number, zoom: number) =>
          ((lng + 180) / 360) * Math.pow(2, zoom);
        const lat2tile = (lat: number, zoom: number) => {
          const latRad = (lat * Math.PI) / 180;
          return (
            ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) *
            Math.pow(2, zoom)
          );
        };

        const tile2lng = (x: number, zoom: number) =>
          (x / Math.pow(2, zoom)) * 360 - 180;
        const tile2lat = (y: number, zoom: number) => {
          const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
          return (
            (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
          );
        };

        // Calculate tile bounds more precisely
        const n = Math.pow(2, zoom);
        const minTileX = Math.floor(lng2tile(bboxData[0], zoom));
        const maxTileX = Math.floor(lng2tile(bboxData[2], zoom));
        const minTileY = Math.floor(lat2tile(bboxData[3], zoom)); // Note: Y is flipped
        const maxTileY = Math.floor(lat2tile(bboxData[1], zoom));

        // Ensure valid tile ranges
        let validMinTileX = Math.max(0, Math.min(minTileX, maxTileX));
        let validMaxTileX = Math.min(n - 1, Math.max(minTileX, maxTileX));
        let validMinTileY = Math.max(0, Math.min(minTileY, maxTileY));
        let validMaxTileY = Math.min(n - 1, Math.max(minTileY, maxTileY));

        logger.debug(
          `🧩 Initial tile range at zoom ${zoom}: X(${validMinTileX}-${validMaxTileX}), Y(${validMinTileY}-${validMaxTileY})`,
        );

        // Limit number of tiles to prevent excessive requests and potential grey rendering
        let tileCountX = validMaxTileX - validMinTileX + 1;
        let tileCountY = validMaxTileY - validMinTileY + 1;
        let totalTiles = tileCountX * tileCountY;

        // Allow more tiles for higher zoom levels where detail matters
        const maxTiles = zoom >= 16 ? 16 : 12;

        if (totalTiles > maxTiles) {
          // Use a lower zoom level
          zoom = Math.max(8, zoom - 1);
          logger.debug(
            `Too many tiles (${totalTiles}), reducing zoom to ${zoom}`,
          );

          // Recalculate with new zoom
          const newN = Math.pow(2, zoom);
          const newMinTileX = Math.floor(lng2tile(bboxData[0], zoom));
          const newMaxTileX = Math.floor(lng2tile(bboxData[2], zoom));
          const newMinTileY = Math.floor(lat2tile(bboxData[3], zoom));
          const newMaxTileY = Math.floor(lat2tile(bboxData[1], zoom));

          validMinTileX = Math.max(0, Math.min(newMinTileX, newMaxTileX));
          validMaxTileX = Math.min(
            newN - 1,
            Math.max(newMinTileX, newMaxTileX),
          );
          validMinTileY = Math.max(0, Math.min(newMinTileY, newMaxTileY));
          validMaxTileY = Math.min(
            newN - 1,
            Math.max(newMinTileY, newMaxTileY),
          );

          tileCountX = validMaxTileX - validMinTileX + 1;
          tileCountY = validMaxTileY - validMinTileY + 1;
          totalTiles = tileCountX * tileCountY;

          logger.debug(
            `Final tile range at zoom ${zoom}: X(${validMinTileX}-${validMaxTileX}), Y(${validMinTileY}-${validMaxTileY}) = ${totalTiles} tiles`,
          );
        }

        // Create promises for tile images with throttling and better error handling
        const tilePromises: Promise<{
          img: HTMLImageElement;
          tileX: number;
          tileY: number;
        } | null>[] = [];

        for (let tileX = validMinTileX; tileX <= validMaxTileX; tileX++) {
          for (let tileY = validMinTileY; tileY <= validMaxTileY; tileY++) {
            const tileUrl = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/${zoom}/${tileY}/${tileX}`;

            // Use throttled request to be respectful to the USGS service
            const promise = tileRequestThrottle.add(
              () =>
                new Promise<{
                  img: HTMLImageElement;
                  tileX: number;
                  tileY: number;
                } | null>((resolve) => {
                  const img = new Image();
                  img.crossOrigin = "anonymous";

                  const timeout = setTimeout(() => {
                    logger.warn(`Tile timeout: ${tileX}/${tileY}/${zoom}`);
                    resolve(null);
                  }, 5000); // Increased timeout for throttled requests

                  img.onload = () => {
                    clearTimeout(timeout);
                    // Check if image is actually loaded (not a grey placeholder)
                    if (img.width > 0 && img.height > 0) {
                      resolve({ img, tileX, tileY });
                    } else {
                      logger.warn(
                        `Invalid tile dimensions: ${tileX}/${tileY}/${zoom}`,
                      );
                      resolve(null);
                    }
                  };

                  img.onerror = () => {
                    clearTimeout(timeout);
                    logger.warn(
                      `Failed to load tile: ${tileX}/${tileY}/${zoom} - Tile not available`,
                    );
                    resolve(null);
                  };

                  img.src = tileUrl;
                }),
            );

            tilePromises.push(promise);
          }
        }

        // Wait for all tiles with proper timeout
        const tilesResults = await Promise.all(tilePromises);
        const validTiles = tilesResults.filter((result) => result !== null);
        const failedCount = totalTiles - validTiles.length;

        logger.debug(
          `✅ Loaded ${validTiles.length}/${totalTiles} tiles successfully (${failedCount} failed)`,
        );

        // If more than half the tiles failed, this might be a coverage issue
        if (failedCount > totalTiles * 0.5 && zoom > 8) {
          const warningMessage = `High tile failure rate (${failedCount}/${totalTiles}), area may be outside USGS coverage`;
          logger.warn(warningMessage);
          setHillshadeError("Limited hillshade coverage for this area");
        }

        // If no tiles loaded at all, try a lower zoom level as fallback
        if (validTiles.length === 0 && zoom > 5) {
          logger.warn(
            "⚠️ No hillshade tiles loaded successfully - trying lower zoom level",
          );
          const fallbackZoom = Math.max(5, zoom - 2);
          logger.debug(`🔄 Retrying with fallback zoom level ${fallbackZoom}`);

          // Recalculate tile coordinates with fallback zoom
          const fallbackN = Math.pow(2, fallbackZoom);
          const fallbackMinTileX = Math.max(
            0,
            Math.floor(lng2tile(bboxData[0], fallbackZoom)),
          );
          const fallbackMaxTileX = Math.min(
            fallbackN - 1,
            Math.floor(lng2tile(bboxData[2], fallbackZoom)),
          );
          const fallbackMinTileY = Math.max(
            0,
            Math.floor(lat2tile(bboxData[3], fallbackZoom)),
          );
          const fallbackMaxTileY = Math.min(
            fallbackN - 1,
            Math.floor(lat2tile(bboxData[1], fallbackZoom)),
          );

          logger.debug(
            `🧩 Fallback tile range at zoom ${fallbackZoom}: X(${fallbackMinTileX}-${fallbackMaxTileX}), Y(${fallbackMinTileY}-${fallbackMaxTileY})`,
          );

          // Create fallback tile promises with throttling
          const fallbackPromises: Promise<{
            img: HTMLImageElement;
            tileX: number;
            tileY: number;
            zoom: number;
          } | null>[] = [];

          for (
            let tileX = fallbackMinTileX;
            tileX <= fallbackMaxTileX;
            tileX++
          ) {
            for (
              let tileY = fallbackMinTileY;
              tileY <= fallbackMaxTileY;
              tileY++
            ) {
              const tileUrl = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/${fallbackZoom}/${tileY}/${tileX}`;

              const promise = new Promise<{
                img: HTMLImageElement;
                tileX: number;
                tileY: number;
                zoom: number;
              } | null>((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";

                const timeout = setTimeout(() => {
                  console.warn(
                    `Fallback tile timeout: ${tileX}/${tileY}/${fallbackZoom}`,
                  );
                  resolve(null);
                }, 3000);

                img.onload = () => {
                  clearTimeout(timeout);
                  if (img.width > 0 && img.height > 0) {
                    resolve({ img, tileX, tileY, zoom: fallbackZoom });
                  } else {
                    resolve(null);
                  }
                };

                img.onerror = () => {
                  clearTimeout(timeout);
                  resolve(null);
                };

                img.src = tileUrl;
              });

              fallbackPromises.push(promise);
            }
          }

          // Try to load fallback tiles
          const fallbackResults = await Promise.all(fallbackPromises);
          const fallbackTiles = fallbackResults.filter(
            (result) => result !== null,
          );

          logger.debug(
            `✅ Fallback loaded ${fallbackTiles.length}/${fallbackPromises.length} tiles`,
          );

          if (fallbackTiles.length > 0) {
            // Draw fallback tiles using the fallback zoom level
            fallbackTiles.forEach((tile) => {
              if (!tile) return;

              const { img, tileX, tileY, zoom: tileZoom } = tile;

              const tileLng1 = tile2lng(tileX, tileZoom);
              const tileLng2 = tile2lng(tileX + 1, tileZoom);
              const tileLat1 = tile2lat(tileY, tileZoom);
              const tileLat2 = tile2lat(tileY + 1, tileZoom);

              const canvasX1 = Math.max(
                0,
                ((tileLng1 - bboxData[0]) / (bboxData[2] - bboxData[0])) *
                  canvasSize,
              );
              const canvasX2 = Math.min(
                canvasSize,
                ((tileLng2 - bboxData[0]) / (bboxData[2] - bboxData[0])) *
                  canvasSize,
              );
              const canvasY1 = Math.max(
                0,
                ((bboxData[3] - tileLat1) / (bboxData[3] - bboxData[1])) *
                  canvasSize,
              );
              const canvasY2 = Math.min(
                canvasSize,
                ((bboxData[3] - tileLat2) / (bboxData[3] - bboxData[1])) *
                  canvasSize,
              );

              const drawWidth = canvasX2 - canvasX1;
              const drawHeight = canvasY2 - canvasY1;

              if (drawWidth > 0 && drawHeight > 0) {
                const srcX =
                  tileLng1 < bboxData[0]
                    ? ((bboxData[0] - tileLng1) / (tileLng2 - tileLng1)) * 256
                    : 0;
                const srcY =
                  tileLat1 > bboxData[3]
                    ? ((tileLat1 - bboxData[3]) / (tileLat1 - tileLat2)) * 256
                    : 0;
                const srcWidth = Math.min(
                  256,
                  (256 * drawWidth) /
                    (((tileLng2 - tileLng1) / (bboxData[2] - bboxData[0])) *
                      canvasSize),
                );
                const srcHeight = Math.min(
                  256,
                  (256 * drawHeight) /
                    (((tileLat1 - tileLat2) / (bboxData[3] - bboxData[1])) *
                      canvasSize),
                );

                ctx.drawImage(
                  img,
                  srcX,
                  srcY,
                  srcWidth,
                  srcHeight,
                  canvasX1,
                  canvasY1,
                  drawWidth,
                  drawHeight,
                );
              }
            });

            logger.debug(
              "🎯 Fallback hillshade rendering completed successfully",
            );
            setHillshadeReady(true);
            return; // Exit successfully with fallback tiles
          }
        }

        // If still no tiles loaded at all, set error state
        if (validTiles.length === 0) {
          const errorMessage = "No hillshade data available for this area";
          logger.warn(
            "⚠️ No hillshade tiles loaded successfully - canvas will remain white",
          );
          setHillshadeError(errorMessage);
          return; // Exit early since we already have white background
        }

        // Draw loaded tiles
        validTiles.forEach((tile) => {
          if (!tile) return;

          const { img, tileX, tileY } = tile;

          // Calculate tile bounds in geographic coordinates
          const tileLng1 = tile2lng(tileX, zoom);
          const tileLng2 = tile2lng(tileX + 1, zoom);
          const tileLat1 = tile2lat(tileY, zoom);
          const tileLat2 = tile2lat(tileY + 1, zoom);

          // Calculate canvas coordinates with proper clipping
          const canvasX1 = Math.max(
            0,
            ((tileLng1 - bboxData[0]) / (bboxData[2] - bboxData[0])) *
              canvasSize,
          );
          const canvasX2 = Math.min(
            canvasSize,
            ((tileLng2 - bboxData[0]) / (bboxData[2] - bboxData[0])) *
              canvasSize,
          );
          const canvasY1 = Math.max(
            0,
            ((bboxData[3] - tileLat1) / (bboxData[3] - bboxData[1])) *
              canvasSize,
          );
          const canvasY2 = Math.min(
            canvasSize,
            ((bboxData[3] - tileLat2) / (bboxData[3] - bboxData[1])) *
              canvasSize,
          );

          const drawWidth = canvasX2 - canvasX1;
          const drawHeight = canvasY2 - canvasY1;

          // Only draw if the tile has a reasonable size
          if (drawWidth > 0 && drawHeight > 0) {
            // Calculate source clipping if tile extends beyond canvas
            const srcX =
              tileLng1 < bboxData[0]
                ? ((bboxData[0] - tileLng1) / (tileLng2 - tileLng1)) * 256
                : 0;
            const srcY =
              tileLat1 > bboxData[3]
                ? ((tileLat1 - bboxData[3]) / (tileLat1 - tileLat2)) * 256
                : 0;
            const srcWidth = Math.min(
              256,
              (256 * drawWidth) /
                (((tileLng2 - tileLng1) / (bboxData[2] - bboxData[0])) *
                  canvasSize),
            );
            const srcHeight = Math.min(
              256,
              (256 * drawHeight) /
                (((tileLat1 - tileLat2) / (bboxData[3] - bboxData[1])) *
                  canvasSize),
            );

            ctx.drawImage(
              img,
              srcX,
              srcY,
              srcWidth,
              srcHeight,
              canvasX1,
              canvasY1,
              drawWidth,
              drawHeight,
            );
          }
        });

        logger.debug("🎯 Hillshade rendering completed successfully");
        setHillshadeReady(true);
      } catch (error) {
        const errorMessage = "Failed to load hillshade data";
        logger.error("❌ Error loading hillshade tiles:", error);
        setHillshadeError(errorMessage);
        // Fallback to white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        logger.debug("⚪ Fallback to white background due to error");
        setHillshadeReady(true); // Mark as ready even with error (white background)
      } finally {
        setIsRenderingHillshade(false);
      }
    },
    [],
  ); // No dependencies since we pass parameters

  // Separate effect for hillshade rendering - only when bounding box or snapshot changes
  useEffect(() => {
    logger.debug("🔄 Hillshade useEffect triggered", {
      bbox,
      mapSnapshot: !!mapSnapshot,
    });
    if (bbox && bbox.length === 4) {
      logger.debug("✅ Triggering hillshade background render");
      renderHillshadeBackground(400, bbox, mapSnapshot);
    } else {
      logger.debug("❌ Invalid bbox, skipping hillshade render", bbox);
    }
  }, [bbox, mapSnapshot, renderHillshadeBackground]); // Added back renderHillshadeBackground since it now has no dependencies

  // Canvas rendering - for route, labels, and composition
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasSize = 400;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const drawCurvedText = (
      text: string,
      angle: number, // angle in degrees (0 = top)
      radius: number,
      fontSize: number,
      fontFamily: string = "Trispace, monospace",
      bold: boolean = true,
      italic: boolean = false,
    ) => {
      ctx.save();
      ctx.translate(canvasSize / 2, canvasSize / 2);
      ctx.font = generateFontString(fontSize, fontFamily, bold, italic);
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Calculate if text should be flipped (bottom half of circle)
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const shouldFlip = normalizedAngle > 180;

      // Calculate text metrics for proper centering
      const textWidth = ctx.measureText(text).width;
      const totalAngle = textWidth / radius;

      // Convert angle to radians and adjust for top being 0°
      let startAngle = (angle - 90) * (Math.PI / 180) - totalAngle / 2;

      if (shouldFlip) {
        // Flip text by rotating 180° and reversing character order
        startAngle += Math.PI;
        text = text.split("").reverse().join("");
      }

      ctx.rotate(startAngle);

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charWidth = ctx.measureText(char).width;
        ctx.rotate(charWidth / 2 / radius);
        ctx.fillText(char, 0, shouldFlip ? radius : -radius);
        ctx.rotate(charWidth / 2 / radius);
      }
      ctx.restore();
    };

    const redraw = () => {
      if (!ctx) return;

      // Clear canvas first
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Draw cached hillshade background if ready
      if (hillshadeReady && hillshadeCanvasRef.current) {
        ctx.drawImage(hillshadeCanvasRef.current, 0, 0);
        logger.debug("🎨 Compositing cached hillshade");
      } else {
        // Fallback to white background while hillshade loads
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasSize, canvasSize);
      }

      // For ornaments, set up circular clipping
      if (designConfig.printType === "ornament") {
        const ornamentCircle = getOrnamentCircle();
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          ornamentCircle.x,
          ornamentCircle.y,
          ornamentCircle.radius,
          0,
          2 * Math.PI,
        );
        ctx.clip();
      }

      // Draw route
      const filteredPoints = gpxData.points.filter(
        (p: any) =>
          p.lat >= bbox[1] &&
          p.lat <= bbox[3] &&
          p.lon >= bbox[0] &&
          p.lon <= bbox[2],
      );
      if (filteredPoints.length > 1) {
        ctx.strokeStyle = designConfig.routeColor;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        filteredPoints.forEach((p: any, i: number) => {
          const x = ((p.lon - bbox[0]) / (bbox[2] - bbox[0])) * canvasSize;
          const y =
            canvasSize - ((p.lat - bbox[1]) / (bbox[3] - bbox[1])) * canvasSize;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Handle ornament-specific rendering
      if (designConfig.printType === "ornament") {
        ctx.restore(); // Restore from circular clipping

        const ornamentCircle = getOrnamentCircle();

        // Draw ornament circle border
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          ornamentCircle.x,
          ornamentCircle.y,
          ornamentCircle.radius,
          0,
          2 * Math.PI,
        );
        ctx.stroke();

        // Draw ornament labels as curved text
        designConfig.ornamentLabels.forEach((label: any) => {
          const fontOption = fontFamilyOptions.find(
            (f) => f.value === label.fontFamily,
          );
          drawCurvedText(
            label.text,
            label.angle,
            label.radius,
            label.size,
            fontOption?.cssFont || "Trispace, monospace",
            label.bold,
            label.italic,
          );
        });
      }
    };

    redraw();
  }, [
    gpxData,
    boundingBox,
    bbox,
    designConfig.routeColor, // Only route color affects canvas
    designConfig.printType, // Only print type affects canvas
    designConfig.ornamentLabels, // Only ornament labels are drawn on canvas
    getOrnamentCircle,
    fontFamilyOptions,
    hillshadeReady, // Only re-render when hillshade cache status changes
  ]);

  const handleConfigChange = (updates: any) => {
    onConfigChange({ ...designConfig, ...updates });
  };

  const handleLabelChange = (index: number, updates: any) => {
    const newLabels = [...designConfig.labels];
    newLabels[index] = { ...newLabels[index], ...updates };
    handleConfigChange({ labels: newLabels });
  };

  const addLabel = () => {
    const newLabelData = {
      text: "Label",
      x: 50,
      y: 50,
      rotation: 0,
      width: 100,
      height: 40,
      size: 18,
      fontFamily: "Trispace" as const,
      textAlign: "center" as const,
      bold: false,
      italic: false,
      color: "#1f2937",
    };

    const updatedLabels = [...designConfig.labels, newLabelData];
    handleConfigChange({ labels: updatedLabels });

    // Make the new label active
    setActiveLabel(updatedLabels.length - 1);
  };

  const quickAddLabel = (text: string) => {
    if (text) {
      if (designConfig.printType === "tile") {
        // Add tile label
        const updatedLabels = [
          ...designConfig.labels,
          {
            text,
            x: 50,
            y: 50,
            rotation: 0,
            width: 150,
            height: 50,
            size: 24,
            fontFamily: "Trispace" as const,
            textAlign: "center" as const,
            bold: true,
            italic: false,
            color: "#1f2937",
          },
        ];
        handleConfigChange({ labels: updatedLabels });
        setActiveLabel(updatedLabels.length - 1);
      } else if (designConfig.printType === "ornament") {
        // Add ornament label
        const updatedLabels = [
          ...designConfig.ornamentLabels,
          {
            text,
            angle: 0,
            radius: 180,
            size: 24,
            fontFamily: "Trispace" as const,
            bold: true,
            italic: false,
            color: "#1f2937",
          },
        ];
        handleConfigChange({ ornamentLabels: updatedLabels });
        setSelectedOrnamentLabelIndex(updatedLabels.length - 1);
      }
    }
  };

  const removeLabel = (index: number) => {
    const updatedLabels = designConfig.labels.filter((_, i) => i !== index);
    handleConfigChange({ labels: updatedLabels });
  };

  const removeOrnamentLabel = (index: number) => {
    const updatedLabels = designConfig.ornamentLabels.filter(
      (_, i) => i !== index,
    );
    handleConfigChange({ ornamentLabels: updatedLabels });
  };

  const handleOrnamentLabelChange = (index: number, updates: any) => {
    const newLabels = [...designConfig.ornamentLabels];
    newLabels[index] = { ...newLabels[index], ...updates };
    handleConfigChange({ ornamentLabels: newLabels });
  };

  const exportDesign = async () => {
    const zip = new JSZip();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    const exportSize = 1200;
    const scale = exportSize / 400;
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;

    // Draw the base canvas content
    exportCtx.drawImage(canvas, 0, 0, exportSize, exportSize);

    // Draw border around the entire canvas to match UI display
    const borderWidth = 2 * scale; // Scale the border width proportionally
    exportCtx.strokeStyle = "#64748b"; // slate-storm color to match UI
    exportCtx.lineWidth = borderWidth;
    exportCtx.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      exportSize - borderWidth,
      exportSize - borderWidth,
    );

    // Draw the HTML labels onto the export canvas
    if (designConfig.printType === "tile") {
      designConfig.labels.forEach((label) => {
        exportCtx.save();
        exportCtx.translate(
          label.x * scale + (label.width * scale) / 2,
          label.y * scale + (label.height * scale) / 2,
        );
        exportCtx.rotate((label.rotation * Math.PI) / 180);
        exportCtx.fillStyle = label.color || "#1f2937";

        const fontOption = fontFamilyOptions.find(
          (f) => f.value === label.fontFamily,
        );
        exportCtx.font = generateFontString(
          label.size * getTileSizeScaling() * scale,
          fontOption?.cssFont || "Trispace, monospace",
          label.bold,
          label.italic,
        );
        exportCtx.textAlign = label.textAlign || "center";
        exportCtx.textBaseline = "middle";
        // Convert HTML to plain text for export (basic approach)
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = label.text;
        const plainText = tempDiv.textContent || tempDiv.innerText || "";
        exportCtx.fillText(plainText, 0, 0);
        exportCtx.restore();
      });
    } else if (designConfig.printType === "ornament") {
      // Draw curved ornament labels onto the export canvas
      designConfig.ornamentLabels.forEach((label) => {
        const drawExportCurvedText = (
          text: string,
          angle: number,
          radius: number,
          fontSize: number,
          fontFamily: string,
          bold: boolean,
          italic: boolean,
        ) => {
          exportCtx.save();
          exportCtx.translate((400 * scale) / 2, (400 * scale) / 2);
          exportCtx.font = generateFontString(
            fontSize * scale,
            fontFamily,
            bold,
            italic,
          );
          exportCtx.fillStyle = label.color || "#1f2937";
          exportCtx.textAlign = "center";
          exportCtx.textBaseline = "middle";

          // Calculate if text should be flipped (bottom half of circle)
          const normalizedAngle = ((angle % 360) + 360) % 360;
          const shouldFlip = normalizedAngle > 180;

          // Calculate text metrics for proper centering
          const textWidth = exportCtx.measureText(text).width;
          const scaledRadius = radius * scale;
          const totalAngle = textWidth / scaledRadius;

          // Convert angle to radians and adjust for top being 0°
          let startAngle = (angle - 90) * (Math.PI / 180) - totalAngle / 2;

          if (shouldFlip) {
            // Flip text by rotating 180° and reversing character order
            startAngle += Math.PI;
            text = text.split("").reverse().join("");
          }

          exportCtx.rotate(startAngle);

          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = exportCtx.measureText(char).width;
            exportCtx.rotate(charWidth / 2 / scaledRadius);
            exportCtx.fillText(
              char,
              0,
              shouldFlip ? scaledRadius : -scaledRadius,
            );
            exportCtx.rotate(charWidth / 2 / scaledRadius);
          }
          exportCtx.restore();
        };

        const fontOption = fontFamilyOptions.find(
          (f) => f.value === label.fontFamily,
        );

        // Convert HTML to plain text for export
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = label.text;
        const plainText = tempDiv.textContent || tempDiv.innerText || "";

        drawExportCurvedText(
          plainText,
          label.angle,
          label.radius,
          label.size,
          fontOption?.cssFont || "Trispace, monospace",
          label.bold,
          label.italic,
        );
      });
    }

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      exportCanvas.toBlob(resolve, "image/png"),
    );
    if (pngBlob) {
      zip.file("design-preview.png", pngBlob);
    }

    // Add GPX route data
    const gpxString = gpxData.gpxString;
    zip.file("route-data.gpx", gpxString);

    // Create comprehensive order specifications
    const orderSpecs = {
      orderInfo: {
        printType: designConfig.printType,
        tileSize:
          designConfig.printType === "tile" ? designConfig.tileSize : undefined,
        routeColor: designConfig.routeColor,
        boundingBox: boundingBox,
        stravaActivityUrl: gpxData.activityId
          ? `https://www.strava.com/activities/${gpxData.activityId}`
          : undefined,
        timestamp: new Date().toISOString(),
        orderReference: `LF-${Date.now()}`,
      },
      labels:
        designConfig.printType === "tile"
          ? designConfig.labels.map((label) => ({
              text: label.text,
              position: { x: label.x, y: label.y },
              size: { width: label.width, height: label.height },
              typography: {
                fontFamily: label.fontFamily,
                fontSize: label.size,
                textAlign: label.textAlign,
                bold: label.bold,
                italic: label.italic,
                color: label.color,
              },
              rotation: label.rotation,
            }))
          : designConfig.ornamentLabels.map((label) => ({
              text: label.text,
              position: { angle: label.angle, radius: label.radius },
              typography: {
                fontFamily: label.fontFamily,
                fontSize: label.size,
                bold: label.bold,
                italic: label.italic,
                color: label.color,
              },
            })),
    };

    // Add machine-readable specifications
    zip.file("order-specifications.json", JSON.stringify(orderSpecs, null, 2));

    // Create human-readable order summary
    let orderSummary = `LANDFORM LABS - CUSTOM PRINT ORDER\n`;
    orderSummary += `=====================================\n\n`;
    orderSummary += `Order Reference: ${orderSpecs.orderInfo.orderReference}\n`;
    orderSummary += `Date: ${new Date().toLocaleDateString()}\n`;
    orderSummary += `Print Type: ${designConfig.printType.charAt(0).toUpperCase() + designConfig.printType.slice(1)}\n`;
    if (designConfig.printType === "tile") {
      const tileSizeInfo = {
        basecamp: "Basecamp (100mm × 100mm) - $20",
        ridgeline: "Ridgeline (155mm × 155mm) - $40",
        summit: "Summit (210mm × 210mm) - $60",
      };
      orderSummary += `Tile Size: ${tileSizeInfo[designConfig.tileSize]}\n`;
    }
    orderSummary += `Route Color: ${designConfig.routeColor}\n\n`;

    orderSummary += `ROUTE INFORMATION:\n`;
    orderSummary += `Bounding Box: ${boundingBox}\n\n`;

    if (designConfig.printType === "tile") {
      orderSummary += `TILE LABELS (${designConfig.labels.length}):\n`;
      designConfig.labels.forEach((l, i) => {
        orderSummary += `  ${i + 1}. "${l.text}"\n`;
        orderSummary += `     Font: ${l.fontFamily}, ${l.size}px\n`;
        orderSummary += `     Style: ${l.bold ? "Bold" : "Normal"} ${l.italic ? "Italic" : "Regular"}\n`;
        orderSummary += `     Alignment: ${l.textAlign}\n`;
        orderSummary += `     Position: (${l.x}, ${l.y}) ${l.width}x${l.height}px\n`;
        orderSummary += `     Rotation: ${l.rotation}°\n\n`;
      });
    } else {
      orderSummary += `ORNAMENT LABELS (${designConfig.ornamentLabels.length}):\n`;
      designConfig.ornamentLabels.forEach((l, i) => {
        orderSummary += `  ${i + 1}. "${l.text}"\n`;
        orderSummary += `     Font: ${l.fontFamily}, ${l.size}px\n`;
        orderSummary += `     Style: ${l.bold ? "Bold" : "Normal"} ${l.italic ? "Italic" : "Regular"}\n`;
        orderSummary += `     Position: ${l.angle}° angle, ${l.radius}px from center\n\n`;
      });
    }

    orderSummary += `FILES INCLUDED:\n`;
    orderSummary += `- route-data.gpx: Original GPS route data\n`;
    orderSummary += `- design-preview.png: High-resolution design preview\n`;
    orderSummary += `- order-specifications.json: Machine-readable specifications\n`;
    orderSummary += `- order-summary.txt: This human-readable summary\n\n`;
    orderSummary += `To place your order, email this entire ZIP file to: orders@landformlabs.co\n`;

    zip.file("order-summary.txt", orderSummary);

    zip.generateAsync({ type: "blob" }).then((content) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `landform-labs-order-${orderSpecs.orderInfo.orderReference.split("-")[1]}.zip`;
      link.click();
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-0">
      {/* Design Preview */}
      <div>
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <h2 className="text-xl sm:text-2xl font-headline font-bold text-basalt">
              Design Preview
            </h2>
            <div className="flex items-center gap-4">
              {/* Print Type Selection */}
              <div className="min-w-32 sm:min-w-40">
                <RichPrintTypeDropdown
                  printType={designConfig.printType}
                  tileSize={designConfig.tileSize}
                  onChange={(printType, tileSize) => {
                    const updates: any = { printType };
                    
                    // Clear labels when switching print types to avoid conflicts
                    if (printType === "tile") {
                      // Switching to tile mode - clear ornament labels
                      updates.ornamentLabels = [];
                    } else if (printType === "ornament") {
                      // Switching to ornament mode - clear tile labels
                      updates.labels = [];
                    }
                    
                    if (tileSize) {
                      updates.tileSize = tileSize;
                    }
                    
                    handleConfigChange(updates);
                    
                    // Clear active selections when switching modes
                    setActiveLabel(null);
                    setSelectedOrnamentLabelIndex(null);
                  }}
                />
              </div>
              <button
                onClick={exportDesign}
                className="btn-primary w-full sm:w-auto"
              >
                Export Design
              </button>
            </div>
          </div>

          {/* Activity Details Section */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-headline font-bold text-basalt mb-3">
              Activity Details
            </h3>
            <div className="space-y-2 text-sm">
              {gpxData.activityName && (
                <div className="flex justify-between items-start gap-4">
                  <span className="font-semibold text-slate-storm flex-shrink-0">
                    Name:
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-basalt text-right flex-1"
                      title={gpxData.activityName}
                    >
                      {gpxData.activityName}
                    </span>
                    <button
                      onClick={() => quickAddLabel(gpxData.activityName)}
                      className="text-xs bg-summit-sage text-white px-2 py-1 rounded hover:bg-summit-sage/90 flex-shrink-0"
                    >
                      + Label
                    </button>
                  </div>
                </div>
              )}

              {gpxData.date && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-storm">Date:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-basalt">
                      {new Date(gpxData.date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() =>
                        quickAddLabel(
                          new Date(gpxData.date).toLocaleDateString(),
                        )
                      }
                      className="text-xs bg-summit-sage text-white px-2 py-1 rounded hover:bg-summit-sage/90"
                    >
                      + Label
                    </button>
                  </div>
                </div>
              )}

              {gpxData.distance && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-storm">
                    Distance:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-basalt">
                      {formatDistance(gpxData.distance)}
                    </span>
                    {/* Distance unit toggle switch */}
                    <div className="relative inline-flex bg-slate-200 rounded-full p-0.5">
                      <button
                        onClick={() => setDistanceUnit('km')}
                        className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                          distanceUnit === 'km'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        km
                      </button>
                      <button
                        onClick={() => setDistanceUnit('miles')}
                        className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                          distanceUnit === 'miles'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        mi
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        quickAddLabel(formatDistance(gpxData.distance))
                      }
                      className="text-xs bg-summit-sage text-white px-2 py-1 rounded hover:bg-summit-sage/90"
                    >
                      + Label
                    </button>
                  </div>
                </div>
              )}

              {gpxData.duration && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-storm">Time:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-basalt">
                      {new Date(gpxData.duration).toISOString().substr(11, 8)}
                    </span>
                    <button
                      onClick={() =>
                        quickAddLabel(
                          new Date(gpxData.duration)
                            .toISOString()
                            .substr(11, 8),
                        )
                      }
                      className="text-xs bg-summit-sage text-white px-2 py-1 rounded hover:bg-summit-sage/90"
                    >
                      + Label
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Edit Menu Bar */}
          <div className="mb-4 bg-white border border-slate-300 rounded-lg shadow-sm p-2 sm:p-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Route Color Dropdown */}
              <div className="min-w-20 sm:min-w-24">
                <RichColorDropdown
                  options={colorOptions}
                  value={designConfig.routeColor}
                  onChange={(value) =>
                    handleConfigChange({ routeColor: value })
                  }
                  label="Route"
                />
              </div>

              {/* Add Label Button */}
              <button
                onClick={
                  designConfig.printType === "ornament"
                    ? () => {
                        const updatedLabels = [
                          ...designConfig.ornamentLabels,
                          {
                            text: "Label",
                            angle: 0,
                            radius: 180,
                            size: 24,
                            fontFamily: "Trispace" as const,
                            bold: true,
                            italic: false,
                          },
                        ];
                        handleConfigChange({ ornamentLabels: updatedLabels });
                        setSelectedOrnamentLabelIndex(
                          updatedLabels.length - 1,
                        );
                      }
                    : addLabel
                }
                className="inline-flex items-center gap-1 px-2 py-1.5 bg-summit-sage text-white rounded hover:bg-summit-sage/90 transition-colors text-sm"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Label
              </button>

              {/* Label Controls - Show when any label is selected */}
              {(activeLabel !== null || selectedOrnamentLabelIndex !== null) && (
                <>
                  {/* Font Family */}
                  <div className="min-w-24 sm:min-w-32">
                    <RichFontDropdown
                      options={fontFamilyOptions}
                      value={
                        designConfig.printType === "tile"
                          ? activeLabel !== null &&
                            designConfig.labels[activeLabel]
                            ? designConfig.labels[activeLabel].fontFamily
                            : "Trispace"
                          : selectedOrnamentLabelIndex !== null &&
                              designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ]
                            ? designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ].fontFamily
                            : "Trispace"
                      }
                      onChange={(value) => {
                        if (
                          designConfig.printType === "tile" &&
                          activeLabel !== null
                        ) {
                          handleLabelChange(activeLabel, {
                            fontFamily: value as any,
                          });
                        } else if (
                          designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex !== null
                        ) {
                          handleOrnamentLabelChange(
                            selectedOrnamentLabelIndex,
                            { fontFamily: value as any },
                          );
                        }
                      }}
                      disabled={
                        (designConfig.printType === "tile" &&
                          activeLabel === null) ||
                        (designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex === null)
                      }
                    />
                  </div>

                  {/* Font Size */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={
                        designConfig.printType === "tile"
                          ? activeLabel !== null &&
                            designConfig.labels[activeLabel]
                            ? designConfig.labels[activeLabel].size
                            : 18
                          : selectedOrnamentLabelIndex !== null &&
                              designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ]
                            ? designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ].size
                            : 24
                      }
                      onChange={(e) => {
                        if (
                          designConfig.printType === "tile" &&
                          activeLabel !== null
                        ) {
                          handleLabelChange(activeLabel, {
                            size: parseInt(e.target.value),
                          });
                        } else if (
                          designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex !== null
                        ) {
                          handleOrnamentLabelChange(
                            selectedOrnamentLabelIndex,
                            { size: parseInt(e.target.value) },
                          );
                        }
                      }}
                      disabled={
                        (designConfig.printType === "tile" &&
                          activeLabel === null) ||
                        (designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex === null)
                      }
                      className={`w-12 sm:w-16 ${
                        (designConfig.printType === "tile" &&
                          activeLabel === null) ||
                        (designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex === null)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <span
                      className={`text-xs text-slate-600 w-6 sm:w-8 ${
                        (designConfig.printType === "tile" &&
                          activeLabel === null) ||
                        (designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex === null)
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      {designConfig.printType === "tile"
                        ? activeLabel !== null &&
                          designConfig.labels[activeLabel]
                          ? Math.round(designConfig.labels[activeLabel].size)
                          : 18
                        : selectedOrnamentLabelIndex !== null &&
                            designConfig.ornamentLabels[
                              selectedOrnamentLabelIndex
                            ]
                          ? Math.round(
                              designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ].size,
                            )
                          : 24}
                      px
                    </span>
                  </div>

                  {/* Text Alignment - Only for tiles */}
                  {designConfig.printType === "tile" && (
                    <div className="flex gap-1">
                      {textAlignOptions.map((align) => (
                        <button
                          key={align.value}
                          onClick={() =>
                            activeLabel !== null &&
                            handleLabelChange(activeLabel, {
                              textAlign: align.value,
                            })
                          }
                          disabled={activeLabel === null}
                          className={`p-1.5 rounded transition-all ${
                            activeLabel !== null &&
                            designConfig.labels[activeLabel] &&
                            designConfig.labels[activeLabel].textAlign ===
                              align.value
                              ? "bg-summit-sage text-white"
                              : activeLabel === null
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                                : "bg-slate-100 hover:bg-slate-200 text-basalt"
                          }`}
                          title={align.name}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d={align.icon} />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text Color Dropdown */}
                  <div className="min-w-20 sm:min-w-24">
                    <RichColorDropdown
                      options={colorOptions}
                      value={
                        designConfig.printType === "tile"
                          ? activeLabel !== null &&
                            designConfig.labels[activeLabel]
                            ? designConfig.labels[activeLabel].color ||
                              "#1f2937"
                            : "#1f2937"
                          : selectedOrnamentLabelIndex !== null &&
                              designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ]
                            ? designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ].color || "#1f2937"
                            : "#1f2937"
                      }
                      onChange={(value) => {
                        if (
                          designConfig.printType === "tile" &&
                          activeLabel !== null
                        ) {
                          handleLabelChange(activeLabel, { color: value });
                        } else if (
                          designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex !== null
                        ) {
                          handleOrnamentLabelChange(
                            selectedOrnamentLabelIndex,
                            { color: value },
                          );
                        }
                      }}
                      disabled={
                        (designConfig.printType === "tile" &&
                          activeLabel === null) ||
                        (designConfig.printType === "ornament" &&
                          selectedOrnamentLabelIndex === null)
                      }
                      label="Text"
                    />
                  </div>

                  {/* Style Options */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (designConfig.printType === "tile" && activeLabel !== null) {
                          // Toggle bold property for tile label
                          handleLabelChange(activeLabel, {
                            bold: !designConfig.labels[activeLabel].bold,
                          });
                        } else if (designConfig.printType === "ornament" && selectedOrnamentLabelIndex !== null) {
                          // Toggle bold property for ornament label
                          handleOrnamentLabelChange(selectedOrnamentLabelIndex, {
                            bold: !designConfig.ornamentLabels[selectedOrnamentLabelIndex].bold,
                          });
                        }
                      }}
                      disabled={
                        (designConfig.printType === "tile" && activeLabel === null) ||
                        (designConfig.printType === "ornament" && selectedOrnamentLabelIndex === null)
                      }
                      className={`px-2 py-1.5 text-sm font-bold rounded transition-all ${
                        ((designConfig.printType === "tile" && activeLabel !== null &&
                        designConfig.labels[activeLabel] &&
                        designConfig.labels[activeLabel].bold) ||
                        (designConfig.printType === "ornament" && selectedOrnamentLabelIndex !== null &&
                        designConfig.ornamentLabels[selectedOrnamentLabelIndex] &&
                        designConfig.ornamentLabels[selectedOrnamentLabelIndex].bold))
                          ? "bg-summit-sage text-white"
                          : ((designConfig.printType === "tile" && activeLabel === null) ||
                            (designConfig.printType === "ornament" && selectedOrnamentLabelIndex === null))
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-slate-100 hover:bg-slate-200 text-basalt"
                      }`}
                      title="Toggle bold formatting"
                    >
                      B
                    </button>
                    <button
                      onClick={() => {
                        if (designConfig.printType === "tile" && activeLabel !== null) {
                          // Toggle italic property for tile label
                          handleLabelChange(activeLabel, {
                            italic: !designConfig.labels[activeLabel].italic,
                          });
                        } else if (designConfig.printType === "ornament" && selectedOrnamentLabelIndex !== null) {
                          // Toggle italic property for ornament label
                          handleOrnamentLabelChange(selectedOrnamentLabelIndex, {
                            italic: !designConfig.ornamentLabels[selectedOrnamentLabelIndex].italic,
                          });
                        }
                      }}
                      disabled={
                        (designConfig.printType === "tile" && activeLabel === null) ||
                        (designConfig.printType === "ornament" && selectedOrnamentLabelIndex === null)
                      }
                      className={`px-2 py-1.5 text-sm italic rounded transition-all ${
                        ((designConfig.printType === "tile" && activeLabel !== null &&
                        designConfig.labels[activeLabel] &&
                        designConfig.labels[activeLabel].italic) ||
                        (designConfig.printType === "ornament" && selectedOrnamentLabelIndex !== null &&
                        designConfig.ornamentLabels[selectedOrnamentLabelIndex] &&
                        designConfig.ornamentLabels[selectedOrnamentLabelIndex].italic))
                          ? "bg-summit-sage text-white"
                          : ((designConfig.printType === "tile" && activeLabel === null) ||
                            (designConfig.printType === "ornament" && selectedOrnamentLabelIndex === null))
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-slate-100 hover:bg-slate-200 text-basalt"
                      }`}
                      title="Toggle italic formatting"
                    >
                      I
                    </button>
                  </div>

                  {/* Ornament Position Controls - Only show when ornament label is selected */}
                  {designConfig.printType === "ornament" &&
                    selectedOrnamentLabelIndex !== null && (
                      <>
                        {/* Angle Control */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 whitespace-nowrap">
                            Angle:
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={
                              designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ].angle || 0
                            }
                            onChange={(e) =>
                              handleOrnamentLabelChange(
                                selectedOrnamentLabelIndex,
                                {
                                  angle: parseInt(e.target.value),
                                },
                              )
                            }
                            className="w-16"
                          />
                          <span className="text-xs text-slate-600 w-8">
                            {(
                              designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ].angle || 0
                            ).toFixed(0)}
                            °
                          </span>
                        </div>

                        {/* Distance Control */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 whitespace-nowrap">
                            Distance:
                          </span>
                          <input
                            type="range"
                            min="120"
                            max="220"
                            value={
                              designConfig.ornamentLabels[
                                selectedOrnamentLabelIndex
                              ].radius || 180
                            }
                            onChange={(e) =>
                              handleOrnamentLabelChange(
                                selectedOrnamentLabelIndex,
                                {
                                  radius: parseInt(e.target.value),
                                },
                              )
                            }
                            className="w-16"
                          />
                          <span className="text-xs text-slate-600 w-8">
                            {designConfig.ornamentLabels[
                              selectedOrnamentLabelIndex
                            ].radius || 180}
                            px
                          </span>
                        </div>
                      </>
                    )}
                </>
              )}

              {/* Help Text - Simplified to prevent layout shift */}
              <div className="hidden xl:block text-xs text-slate-500 min-w-0 ml-4">
                <span
                  className={
                    (designConfig.printType === "tile" &&
                      activeLabel === null) ||
                    (designConfig.printType === "ornament" &&
                      selectedOrnamentLabelIndex === null)
                      ? "opacity-50"
                      : ""
                  }
                >
                  {designConfig.printType === "tile"
                    ? activeLabel === null
                      ? "Click to select or add label"
                      : "Double-click to edit text"
                    : selectedOrnamentLabelIndex === null
                      ? "Click to select or add label"
                      : "Double-click to edit text"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center px-2 sm:px-0">
            <div
              className="relative w-full max-w-md aspect-square"
              style={{
                maxWidth: "400px",
                width: "min(400px, calc(100vw - 2rem))",
              }}
              onClick={(e) => {
                // Deselect active label when clicking on canvas background
                const target = e.target as HTMLElement;
                if (target === e.currentTarget || target.tagName === "CANVAS") {
                  setActiveLabel(null);
                  setEditingLabel(null);
                  setSelectedOrnamentLabelIndex(null);
                }
              }}
              onDoubleClick={(e) => {
                // Handle double-click on canvas for ornament labels
                if (designConfig.printType === "ornament") {
                  const target = e.target as HTMLElement;
                  if (target === e.currentTarget || target.tagName === "CANVAS") {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const canvasX = e.clientX - rect.left;
                    const canvasY = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    // Check if click is within reasonable distance of any ornament label
                    for (let i = 0; i < designConfig.ornamentLabels.length; i++) {
                      const label = designConfig.ornamentLabels[i];
                      const angle = (label.angle - 90) * (Math.PI / 180);
                      const labelX = centerX + Math.cos(angle) * (label.radius * rect.width / 400);
                      const labelY = centerY + Math.sin(angle) * (label.radius * rect.height / 400);
                      
                      const distance = Math.sqrt((canvasX - labelX) ** 2 + (canvasY - labelY) ** 2);
                      if (distance < 30) { // 30px threshold
                        setEditingOrnamentLabel(i);
                        return;
                      }
                    }
                  }
                }
              }}
            >
              <canvas
                ref={canvasRef}
                className="border border-slate-storm/20 rounded-lg shadow-sm absolute top-0 left-0 w-full h-full"
              />

              {/* Loading overlay */}
              {isRenderingHillshade && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600">
                      Loading hillshade...
                    </p>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {hillshadeError && !isRenderingHillshade && (
                <div className="absolute top-2 left-2 right-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-4 w-4 text-yellow-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-yellow-800">
                        {hillshadeError}
                      </p>
                      <button
                        onClick={() => {
                          setHillshadeError(null);
                          // Trigger hillshade re-render using the cached approach
                          if (bbox && bbox.length === 4) {
                            renderHillshadeBackground(400, bbox, mapSnapshot);
                          }
                        }}
                        className="text-xs text-yellow-600 hover:text-yellow-800 underline mt-1"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {designConfig.printType === "tile" &&
                designConfig.labels.map((label, index) => {
                  // Optimize font lookup by avoiding repeated find operations
                  const fontOption = fontFamilyOptions.find(
                    (f) => f.value === label.fontFamily,
                  );
                  const fontFamily =
                    fontOption?.cssFont || "Trispace, monospace";

                  // Optimize text alignment calculation
                  const justifyContent =
                    label.textAlign === "left"
                      ? "flex-start"
                      : label.textAlign === "right"
                        ? "flex-end"
                        : "center";

                  return (
                    <Rnd
                      key={index}
                      size={{ width: label.width, height: label.height }}
                      position={{ x: label.x, y: label.y }}
                      onDragStop={(e, d) => {
                        handleLabelChange(index, { x: d.x, y: d.y });
                      }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setActiveLabel(activeLabel === index ? null : index);
                        // Clear ornament label selection when selecting tile label
                        setSelectedOrnamentLabelIndex(null);
                      }}
                      onDoubleClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setEditingLabel(index);
                        setEditingText(label.text);
                        // Focus the contentEditable after state update
                        setTimeout(() => {
                          if (editableRef.current) {
                            editableRef.current.focus();
                          }
                        }, 0);
                      }}
                      onResize={(e, direction, ref, delta, position) => {
                        const newWidth = parseInt(ref.style.width);
                        const newHeight = parseInt(ref.style.height);
                        handleLabelChange(index, {
                          width: newWidth,
                          height: newHeight,
                          ...position,
                        });
                      }}
                      minWidth={50}
                      minHeight={30}
                      bounds="parent"
                      style={{
                        transform: `rotate(${label.rotation}deg)`,
                      }}
                      className={`flex items-center justify-center transition-all duration-75 cursor-pointer ${
                        activeLabel === index
                          ? "border-2 border-summit-sage bg-summit-sage/10 shadow-sm"
                          : "border border-gray-300/30 bg-transparent hover:border-gray-400/50 hover:bg-gray-50/10"
                      }`}
                      resizeHandleClasses={{
                        bottom: "!hidden",
                        bottomLeft:
                          activeLabel === index
                            ? "!w-2 !h-2 !bg-summit-sage !border-white !border !rounded-full !opacity-90"
                            : "!hidden",
                        bottomRight:
                          activeLabel === index
                            ? "!w-2 !h-2 !bg-summit-sage !border-white !border !rounded-full !opacity-90"
                            : "!hidden",
                        left: "!hidden",
                        right: "!hidden",
                        top: "!hidden",
                        topLeft:
                          activeLabel === index
                            ? "!w-2 !h-2 !bg-summit-sage !border-white !border !rounded-full !opacity-90"
                            : "!hidden",
                        topRight:
                          activeLabel === index
                            ? "!w-2 !h-2 !bg-summit-sage !border-white !border !rounded-full !opacity-90"
                            : "!hidden",
                      }}
                    >
                      <div className="w-full h-full relative">
                        {editingLabel === index ? (
                          <div
                            ref={editableRef}
                            contentEditable
                            suppressContentEditableWarning
                            dangerouslySetInnerHTML={{ __html: label.text }}
                            onBlur={() => {
                              if (editableRef.current) {
                                const newText = editableRef.current.innerHTML;
                                handleLabelChange(index, { text: newText });
                                setEditingLabel(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (editableRef.current) {
                                  const newText = editableRef.current.innerHTML;
                                  handleLabelChange(index, { text: newText });
                                  setEditingLabel(null);
                                }
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingLabel(null);
                              }
                            }}
                            className="w-full h-full bg-transparent border-2 border-summit-sage rounded p-1 outline-none overflow-hidden flex items-center"
                            style={{
                              fontSize: label.size * getTileSizeScaling(),
                              fontFamily,
                              textAlign: label.textAlign || "center",
                              color: label.color || "#1f2937",
                              cursor: "text",
                              lineHeight: "1.2",
                              justifyContent,
                              fontWeight: label.bold ? "bold" : "normal",
                              fontStyle: label.italic ? "italic" : "normal",
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center text-center p-1 cursor-pointer"
                            style={{
                              fontSize: label.size * getTileSizeScaling(),
                              fontFamily,
                              textAlign: label.textAlign || "center",
                              justifyContent,
                              color: label.color || "#1f2937",
                              fontWeight: label.bold ? "bold" : "normal",
                              fontStyle: label.italic ? "italic" : "normal",
                            }}
                            dangerouslySetInnerHTML={{ __html: label.text }}
                          />
                        )}

                        {/* Delete button for active label */}
                        {activeLabel === index && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLabel(index);
                              setActiveLabel(null);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </Rnd>
                  );
                })}

              {/* Ornament label selection and editing overlay */}
              {designConfig.printType === "ornament" && (
                <div className="absolute inset-0">
                  {/* Invisible click zones for ornament labels */}
                  {designConfig.ornamentLabels.map((label, index) => {
                    const angle = (label.angle - 90) * (Math.PI / 180);
                    const x = 200 + Math.cos(angle) * label.radius;
                    const y = 200 + Math.sin(angle) * label.radius;
                    
                    return (
                      <div
                        key={index}
                        className={`absolute cursor-pointer ${
                          selectedOrnamentLabelIndex === index
                            ? "bg-summit-sage/20 border-2 border-summit-sage rounded-lg"
                            : "hover:bg-slate-100/20 rounded"
                        }`}
                        style={{
                          left: x - 30,
                          top: y - 15,
                          width: 60,
                          height: 30,
                          transform: `rotate(${label.angle}deg)`,
                          transformOrigin: "center",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrnamentLabelIndex(
                            selectedOrnamentLabelIndex === index ? null : index,
                          );
                          setActiveLabel(null);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          const newText = prompt("Enter label text:", label.text.replace(/<[^>]*>/g, ''));
                          if (newText !== null) {
                            handleOrnamentLabelChange(index, { text: newText });
                          }
                        }}
                      >
                        {/* Delete button for selected ornament label */}
                        {selectedOrnamentLabelIndex === index && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOrnamentLabel(index);
                              setSelectedOrnamentLabelIndex(null);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Text editing modal for ornament labels */}
                  {editingOrnamentLabel !== null && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Edit Label Text</h3>
                        <input
                          ref={ornamentEditableRef}
                          type="text"
                          defaultValue={designConfig.ornamentLabels[editingOrnamentLabel]?.text.replace(/<[^>]*>/g, '') || ''}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-sage"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const newText = (e.target as HTMLInputElement).value;
                              if (editingOrnamentLabel !== null) {
                                handleOrnamentLabelChange(editingOrnamentLabel, { text: newText });
                              }
                              setEditingOrnamentLabel(null);
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingOrnamentLabel(null);
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              if (ornamentEditableRef.current && editingOrnamentLabel !== null) {
                                const newText = ornamentEditableRef.current.value;
                                handleOrnamentLabelChange(editingOrnamentLabel, { text: newText });
                              }
                              setEditingOrnamentLabel(null);
                            }}
                            className="flex-1 bg-summit-sage text-white py-2 px-4 rounded-lg hover:bg-summit-sage/90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingOrnamentLabel(null)}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Size Display */}
          <div className="mt-4 text-center">
            {designConfig.printType === "ornament" ? (
              <div className="inline-flex items-center px-4 py-2 bg-alpine-mist rounded-lg">
                <span className="text-sm font-semibold text-basalt font-trispace">
                  75mm diameter
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex items-center px-4 py-2 bg-alpine-mist rounded-lg">
                  <span className="text-sm font-semibold text-basalt font-trispace">
                    {designConfig.tileSize === "basecamp" && "100mm × 100mm"}
                    {designConfig.tileSize === "ridgeline" && "155mm × 155mm"}
                    {designConfig.tileSize === "summit" && "210mm × 210mm"}
                  </span>
                </div>
                <div className="text-xs text-slate-storm">
                  {designConfig.tileSize === "basecamp" && "Basecamp Size"}
                  {designConfig.tileSize === "ridgeline" && "Ridgeline Size"}
                  {designConfig.tileSize === "summit" && "Summit Size"}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-storm">
              Preview shows your selected area with route overlay
            </p>
            <p className="text-xs text-slate-storm/70 mt-1">
              Export will generate a high-resolution 1200x1200px PNG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
