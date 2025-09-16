"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Rnd } from "react-rnd";
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
    }>;
    ornamentLabels: Array<{
      text: string;
      angle: number; // Position around circle in degrees (0 = top)
      radius: number; // Distance from center
      size: number;
      fontFamily: "Garamond" | "Poppins" | "Trispace";
      bold: boolean;
      italic: boolean;
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
  const [isRenderingHillshade, setIsRenderingHillshade] = useState(false);
  const [hillshadeError, setHillshadeError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState({
    text: "",
    fontFamily: "Trispace" as "Garamond" | "Poppins" | "Trispace",
    textAlign: "center" as "left" | "center" | "right",
    bold: true,
    italic: false,
  });
  const [newOrnamentLabel, setNewOrnamentLabel] = useState({
    text: "",
    angle: 0, // Position around circle in degrees (0 = top)
    radius: 180, // Distance from center
    size: 24,
    fontFamily: "Trispace" as "Garamond" | "Poppins" | "Trispace",
    bold: true,
    italic: false,
  });
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(
    null,
  );
  const [selectedOrnamentLabelIndex, setSelectedOrnamentLabelIndex] = useState<
    number | null
  >(null);

  // Parse bounding box coordinates
  const bbox = boundingBox.split(",").map(Number); // [minLng, minLat, maxLng, maxLat]

  // Color options for routes
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
        cssFont: "var(--font-trispace), monospace",
      },
      {
        name: "Garamond",
        value: "Garamond" as const,
        cssFont: "var(--font-eb-garamond), serif",
      },
      {
        name: "Poppins",
        value: "Poppins" as const,
        cssFont: "var(--font-poppins), sans-serif",
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

  // Helper function to fetch and render hillshade background
  const renderHillshadeBackground = useCallback(async (ctx: CanvasRenderingContext2D, canvasSize: number) => {
    setIsRenderingHillshade(true);
    setHillshadeError(null);
    
    logger.debug("🗻 Starting hillshade rendering...");
    try {
      // Start with white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Validate bounding box
      if (!bbox || bbox.length !== 4 || bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) {
        const errorMessage = "Invalid bounding box coordinates";
        logger.error("❌ Invalid bounding box:", bbox);
        setHillshadeError(errorMessage);
        return;
      }

      logger.debug("📍 Bounding box:", bbox);

      // Calculate appropriate zoom level based on bounding box size
      const latDiff = bbox[3] - bbox[1]; // maxLat - minLat
      const lngDiff = bbox[2] - bbox[0]; // maxLng - minLng
      const maxDiff = Math.max(latDiff, lngDiff);
      
      // Enhanced zoom level selection for better detail on small areas
      let zoom = 10;
      if (maxDiff < 0.0002) zoom = 19;      // Ultra small areas - maximum detail
      else if (maxDiff < 0.0004) zoom = 18; // Very small areas
      else if (maxDiff < 0.0007) zoom = 17; // Tiny areas
      else if (maxDiff < 0.001) zoom = 16;  // Small areas
      else if (maxDiff < 0.002) zoom = 15;
      else if (maxDiff < 0.005) zoom = 14;
      else if (maxDiff < 0.01) zoom = 13;
      else if (maxDiff < 0.02) zoom = 12;
      else if (maxDiff < 0.05) zoom = 11;
      else if (maxDiff < 0.1) zoom = 10;
      else if (maxDiff < 0.5) zoom = 9;
      else zoom = 8;

      // If we have map metadata, override with exact zoom from selection page
      if (mapSnapshot && mapSnapshot.startsWith('data:application/json;base64,')) {
        logger.debug("📸 Using map metadata for consistent rendering");
        try {
          // Browser compatibility check for atob
          if (typeof atob === 'undefined') {
            throw new Error('Base64 decoding not supported in this browser');
          }
          
          const base64Data = mapSnapshot.split(',')[1];
          const metadataJson = atob(base64Data);
          const metadata = JSON.parse(metadataJson);
          
          logger.debug("🔍 Map metadata:", metadata);
          
          // Use the exact zoom level from the selection page
          const exactZoom = metadata.zoom;
          logger.debug(`🎯 Using exact zoom level ${exactZoom} from selection page`);
          
          // Override the automatic zoom calculation
          const originalZoomCalculation = zoom;
          zoom = Math.round(exactZoom); // Use the exact zoom from selection
          logger.debug(`🔄 Overriding calculated zoom ${originalZoomCalculation} with selection zoom ${zoom}`);
          
        } catch (error) {
          logger.warn("⚠️ Failed to parse map metadata, falling back to calculated zoom");
        }
      }

      // Check if area might be outside main US coverage (rough bounds check)
      const centerLat = (bbox[1] + bbox[3]) / 2;
      const centerLng = (bbox[0] + bbox[2]) / 2;
      const isOutsideMainUS = centerLat < 24 || centerLat > 50 || centerLng < -125 || centerLng > -65;
      
      // Be more conservative with zoom levels outside main US coverage
      if (isOutsideMainUS && zoom > 14) {
        logger.debug(`Area appears to be outside main US coverage, reducing max zoom from ${zoom} to 14`);
        zoom = Math.min(zoom, 14);
      }

      // Clamp zoom to available range (USGS supports up to level 23)
      zoom = Math.max(3, Math.min(19, zoom));

      logger.debug(`🔍 Using zoom level ${zoom} for bbox size ${maxDiff.toFixed(6)}`);

      // Helper functions for tile coordinate conversion
      const lng2tile = (lng: number, zoom: number) => ((lng + 180) / 360) * Math.pow(2, zoom);
      const lat2tile = (lat: number, zoom: number) => {
        const latRad = lat * Math.PI / 180;
        return (1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * Math.pow(2, zoom);
      };
      
      const tile2lng = (x: number, zoom: number) => (x / Math.pow(2, zoom)) * 360 - 180;
      const tile2lat = (y: number, zoom: number) => {
        const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
        return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
      };

      // Calculate tile bounds more precisely
      const n = Math.pow(2, zoom);
      const minTileX = Math.floor(lng2tile(bbox[0], zoom));
      const maxTileX = Math.floor(lng2tile(bbox[2], zoom));
      const minTileY = Math.floor(lat2tile(bbox[3], zoom)); // Note: Y is flipped
      const maxTileY = Math.floor(lat2tile(bbox[1], zoom));

      // Ensure valid tile ranges
      let validMinTileX = Math.max(0, Math.min(minTileX, maxTileX));
      let validMaxTileX = Math.min(n - 1, Math.max(minTileX, maxTileX));
      let validMinTileY = Math.max(0, Math.min(minTileY, maxTileY));
      let validMaxTileY = Math.min(n - 1, Math.max(minTileY, maxTileY));

      logger.debug(`🧩 Initial tile range at zoom ${zoom}: X(${validMinTileX}-${validMaxTileX}), Y(${validMinTileY}-${validMaxTileY})`);

      // Limit number of tiles to prevent excessive requests and potential grey rendering
      let tileCountX = validMaxTileX - validMinTileX + 1;
      let tileCountY = validMaxTileY - validMinTileY + 1;
      let totalTiles = tileCountX * tileCountY;
      
      // Allow more tiles for higher zoom levels where detail matters
      const maxTiles = zoom >= 16 ? 16 : 12;
      
      if (totalTiles > maxTiles) {
        // Use a lower zoom level
        zoom = Math.max(8, zoom - 1);
        logger.debug(`Too many tiles (${totalTiles}), reducing zoom to ${zoom}`);
        
        // Recalculate with new zoom
        const newN = Math.pow(2, zoom);
        const newMinTileX = Math.floor(lng2tile(bbox[0], zoom));
        const newMaxTileX = Math.floor(lng2tile(bbox[2], zoom));
        const newMinTileY = Math.floor(lat2tile(bbox[3], zoom));
        const newMaxTileY = Math.floor(lat2tile(bbox[1], zoom));
        
        validMinTileX = Math.max(0, Math.min(newMinTileX, newMaxTileX));
        validMaxTileX = Math.min(newN - 1, Math.max(newMinTileX, newMaxTileX));
        validMinTileY = Math.max(0, Math.min(newMinTileY, newMaxTileY));
        validMaxTileY = Math.min(newN - 1, Math.max(newMinTileY, newMaxTileY));
        
        tileCountX = validMaxTileX - validMinTileX + 1;
        tileCountY = validMaxTileY - validMinTileY + 1;
        totalTiles = tileCountX * tileCountY;
        
        logger.debug(`Final tile range at zoom ${zoom}: X(${validMinTileX}-${validMaxTileX}), Y(${validMinTileY}-${validMaxTileY}) = ${totalTiles} tiles`);
      }

      // Create promises for tile images with throttling and better error handling
      const tilePromises: Promise<{img: HTMLImageElement, tileX: number, tileY: number} | null>[] = [];
      
      for (let tileX = validMinTileX; tileX <= validMaxTileX; tileX++) {
        for (let tileY = validMinTileY; tileY <= validMaxTileY; tileY++) {
          const tileUrl = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/${zoom}/${tileY}/${tileX}`;
          
          // Use throttled request to be respectful to the USGS service
          const promise = tileRequestThrottle.add(() => 
            new Promise<{img: HTMLImageElement, tileX: number, tileY: number} | null>((resolve) => {
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
                  resolve({img, tileX, tileY});
                } else {
                  logger.warn(`Invalid tile dimensions: ${tileX}/${tileY}/${zoom}`);
                  resolve(null);
                }
              };
              
              img.onerror = () => {
                clearTimeout(timeout);
                logger.warn(`Failed to load tile: ${tileX}/${tileY}/${zoom} - Tile not available`);
                resolve(null);
              };
              
              img.src = tileUrl;
            })
          );
          
          tilePromises.push(promise);
        }
      }

      // Wait for all tiles with proper timeout
      const tilesResults = await Promise.all(tilePromises);
      const validTiles = tilesResults.filter(result => result !== null);
      const failedCount = totalTiles - validTiles.length;
      
      logger.debug(`✅ Loaded ${validTiles.length}/${totalTiles} tiles successfully (${failedCount} failed)`);
      
      // If more than half the tiles failed, this might be a coverage issue
      if (failedCount > totalTiles * 0.5 && zoom > 8) {
        const warningMessage = `High tile failure rate (${failedCount}/${totalTiles}), area may be outside USGS coverage`;
        logger.warn(warningMessage);
        setHillshadeError("Limited hillshade coverage for this area");
      }

      // If no tiles loaded at all, try a lower zoom level as fallback
      if (validTiles.length === 0 && zoom > 5) {
        logger.warn("⚠️ No hillshade tiles loaded successfully - trying lower zoom level");
        const fallbackZoom = Math.max(5, zoom - 2);
        logger.debug(`🔄 Retrying with fallback zoom level ${fallbackZoom}`);
        
        // Recalculate tile coordinates with fallback zoom
        const fallbackN = Math.pow(2, fallbackZoom);
        const fallbackMinTileX = Math.max(0, Math.floor(lng2tile(bbox[0], fallbackZoom)));
        const fallbackMaxTileX = Math.min(fallbackN - 1, Math.floor(lng2tile(bbox[2], fallbackZoom)));
        const fallbackMinTileY = Math.max(0, Math.floor(lat2tile(bbox[3], fallbackZoom)));
        const fallbackMaxTileY = Math.min(fallbackN - 1, Math.floor(lat2tile(bbox[1], fallbackZoom)));
        
        logger.debug(`🧩 Fallback tile range at zoom ${fallbackZoom}: X(${fallbackMinTileX}-${fallbackMaxTileX}), Y(${fallbackMinTileY}-${fallbackMaxTileY})`);
        
        // Create fallback tile promises with throttling
        const fallbackPromises: Promise<{img: HTMLImageElement, tileX: number, tileY: number, zoom: number} | null>[] = [];
        
        for (let tileX = fallbackMinTileX; tileX <= fallbackMaxTileX; tileX++) {
          for (let tileY = fallbackMinTileY; tileY <= fallbackMaxTileY; tileY++) {
            const tileUrl = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/${fallbackZoom}/${tileY}/${tileX}`;
            
            const promise = new Promise<{img: HTMLImageElement, tileX: number, tileY: number, zoom: number} | null>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              
              const timeout = setTimeout(() => {
                console.warn(`Fallback tile timeout: ${tileX}/${tileY}/${fallbackZoom}`);
                resolve(null);
              }, 3000);
              
              img.onload = () => {
                clearTimeout(timeout);
                if (img.width > 0 && img.height > 0) {
                  resolve({img, tileX, tileY, zoom: fallbackZoom});
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
        const fallbackTiles = fallbackResults.filter(result => result !== null);
        
        logger.debug(`✅ Fallback loaded ${fallbackTiles.length}/${fallbackPromises.length} tiles`);
        
        if (fallbackTiles.length > 0) {
          // Draw fallback tiles using the fallback zoom level
          fallbackTiles.forEach(tile => {
            if (!tile) return;
            
            const {img, tileX, tileY, zoom: tileZoom} = tile;
            
            const tileLng1 = tile2lng(tileX, tileZoom);
            const tileLng2 = tile2lng(tileX + 1, tileZoom);
            const tileLat1 = tile2lat(tileY, tileZoom);
            const tileLat2 = tile2lat(tileY + 1, tileZoom);
            
            const canvasX1 = Math.max(0, ((tileLng1 - bbox[0]) / (bbox[2] - bbox[0])) * canvasSize);
            const canvasX2 = Math.min(canvasSize, ((tileLng2 - bbox[0]) / (bbox[2] - bbox[0])) * canvasSize);
            const canvasY1 = Math.max(0, ((bbox[3] - tileLat1) / (bbox[3] - bbox[1])) * canvasSize);
            const canvasY2 = Math.min(canvasSize, ((bbox[3] - tileLat2) / (bbox[3] - bbox[1])) * canvasSize);
            
            const drawWidth = canvasX2 - canvasX1;
            const drawHeight = canvasY2 - canvasY1;
            
            if (drawWidth > 0 && drawHeight > 0) {
              const srcX = tileLng1 < bbox[0] ? ((bbox[0] - tileLng1) / (tileLng2 - tileLng1)) * 256 : 0;
              const srcY = tileLat1 > bbox[3] ? ((tileLat1 - bbox[3]) / (tileLat1 - tileLat2)) * 256 : 0;
              const srcWidth = Math.min(256, 256 * drawWidth / ((tileLng2 - tileLng1) / (bbox[2] - bbox[0]) * canvasSize));
              const srcHeight = Math.min(256, 256 * drawHeight / ((tileLat1 - tileLat2) / (bbox[3] - bbox[1]) * canvasSize));
              
              ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, canvasX1, canvasY1, drawWidth, drawHeight);
            }
          });
          
          logger.debug("🎯 Fallback hillshade rendering completed successfully");
          return; // Exit successfully with fallback tiles
        }
      }
      
      // If still no tiles loaded at all, set error state
      if (validTiles.length === 0) {
        const errorMessage = "No hillshade data available for this area";
        logger.warn("⚠️ No hillshade tiles loaded successfully - canvas will remain white");
        setHillshadeError(errorMessage);
        return; // Exit early since we already have white background
      }

      // Draw loaded tiles
      validTiles.forEach(tile => {
        if (!tile) return;
        
        const {img, tileX, tileY} = tile;
        
        // Calculate tile bounds in geographic coordinates
        const tileLng1 = tile2lng(tileX, zoom);
        const tileLng2 = tile2lng(tileX + 1, zoom);
        const tileLat1 = tile2lat(tileY, zoom);
        const tileLat2 = tile2lat(tileY + 1, zoom);
        
        // Calculate canvas coordinates with proper clipping
        const canvasX1 = Math.max(0, ((tileLng1 - bbox[0]) / (bbox[2] - bbox[0])) * canvasSize);
        const canvasX2 = Math.min(canvasSize, ((tileLng2 - bbox[0]) / (bbox[2] - bbox[0])) * canvasSize);
        const canvasY1 = Math.max(0, ((bbox[3] - tileLat1) / (bbox[3] - bbox[1])) * canvasSize);
        const canvasY2 = Math.min(canvasSize, ((bbox[3] - tileLat2) / (bbox[3] - bbox[1])) * canvasSize);
        
        const drawWidth = canvasX2 - canvasX1;
        const drawHeight = canvasY2 - canvasY1;
        
        // Only draw if the tile has a reasonable size
        if (drawWidth > 0 && drawHeight > 0) {
          // Calculate source clipping if tile extends beyond canvas
          const srcX = tileLng1 < bbox[0] ? ((bbox[0] - tileLng1) / (tileLng2 - tileLng1)) * 256 : 0;
          const srcY = tileLat1 > bbox[3] ? ((tileLat1 - bbox[3]) / (tileLat1 - tileLat2)) * 256 : 0;
          const srcWidth = Math.min(256, 256 * drawWidth / ((tileLng2 - tileLng1) / (bbox[2] - bbox[0]) * canvasSize));
          const srcHeight = Math.min(256, 256 * drawHeight / ((tileLat1 - tileLat2) / (bbox[3] - bbox[1]) * canvasSize));
          
          ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, canvasX1, canvasY1, drawWidth, drawHeight);
        }
      });
      
      logger.debug("🎯 Hillshade rendering completed successfully");
      
    } catch (error) {
      const errorMessage = "Failed to load hillshade data";
      logger.error("❌ Error loading hillshade tiles:", error);
      setHillshadeError(errorMessage);
      // Fallback to white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      logger.debug("⚪ Fallback to white background due to error");
    } finally {
      setIsRenderingHillshade(false);
    }
  }, [bbox, mapSnapshot]);

  // Canvas rendering
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
      fontFamily: string = "var(--font-trispace), monospace",
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

    const redraw = async () => {
      if (!ctx) return;

      // Clear canvas first
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Draw hillshade background
      await renderHillshadeBackground(ctx, canvasSize);

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
            fontOption?.cssFont || "var(--font-trispace), monospace",
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
    designConfig,
    getOrnamentCircle,
    fontFamilyOptions,
    renderHillshadeBackground,
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
    if (newLabel.text.trim()) {
      const updatedLabels = [
        ...designConfig.labels,
        {
          text: newLabel.text,
          x: 50,
          y: 50,
          rotation: 0,
          width: 150,
          height: 50,
          size: 24,
          fontFamily: newLabel.fontFamily,
          textAlign: newLabel.textAlign,
          bold: newLabel.bold,
          italic: newLabel.italic,
        },
      ];
      handleConfigChange({ labels: updatedLabels });
      setNewLabel({
        text: "",
        fontFamily: "Trispace",
        textAlign: "center",
        bold: true,
        italic: false,
      });
    }
  };

  const quickAddLabel = (text: string) => {
    if (text) {
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
          fontFamily: "Trispace",
          textAlign: "center",
          bold: true,
          italic: false,
        },
      ];
      handleConfigChange({ labels: updatedLabels });
    }
  };

  const removeLabel = (index: number) => {
    const updatedLabels = designConfig.labels.filter((_, i) => i !== index);
    handleConfigChange({ labels: updatedLabels });
  };

  const addOrnamentLabel = () => {
    if (newOrnamentLabel.text.trim()) {
      const updatedLabels = [...designConfig.ornamentLabels, newOrnamentLabel];
      handleConfigChange({ ornamentLabels: updatedLabels });
      setNewOrnamentLabel({
        text: "",
        angle: 0, // Position around circle in degrees (0 = top)
        radius: 180, // Distance from center
        size: 24,
        fontFamily: "Trispace",
        bold: true,
        italic: false,
      });
    }
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
        exportCtx.fillStyle = "#1f2937";

        const fontOption = fontFamilyOptions.find(
          (f) => f.value === label.fontFamily,
        );
        exportCtx.font = generateFontString(
          label.size * getTileSizeScaling() * scale,
          fontOption?.cssFont || "var(--font-trispace), monospace",
          label.bold,
          label.italic,
        );
        exportCtx.textAlign = label.textAlign || "center";
        exportCtx.textBaseline = "middle";
        exportCtx.fillText(label.text, 0, 0);
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
          exportCtx.fillStyle = "#1f2937";
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

        drawExportCurvedText(
          label.text,
          label.angle,
          label.radius,
          label.size,
          fontOption?.cssFont || "var(--font-trispace), monospace",
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
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Design Controls */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6 space-y-6">
          <h3 className="text-xl font-headline font-bold text-basalt">
            Customize Design
          </h3>

          {/* Activity Details */}
          <div>
            <h3 className="text-xl font-headline font-bold text-basalt mb-3">
              Activity Details
            </h3>
            <div className="space-y-2 text-sm text-slate-storm">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Name:</span>
                <div className="flex items-center">
                  <span className="text-right mr-2">
                    {gpxData.activityName || "N/A"}
                  </span>
                  <button
                    onClick={() => quickAddLabel(gpxData.activityName)}
                    className="text-xs bg-slate-200 px-2 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Date:</span>
                <div className="flex items-center">
                  <span className="text-right mr-2">
                    {gpxData.date
                      ? new Date(gpxData.date).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <button
                    onClick={() =>
                      quickAddLabel(new Date(gpxData.date).toLocaleDateString())
                    }
                    className="text-xs bg-slate-200 px-2 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Distance:</span>
                <div className="flex items-center">
                  <span className="text-right mr-2">
                    {gpxData.distance
                      ? `${(gpxData.distance / 1000).toFixed(2)} km`
                      : "N/A"}
                  </span>
                  <button
                    onClick={() =>
                      quickAddLabel(
                        `${(gpxData.distance / 1000).toFixed(2)} km`,
                      )
                    }
                    className="text-xs bg-slate-200 px-2 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Time:</span>
                <div className="flex items-center">
                  <span className="text-right mr-2">
                    {gpxData.duration
                      ? new Date(gpxData.duration).toISOString().substr(11, 8)
                      : "N/A"}
                  </span>
                  <button
                    onClick={() =>
                      quickAddLabel(
                        new Date(gpxData.duration).toISOString().substr(11, 8),
                      )
                    }
                    className="text-xs bg-slate-200 px-2 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Route Color */}
          <div>
            <label className="block text-sm font-headline font-semibold text-basalt mb-3">
              Route Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() =>
                    handleConfigChange({ routeColor: color.value })
                  }
                  className={`relative w-full h-10 rounded-lg border-2 transition-all ${designConfig.routeColor === color.value ? "border-summit-sage scale-105" : "border-slate-storm/20 hover:border-slate-storm/40"}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {designConfig.routeColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Print Type */}
          <div>
            <label className="block text-sm font-headline font-semibold text-basalt mb-3">
              Print Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleConfigChange({ printType: "tile" })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${designConfig.printType === "tile" ? "border-summit-sage bg-summit-sage/5" : "border-slate-storm/20 hover:border-slate-storm/40"}`}
              >
                <div className="font-semibold text-basalt text-sm mb-1">
                  Route Tile
                </div>
                <div className="text-xs text-slate-storm">
                  Square display piece
                </div>
              </button>
              <button
                onClick={() => handleConfigChange({ printType: "ornament" })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${designConfig.printType === "ornament" ? "border-summit-sage bg-summit-sage/5" : "border-slate-storm/20 hover:border-slate-storm/40"}`}
              >
                <div className="font-semibold text-basalt text-sm mb-1">
                  Ornament
                </div>
                <div className="text-xs text-slate-storm">
                  Circular hanging piece
                </div>
              </button>
            </div>
          </div>

          {/* Tile Size Selection */}
          {designConfig.printType === "tile" && (
            <div>
              <label className="block text-sm font-headline font-semibold text-basalt mb-3">
                Tile Size
              </label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleConfigChange({ tileSize: "basecamp" })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${designConfig.tileSize === "basecamp" ? "border-summit-sage bg-summit-sage/5" : "border-slate-storm/20 hover:border-slate-storm/40"}`}
                >
                  <div className="font-semibold text-basalt text-sm mb-1">
                    Basecamp (100mm × 100mm)
                  </div>
                  <div className="text-xs text-slate-storm">
                    $20 - Perfect for desks and small spaces
                  </div>
                </button>
                <button
                  onClick={() => handleConfigChange({ tileSize: "ridgeline" })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${designConfig.tileSize === "ridgeline" ? "border-summit-sage bg-summit-sage/5" : "border-slate-storm/20 hover:border-slate-storm/40"}`}
                >
                  <div className="font-semibold text-basalt text-sm mb-1">
                    Ridgeline (155mm × 155mm)
                  </div>
                  <div className="text-xs text-slate-storm">
                    $40 - Great balance of size and detail
                  </div>
                </button>
                <button
                  onClick={() => handleConfigChange({ tileSize: "summit" })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${designConfig.tileSize === "summit" ? "border-summit-sage bg-summit-sage/5" : "border-slate-storm/20 hover:border-slate-storm/40"}`}
                >
                  <div className="font-semibold text-basalt text-sm mb-1">
                    Summit (210mm × 210mm)
                  </div>
                  <div className="text-xs text-slate-storm">
                    $60 - Maximum impact and detail
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Text Labels */}
          {designConfig.printType === "tile" ? (
            <div>
              <label className="block text-sm font-headline font-semibold text-basalt mb-3">
                Text Labels
              </label>

              <div className="space-y-3">
                {designConfig.labels.map((label, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedLabelIndex === index
                        ? "border-summit-sage bg-summit-sage/5"
                        : "border-slate-storm/20 bg-slate-50 hover:border-slate-storm/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          setSelectedLabelIndex(
                            selectedLabelIndex === index ? null : index,
                          )
                        }
                      >
                        <div className="text-sm font-semibold text-basalt">
                          {label.text}
                        </div>
                        <div className="text-xs text-slate-storm">
                          {label.fontFamily} • {label.textAlign} •{" "}
                          {Math.round(label.size)}px
                        </div>
                      </div>
                      <button
                        onClick={() => removeLabel(index)}
                        className="text-red-500 hover:text-red-700 p-1 ml-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    {selectedLabelIndex === index && (
                      <div className="space-y-3 pt-3 border-t border-slate-storm/10">
                        {/* Text Content */}
                        <div>
                          <label className="block text-xs font-semibold text-basalt mb-1">
                            Text
                          </label>
                          <input
                            type="text"
                            value={label.text}
                            onChange={(e) =>
                              handleLabelChange(index, { text: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-slate-storm/20 rounded text-sm focus-ring focus:border-summit-sage"
                          />
                        </div>

                        {/* Font Family */}
                        <div>
                          <label className="block text-xs font-semibold text-basalt mb-1">
                            Font Family
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {fontFamilyOptions.map((font) => (
                              <button
                                key={font.value}
                                onClick={() =>
                                  handleLabelChange(index, {
                                    fontFamily: font.value,
                                  })
                                }
                                className={`px-2 py-1 text-xs rounded transition-all ${
                                  label.fontFamily === font.value
                                    ? "bg-summit-sage text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-basalt"
                                }`}
                                style={{ fontFamily: font.cssFont }}
                              >
                                {font.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-semibold text-basalt mb-1">
                            Text Alignment
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {textAlignOptions.map((align) => (
                              <button
                                key={align.value}
                                onClick={() =>
                                  handleLabelChange(index, {
                                    textAlign: align.value,
                                  })
                                }
                                className={`p-2 rounded transition-all ${
                                  label.textAlign === align.value
                                    ? "bg-summit-sage text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-basalt"
                                }`}
                                title={align.name}
                              >
                                <svg
                                  className="w-3 h-3 mx-auto"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d={align.icon} />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Size */}
                        <div>
                          <label className="block text-xs font-semibold text-basalt mb-1">
                            Font Size: {Math.round(label.size)}px
                          </label>
                          <input
                            type="range"
                            min="12"
                            max="48"
                            value={label.size}
                            onChange={(e) =>
                              handleLabelChange(index, {
                                size: parseInt(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                        </div>

                        {/* Text Style */}
                        <div>
                          <label className="block text-xs font-semibold text-basalt mb-1">
                            Text Style
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() =>
                                handleLabelChange(index, { bold: !label.bold })
                              }
                              className={`px-3 py-2 text-sm font-bold rounded transition-all ${
                                label.bold
                                  ? "bg-summit-sage text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-basalt"
                              }`}
                            >
                              B
                            </button>
                            <button
                              onClick={() =>
                                handleLabelChange(index, {
                                  italic: !label.italic,
                                })
                              }
                              className={`px-3 py-2 text-sm italic rounded transition-all ${
                                label.italic
                                  ? "bg-summit-sage text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-basalt"
                              }`}
                            >
                              I
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="space-y-3 pt-4 border-t border-slate-storm/10">
                  <h4 className="text-sm font-semibold text-basalt">
                    Add New Label
                  </h4>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={newLabel.text}
                    onChange={(e) =>
                      setNewLabel({ ...newLabel, text: e.target.value })
                    }
                    placeholder="Enter label text..."
                    className="w-full px-3 py-2 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-sm"
                  />

                  {/* Font Family Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-basalt mb-1">
                      Font Family
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {fontFamilyOptions.map((font) => (
                        <button
                          key={font.value}
                          onClick={() =>
                            setNewLabel({ ...newLabel, fontFamily: font.value })
                          }
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            newLabel.fontFamily === font.value
                              ? "bg-summit-sage text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-basalt"
                          }`}
                          style={{ fontFamily: font.cssFont }}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Alignment Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-basalt mb-1">
                      Text Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {textAlignOptions.map((align) => (
                        <button
                          key={align.value}
                          onClick={() =>
                            setNewLabel({ ...newLabel, textAlign: align.value })
                          }
                          className={`p-2 rounded transition-all ${
                            newLabel.textAlign === align.value
                              ? "bg-summit-sage text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-basalt"
                          }`}
                          title={align.name}
                        >
                          <svg
                            className="w-3 h-3 mx-auto"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d={align.icon} />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Style Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-basalt mb-1">
                      Text Style
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() =>
                          setNewLabel({ ...newLabel, bold: !newLabel.bold })
                        }
                        className={`px-3 py-2 text-sm font-bold rounded transition-all ${
                          newLabel.bold
                            ? "bg-summit-sage text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-basalt"
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() =>
                          setNewLabel({ ...newLabel, italic: !newLabel.italic })
                        }
                        className={`px-3 py-2 text-sm italic rounded transition-all ${
                          newLabel.italic
                            ? "bg-summit-sage text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-basalt"
                        }`}
                      >
                        I
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={addLabel}
                    disabled={!newLabel.text.trim()}
                    className="btn-secondary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Label
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-headline font-semibold text-basalt mb-3">
                Ornament Labels
              </label>

              <div className="space-y-3">
                {designConfig.ornamentLabels.map((label, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedOrnamentLabelIndex === index
                        ? "border-summit-sage bg-summit-sage/5"
                        : "border-slate-storm/20 bg-slate-50 hover:border-slate-storm/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          setSelectedOrnamentLabelIndex(
                            selectedOrnamentLabelIndex === index ? null : index,
                          )
                        }
                      >
                        <div className="text-sm font-semibold text-basalt">
                          {label.text}
                        </div>
                        <div className="text-xs text-slate-storm">
                          {label.fontFamily} • {label.size}px •{" "}
                          {(label.angle || 0).toFixed(0)}° •{" "}
                          {label.bold ? "Bold" : "Normal"} •{" "}
                          {label.italic ? "Italic" : "Regular"}
                        </div>
                      </div>
                      <button
                        onClick={() => removeOrnamentLabel(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    {selectedOrnamentLabelIndex === index && (
                      <div className="space-y-3 pt-3 border-t border-slate-storm/10">
                        {/* Font Family Selection */}
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-basalt mb-1">
                            Font Family
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {fontFamilyOptions.map((font) => (
                              <button
                                key={font.value}
                                onClick={() =>
                                  handleOrnamentLabelChange(index, {
                                    fontFamily: font.value,
                                  })
                                }
                                className={`px-2 py-1 text-xs rounded transition-all ${
                                  label.fontFamily === font.value
                                    ? "bg-summit-sage text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-basalt"
                                }`}
                                style={{ fontFamily: font.cssFont }}
                              >
                                {font.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs text-slate-storm mb-1">
                          Size: {label.size}px
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={label.size}
                          onChange={(e) =>
                            handleOrnamentLabelChange(index, {
                              size: parseInt(e.target.value),
                            })
                          }
                          className="w-full mb-3"
                        />
                        <div className="text-xs text-slate-storm mb-1">
                          Position: {(label.angle || 0).toFixed(0)}° around
                          circle
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={label.angle || 0}
                          onChange={(e) =>
                            handleOrnamentLabelChange(index, {
                              angle: parseInt(e.target.value),
                            })
                          }
                          className="w-full mb-3"
                        />

                        <div className="text-xs text-slate-storm mb-1">
                          Distance: {label.radius || 180}px from center
                        </div>
                        <input
                          type="range"
                          min="120"
                          max="220"
                          value={label.radius || 180}
                          onChange={(e) =>
                            handleOrnamentLabelChange(index, {
                              radius: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />

                        {/* Text Style */}
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-basalt mb-1">
                            Text Style
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() =>
                                handleOrnamentLabelChange(index, {
                                  bold: !label.bold,
                                })
                              }
                              className={`px-3 py-2 text-sm font-bold rounded transition-all ${
                                label.bold
                                  ? "bg-summit-sage text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-basalt"
                              }`}
                            >
                              B
                            </button>
                            <button
                              onClick={() =>
                                handleOrnamentLabelChange(index, {
                                  italic: !label.italic,
                                })
                              }
                              className={`px-3 py-2 text-sm italic rounded transition-all ${
                                label.italic
                                  ? "bg-summit-sage text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-basalt"
                              }`}
                            >
                              I
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="space-y-3 pt-4 border-t border-slate-storm/10">
                  <h4 className="text-sm font-semibold text-basalt">
                    Add New Ornament Label
                  </h4>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={newOrnamentLabel.text}
                    onChange={(e) =>
                      setNewOrnamentLabel({
                        ...newOrnamentLabel,
                        text: e.target.value,
                      })
                    }
                    placeholder="Enter ornament label text..."
                    className="w-full px-3 py-2 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-sm"
                  />

                  {/* Font Family Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-basalt mb-1">
                      Font Family
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {fontFamilyOptions.map((font) => (
                        <button
                          key={font.value}
                          onClick={() =>
                            setNewOrnamentLabel({
                              ...newOrnamentLabel,
                              fontFamily: font.value,
                            })
                          }
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            newOrnamentLabel.fontFamily === font.value
                              ? "bg-summit-sage text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-basalt"
                          }`}
                          style={{ fontFamily: font.cssFont }}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Style Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-basalt mb-1">
                      Text Style
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() =>
                          setNewOrnamentLabel({
                            ...newOrnamentLabel,
                            bold: !newOrnamentLabel.bold,
                          })
                        }
                        className={`px-3 py-2 text-sm font-bold rounded transition-all ${
                          newOrnamentLabel.bold
                            ? "bg-summit-sage text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-basalt"
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() =>
                          setNewOrnamentLabel({
                            ...newOrnamentLabel,
                            italic: !newOrnamentLabel.italic,
                          })
                        }
                        className={`px-3 py-2 text-sm italic rounded transition-all ${
                          newOrnamentLabel.italic
                            ? "bg-summit-sage text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-basalt"
                        }`}
                      >
                        I
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={addOrnamentLabel}
                    disabled={!newOrnamentLabel.text.trim()}
                    className="btn-secondary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Ornament Label
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Info */}
          <div className="p-4 bg-summit-sage/5 rounded-lg">
            <h4 className="font-headline font-semibold text-basalt text-sm mb-2">
              Export Details
            </h4>
            <div className="text-xs text-slate-storm space-y-1">
              <p>• High-resolution PNG (1200x1200px)</p>
              <p>• Coordinates copied to clipboard</p>
              <p>• Ready for 3D printing order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Design Preview */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-headline font-bold text-basalt">
              Design Preview
            </h2>
            <div className="flex items-center">
              <button onClick={exportDesign} className="btn-primary">
                Export Design
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative" style={{ width: 400, height: 400 }}>
              <canvas
                ref={canvasRef}
                className="border border-slate-storm/20 rounded-lg shadow-sm absolute top-0 left-0"
                style={{ width: "400px", height: "400px" }}
              />
              
              {/* Loading overlay */}
              {isRenderingHillshade && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600">Loading hillshade...</p>
                  </div>
                </div>
              )}
              
              {/* Error overlay */}
              {hillshadeError && !isRenderingHillshade && (
                <div className="absolute top-2 left-2 right-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-yellow-800">{hillshadeError}</p>
                      <button
                        onClick={() => {
                          setHillshadeError(null);
                          // Trigger re-render by updating a dependency
                          const canvas = canvasRef.current;
                          if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              renderHillshadeBackground(ctx, 400);
                            }
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
                designConfig.labels.map((label, index) => (
                  <Rnd
                    key={index}
                    size={{ width: label.width, height: label.height }}
                    position={{ x: label.x, y: label.y }}
                    onDragStop={(e, d) => {
                      handleLabelChange(index, { x: d.x, y: d.y });
                    }}
                    onResize={(e, direction, ref, delta, position) => {
                      const newWidth = parseInt(ref.style.width);
                      const newHeight = parseInt(ref.style.height);
                      handleLabelChange(index, {
                        width: newWidth,
                        height: newHeight,
                        size: Math.max(16, newHeight * 0.6),
                        ...position,
                      });
                    }}
                    minWidth={50}
                    minHeight={30}
                    bounds="parent"
                    style={{
                      transform: `rotate(${label.rotation}deg)`,
                    }}
                    className="flex items-center justify-center border-2 border-solid border-blue-500 bg-white bg-opacity-50"
                  >
                    <div
                      className="w-full h-full flex items-center text-center p-1"
                      style={{
                        fontSize: label.size * getTileSizeScaling(),
                        fontFamily:
                          fontFamilyOptions.find(
                            (f) => f.value === label.fontFamily,
                          )?.cssFont || "var(--font-trispace), monospace",
                        textAlign: label.textAlign || "center",
                        justifyContent:
                          label.textAlign === "left"
                            ? "flex-start"
                            : label.textAlign === "right"
                              ? "flex-end"
                              : "center",
                        fontWeight: label.bold ? "bold" : "normal",
                        fontStyle: label.italic ? "italic" : "normal",
                      }}
                    >
                      {label.text}
                    </div>
                  </Rnd>
                ))}

              {/* Ornament labels positioned using slider controls only */}
            </div>
          </div>

          {/* Dimension Display */}
          <div className="mt-4 text-center">
            {designConfig.printType === "ornament" ? (
              <div className="inline-flex items-center px-4 py-2 bg-alpine-mist rounded-lg">
                <span className="text-sm font-semibold text-basalt font-trispace">
                  75mm diameter
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-alpine-mist rounded-lg">
                <span className="text-sm font-semibold text-basalt font-trispace">
                  {designConfig.tileSize === "basecamp" && "100mm × 100mm"}
                  {designConfig.tileSize === "ridgeline" && "155mm × 155mm"}
                  {designConfig.tileSize === "summit" && "210mm × 210mm"}
                </span>
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
