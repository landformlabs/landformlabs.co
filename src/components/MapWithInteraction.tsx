"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Rectangle,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface MapWithInteractionProps {
  gpxData: any;
  onBoundingBoxChange: (bbox: string) => void;
}

interface BoundingBoxState {
  bounds: [[number, number], [number, number]];
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle?: string;
}

// Component to handle map interactions
function MapController({
  gpxData,
  onBoundingBoxChange,
}: MapWithInteractionProps) {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundingBox, setBoundingBox] = useState<BoundingBoxState | null>(null);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);

  // Fit map to GPX data on load
  useEffect(() => {
    if (!gpxData || !map) return;

    const { bounds } = gpxData;
    map.fitBounds(
      [
        [bounds.minLat, bounds.minLon],
        [bounds.maxLat, bounds.maxLon],
      ],
      { padding: [50, 50] },
    );
  }, [gpxData, map]);

  // Create square bounding box from two points
  const createSquareBounds = useCallback(
    (
      point1: [number, number],
      point2: [number, number],
    ): [[number, number], [number, number]] => {
      const centerLat = (point1[0] + point2[0]) / 2;
      const centerLng = (point1[1] + point2[1]) / 2;

      // Calculate the maximum distance to ensure square proportions
      // Account for Mercator projection distortion
      const latDiff = Math.abs(point2[0] - point1[0]);
      const lngDiff =
        Math.abs(point2[1] - point1[1]) * Math.cos((centerLat * Math.PI) / 180);

      const maxDiff = Math.max(latDiff, lngDiff);
      const adjustedLngDiff = maxDiff / Math.cos((centerLat * Math.PI) / 180);

      return [
        [centerLat - maxDiff / 2, centerLng - adjustedLngDiff / 2],
        [centerLat + maxDiff / 2, centerLng + adjustedLngDiff / 2],
      ];
    },
    [],
  );

  // Handle mouse events for drawing
  useEffect(() => {
    if (!map) return;

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        e.originalEvent.preventDefault();
        setIsDrawing(true);
        setStartPoint([e.latlng.lat, e.latlng.lng]);
        setBoundingBox(null);
        map.dragging.disable();
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (isDrawing && startPoint) {
        const currentPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        const squareBounds = createSquareBounds(startPoint, currentPoint);

        setBoundingBox({
          bounds: squareBounds,
          isDragging: false,
          isResizing: false,
        });
      }
    };

    const handleMouseUp = (e: L.LeafletMouseEvent) => {
      if (isDrawing) {
        setIsDrawing(false);
        setStartPoint(null);
        map.dragging.enable();

        if (boundingBox) {
          // Format coordinates as comma-separated string: minLng,minLat,maxLng,maxLat
          const [sw, ne] = boundingBox.bounds;
          const coordString = `${sw[1].toFixed(5)},${sw[0].toFixed(5)},${ne[1].toFixed(5)},${ne[0].toFixed(5)}`;
          onBoundingBoxChange(coordString);
        }
      }
    };

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isDrawing || boundingBox)) {
        setIsDrawing(false);
        setStartPoint(null);
        setBoundingBox(null);
        map.dragging.enable();
        onBoundingBoxChange("");
      }
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    map,
    isDrawing,
    startPoint,
    boundingBox,
    onBoundingBoxChange,
    createSquareBounds,
  ]);

  // Clear bounding box function (exposed via map instance)
  useEffect(() => {
    if (map) {
      (map as any).clearBoundingBox = () => {
        setBoundingBox(null);
        onBoundingBoxChange("");
      };
    }
  }, [map, onBoundingBoxChange]);

  return (
    <>
      {gpxData && (
        <Polyline
          positions={gpxData.points.map((point: any) => [point.lat, point.lon])}
          pathOptions={{
            color: "#2563eb",
            weight: 4,
            opacity: 0.9,
          }}
        />
      )}

      {boundingBox && (
        <>
          <Rectangle
            bounds={boundingBox.bounds}
            pathOptions={{
              color: "#ef4444",
              weight: 2,
              opacity: 0.8,
              fillColor: "#ef4444",
              fillOpacity: 0.1,
              dashArray: [5, 5],
            }}
          />
          {/* Corner markers for visual feedback */}
          {boundingBox.bounds.map((corner, idx) => (
            <div key={idx}>
              {/* We'll add resize handles here in a future update */}
            </div>
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
