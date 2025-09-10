"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Marker,
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

interface InteractionState {
  type: "drag" | "resize" | null;
  startBounds?: [[number, number], [number, number]];
  startLatLng?: L.LatLng;
  handle?: string;
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
  const [interactionState, setInteractionState] = useState<InteractionState>({
    type: null,
  });
  const [boundingBoxString, setBoundingBoxString] = useState<string>("");

  useEffect(() => {
    onBoundingBoxChange(boundingBoxString);
  }, [boundingBoxString, onBoundingBoxChange]);

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

  // Create square bounding box
  const createSquareBounds = useCallback(
    (
      p1: [number, number],
      p2: [number, number],
    ): [[number, number], [number, number]] => {
      const centerLat = (p1[0] + p2[0]) / 2;
      const centerLng = (p1[1] + p2[1]) / 2;
      const latDiff = Math.abs(p1[0] - p2[0]);
      const lngDiff =
        Math.abs(p1[1] - p2[1]) * Math.cos((centerLat * Math.PI) / 180);
      const maxDiff = Math.max(latDiff, lngDiff) / 2;
      const adjustedLngDiff = maxDiff / Math.cos((centerLat * Math.PI) / 180);
      return [
        [centerLat - maxDiff, centerLng - adjustedLngDiff],
        [centerLat + maxDiff, centerLng + adjustedLngDiff],
      ];
    },
    [],
  );

  // Handle finishing an interaction
  const endInteraction = useCallback(() => {
    setIsDrawing(false);
    setInteractionState({ type: null });
    map.dragging.enable();
    if (boundingBox) {
      const [sw, ne] = boundingBox.bounds;
      const coordString = `${sw[1].toFixed(5)},${sw[0].toFixed(5)},${ne[1].toFixed(5)},${ne[0].toFixed(5)}`;
      setBoundingBoxString(coordString);
    }
  }, [map, boundingBox, setBoundingBoxString]);

  // Main mouse event handler effect
  useEffect(() => {
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
        setBoundingBox({
          bounds: createSquareBounds(startPoint, currentPoint),
          isDragging: false,
          isResizing: false,
        });
      } else if (interactionState.type && interactionState.startBounds) {
        const { type, startBounds, startLatLng, handle } = interactionState;
        const latDiff = e.latlng.lat - (startLatLng?.lat ?? 0);
        const lngDiff = e.latlng.lng - (startLatLng?.lng ?? 0);

        let newBounds = L.latLngBounds(startBounds);

        if (type === "drag") {
          newBounds = L.latLngBounds(
            [startBounds[0][0] + latDiff, startBounds[0][1] + lngDiff],
            [startBounds[1][0] + latDiff, startBounds[1][1] + lngDiff],
          );
        } else if (type === "resize" && handle) {
          const [[swLat, swLng], [neLat, neLng]] = startBounds;
          let newSw: L.LatLngTuple = [swLat, swLng];
          let newNe: L.LatLngTuple = [neLat, neLng];

          if (handle.includes("n")) newNe = [neLat + latDiff, newNe[1]];
          if (handle.includes("s")) newSw = [swLat + latDiff, newSw[1]];
          if (handle.includes("e")) newNe = [newNe[0], neLng + lngDiff];
          if (handle.includes("w")) newSw = [newSw[0], swLng + lngDiff];

          const center = new L.LatLngBounds(newSw, newNe).getCenter();
          const size = Math.max(
            Math.abs(newNe[0] - newSw[0]),
            Math.abs(newNe[1] - newSw[1]) *
              Math.cos((center.lat * Math.PI) / 180),
          );
          const adjustedLng = size / 2 / Math.cos((center.lat * Math.PI) / 180);

          newBounds = L.latLngBounds(
            [center.lat - size / 2, center.lng - adjustedLng],
            [center.lat + size / 2, center.lng + adjustedLng],
          );
        }

        const newBoundsArray: [[number, number], [number, number]] = [
          [newBounds.getSouthWest().lat, newBounds.getSouthWest().lng],
          [newBounds.getNorthEast().lat, newBounds.getNorthEast().lng],
        ];

        setBoundingBox((bb) => (bb ? { ...bb, bounds: newBoundsArray } : null));
      }
    };

    const handleMouseUp = () => {
      if (isDrawing || interactionState.type) {
        endInteraction();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawing(false);
        setBoundingBox(null);
        setBoundingBoxString("");
        endInteraction();
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
    interactionState,
    createSquareBounds,
    endInteraction,
  ]);

  const handleInteractionStart = (
    e: L.LeafletMouseEvent,
    type: "drag" | "resize",
    handle?: string,
  ) => {
    e.originalEvent.stopPropagation();
    if (!boundingBox) return;
    map.dragging.disable();
    setInteractionState({
      type,
      startBounds: boundingBox.bounds,
      startLatLng: e.latlng,
      handle,
    });
  };

  // Custom resize handle component
  const ResizeHandle = ({ position, handle }: any) => {
    const handleIcon = L.divIcon({
      className: `leaflet-resize-handle-${handle}`,
      html: `<div class="resize-handle-inner"></div>`,
      iconSize: [12, 12],
    });

    return (
      <Marker
        position={position}
        icon={handleIcon}
        draggable={false}
        eventHandlers={{
          mousedown: (e) => handleInteractionStart(e, "resize", handle),
        }}
      />
    );
  };

  return (
    <>
      {gpxData && (
        <Polyline
          positions={gpxData.points.map((p: any) => [p.lat, p.lon])}
          pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }}
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
            }}
            eventHandlers={{
              mousedown: (e) => handleInteractionStart(e, "drag"),
            }}
          />
          <ResizeHandle
            position={L.latLngBounds(boundingBox.bounds).getNorthWest()}
            handle="nw"
          />
          <ResizeHandle
            position={L.latLngBounds(boundingBox.bounds).getNorthEast()}
            handle="ne"
          />
          <ResizeHandle
            position={L.latLngBounds(boundingBox.bounds).getSouthWest()}
            handle="sw"
          />
          <ResizeHandle
            position={L.latLngBounds(boundingBox.bounds).getSouthEast()}
            handle="se"
          />
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
