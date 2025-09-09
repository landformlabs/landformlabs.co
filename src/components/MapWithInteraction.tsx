"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Rectangle,
  CircleMarker,
  useMap,
} from "react-leaflet";

interface MapWithInteractionProps {
  gpxData: any;
  onBoundingBoxChange: (bbox: string) => void;
}

// Component to handle map interactions
function MapController({
  gpxData,
  onBoundingBoxChange,
}: MapWithInteractionProps) {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [boundingBox, setBoundingBox] = useState<
    [[number, number], [number, number]] | null
  >(null);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<[number, number] | null>(
    null,
  );
  const [originalBounds, setOriginalBounds] = useState<
    [[number, number], [number, number]] | null
  >(null);

  useEffect(() => {
    if (!gpxData || !map) return;

    // Fit map to show the entire route
    const { bounds } = gpxData;
    map.fitBounds(
      [
        [bounds.minLat, bounds.minLon],
        [bounds.maxLat, bounds.maxLon],
      ],
      { padding: [20, 20] },
    );
  }, [gpxData, map]);

  const isPointInBoundingBox = (
    point: [number, number],
    bbox: [[number, number], [number, number]],
  ): boolean => {
    const [lat, lng] = point;
    const [[minLat, minLng], [maxLat, maxLng]] = bbox;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  };

  const getResizeHandle = (
    point: [number, number],
    bbox: [[number, number], [number, number]],
  ): string | null => {
    const [lat, lng] = point;
    const [[minLat, minLng], [maxLat, maxLng]] = bbox;

    const threshold = Math.abs(maxLat - minLat) * 0.1; // 10% of box height

    // Check corners first
    if (
      Math.abs(lat - minLat) < threshold &&
      Math.abs(lng - minLng) < threshold
    )
      return "nw";
    if (
      Math.abs(lat - minLat) < threshold &&
      Math.abs(lng - maxLng) < threshold
    )
      return "ne";
    if (
      Math.abs(lat - maxLat) < threshold &&
      Math.abs(lng - minLng) < threshold
    )
      return "sw";
    if (
      Math.abs(lat - maxLat) < threshold &&
      Math.abs(lng - maxLng) < threshold
    )
      return "se";

    // Check edges
    if (Math.abs(lat - minLat) < threshold) return "n";
    if (Math.abs(lat - maxLat) < threshold) return "s";
    if (Math.abs(lng - minLng) < threshold) return "w";
    if (Math.abs(lng - maxLng) < threshold) return "e";

    return null;
  };

  const resizeBoundingBox = (
    currentPoint: [number, number],
    handle: string,
    originalBounds: [[number, number], [number, number]],
  ): [[number, number], [number, number]] => {
    const [currentLat, currentLng] = currentPoint;
    const [[originalMinLat, originalMinLng], [originalMaxLat, originalMaxLng]] =
      originalBounds;

    // Calculate the center of the original bounding box
    const centerLat = (originalMinLat + originalMaxLat) / 2;
    const centerLng = (originalMinLng + originalMaxLng) / 2;

    // Calculate distances from current point to center
    const latDistance = Math.abs(currentLat - centerLat);
    const lngDistance =
      Math.abs(currentLng - centerLng) * Math.cos((centerLat * Math.PI) / 180);

    // Use the maximum distance to maintain square proportions
    const maxDistance = Math.max(latDistance, lngDistance);
    const adjustedLngDistance =
      maxDistance / Math.cos((centerLat * Math.PI) / 180);

    let newMinLat: number,
      newMinLng: number,
      newMaxLat: number,
      newMaxLng: number;

    switch (handle) {
      case "nw":
        // Northwest corner - expand from center based on max distance
        newMinLat = centerLat - maxDistance;
        newMinLng = centerLng - adjustedLngDistance;
        newMaxLat = originalMaxLat;
        newMaxLng = originalMaxLng;
        break;
      case "ne":
        // Northeast corner - expand from center based on max distance
        newMinLat = centerLat - maxDistance;
        newMinLng = originalMinLng;
        newMaxLat = originalMaxLat;
        newMaxLng = centerLng + adjustedLngDistance;
        break;
      case "sw":
        // Southwest corner - expand from center based on max distance
        newMinLat = originalMinLat;
        newMinLng = centerLng - adjustedLngDistance;
        newMaxLat = centerLat + maxDistance;
        newMaxLng = originalMaxLng;
        break;
      case "se":
        // Southeast corner - expand from center based on max distance
        newMinLat = originalMinLat;
        newMinLng = originalMinLng;
        newMaxLat = centerLat + maxDistance;
        newMaxLng = centerLng + adjustedLngDistance;
        break;
      default:
        // Fallback to original bounds if handle is not recognized
        return originalBounds;
    }

    return [
      [newMinLat, newMinLng],
      [newMaxLat, newMaxLng],
    ];
  };

  const getCursor = (handle: string | null): string => {
    if (!handle) return "default";
    const cursors: { [key: string]: string } = {
      nw: "nw-resize",
      ne: "ne-resize",
      sw: "sw-resize",
      se: "se-resize",
      n: "n-resize",
      s: "s-resize",
      w: "w-resize",
      e: "e-resize",
    };
    return cursors[handle] || "default";
  };

  useEffect(() => {
    if (!map) return;

    const handleMouseDown = (e: any) => {
      const clickPoint: [number, number] = [e.latlng.lat, e.latlng.lng];

      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        // Create new bounding box
        setIsDrawing(true);
        setStartPoint(clickPoint);
        setBoundingBox(null);
        map.dragging.disable();
        return;
      }

      if (boundingBox) {
        const handle = getResizeHandle(clickPoint, boundingBox);

        if (handle) {
          // Start resizing
          setIsResizing(true);
          setResizeHandle(handle);
          setOriginalBounds(boundingBox);
          map.dragging.disable();
          document.body.style.cursor = getCursor(handle);
        } else if (isPointInBoundingBox(clickPoint, boundingBox)) {
          // Start dragging
          setIsDragging(true);
          setDragStartPoint(clickPoint);
          setOriginalBounds(boundingBox);
          map.dragging.disable();
          document.body.style.cursor = "move";
        }
      }
    };

    const handleMouseMove = (e: any) => {
      const currentPoint: [number, number] = [e.latlng.lat, e.latlng.lng];

      if (isDrawing && startPoint) {
        // Drawing new bounding box
        const centerLat = (startPoint[0] + currentPoint[0]) / 2;
        const centerLng = (startPoint[1] + currentPoint[1]) / 2;

        const latDiff = Math.abs(currentPoint[0] - startPoint[0]);
        const lngDiff =
          Math.abs(currentPoint[1] - startPoint[1]) *
          Math.cos((centerLat * Math.PI) / 180);

        const maxDiff = Math.max(latDiff, lngDiff);
        const adjustedLngDiff = maxDiff / Math.cos((centerLat * Math.PI) / 180);

        const newBounds: [[number, number], [number, number]] = [
          [centerLat - maxDiff / 2, centerLng - adjustedLngDiff / 2],
          [centerLat + maxDiff / 2, centerLng + adjustedLngDiff / 2],
        ];

        setBoundingBox(newBounds);
      } else if (isResizing && resizeHandle && originalBounds) {
        // Resizing existing bounding box
        const newBounds = resizeBoundingBox(
          currentPoint,
          resizeHandle,
          originalBounds,
        );
        setBoundingBox(newBounds);
      } else if (isDragging && dragStartPoint && originalBounds) {
        // Dragging existing bounding box
        const latDiff = currentPoint[0] - dragStartPoint[0];
        const lngDiff = currentPoint[1] - dragStartPoint[1];

        const [[minLat, minLng], [maxLat, maxLng]] = originalBounds;
        const newBounds: [[number, number], [number, number]] = [
          [minLat + latDiff, minLng + lngDiff],
          [maxLat + latDiff, maxLng + lngDiff],
        ];

        setBoundingBox(newBounds);
      } else if (boundingBox && !isDrawing && !isDragging && !isResizing) {
        // Update cursor based on hover position
        const handle = getResizeHandle(currentPoint, boundingBox);
        if (handle) {
          document.body.style.cursor = getCursor(handle);
        } else if (isPointInBoundingBox(currentPoint, boundingBox)) {
          document.body.style.cursor = "move";
        } else {
          document.body.style.cursor = "default";
        }
      }
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setStartPoint(null);
        map.dragging.enable();

        if (boundingBox) {
          const coordString = `${boundingBox[0][1].toFixed(5)},${boundingBox[0][0].toFixed(5)},${boundingBox[1][1].toFixed(5)},${boundingBox[1][0].toFixed(5)}`;
          onBoundingBoxChange(coordString);
        }
      } else if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
        setDragStartPoint(null);
        setOriginalBounds(null);
        map.dragging.enable();
        document.body.style.cursor = "default";

        if (boundingBox) {
          const coordString = `${boundingBox[0][1].toFixed(5)},${boundingBox[0][0].toFixed(5)},${boundingBox[1][1].toFixed(5)},${boundingBox[1][0].toFixed(5)}`;
          onBoundingBoxChange(coordString);
        }
      }
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [
    map,
    isDrawing,
    isDragging,
    isResizing,
    startPoint,
    boundingBox,
    dragStartPoint,
    originalBounds,
    resizeHandle,
    onBoundingBoxChange,
  ]);

  const getResizeHandles = (bbox: [[number, number], [number, number]]) => {
    const [[minLat, minLng], [maxLat, maxLng]] = bbox;

    return [
      { position: [minLat, minLng] as [number, number], handle: "nw" },
      { position: [minLat, maxLng] as [number, number], handle: "ne" },
      { position: [maxLat, maxLng] as [number, number], handle: "se" },
      { position: [maxLat, minLng] as [number, number], handle: "sw" },
    ];
  };

  return (
    <>
      {gpxData && (
        <>
          {/* Render GPX tracks */}
          {gpxData.gpx.tracks.map((track: any, trackIndex: number) => (
            <Polyline
              key={`track-${trackIndex}`}
              positions={track.points.map((point: any) => [
                point.lat,
                point.lon,
              ])}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
            />
          ))}

          {/* Render GPX routes */}
          {gpxData.gpx.routes.map((route: any, routeIndex: number) => (
            <Polyline
              key={`route-${routeIndex}`}
              positions={route.points.map((point: any) => [
                point.lat,
                point.lon,
              ])}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
            />
          ))}
        </>
      )}

      {/* Render bounding box */}
      {boundingBox && (
        <>
          <Rectangle
            bounds={boundingBox}
            pathOptions={{
              color: "#ef4444",
              weight: 3,
              opacity: 0.8,
              fillColor: "#ef4444",
              fillOpacity: 0.1,
            }}
          />

          {/* Render resize handles */}
          {!isDrawing &&
            getResizeHandles(boundingBox).map((handle, index) => (
              <CircleMarker
                key={`handle-${handle.handle}-${index}`}
                center={handle.position}
                radius={6}
                pathOptions={{
                  color: "#ef4444",
                  weight: 2,
                  opacity: 1,
                  fillColor: "#ffffff",
                  fillOpacity: 1,
                }}
              />
            ))}
        </>
      )}
    </>
  );
}

export default function MapWithInteraction({
  gpxData,
  onBoundingBoxChange,
}: MapWithInteractionProps) {
  return (
    <MapContainer
      center={[39.8283, -98.5795]} // Center of US as default
      zoom={4}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController
        gpxData={gpxData}
        onBoundingBoxChange={onBoundingBoxChange}
      />
    </MapContainer>
  );
}
