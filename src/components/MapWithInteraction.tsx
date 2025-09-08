"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Rectangle, useMap } from "react-leaflet";

interface MapWithInteractionProps {
  gpxData: any;
  onBoundingBoxChange: (bbox: string) => void;
}

// Component to handle map interactions
function MapController({ gpxData, onBoundingBoxChange }: MapWithInteractionProps) {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundingBox, setBoundingBox] = useState<[[number, number], [number, number]] | null>(null);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!gpxData || !map) return;

    // Fit map to show the entire route
    const { bounds } = gpxData;
    map.fitBounds([
      [bounds.minLat, bounds.minLon],
      [bounds.maxLat, bounds.maxLon]
    ], { padding: [20, 20] });
  }, [gpxData, map]);

  useEffect(() => {
    if (!map) return;

    const handleMouseDown = (e: any) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        setIsDrawing(true);
        setStartPoint([e.latlng.lat, e.latlng.lng]);
        setBoundingBox(null);
        map.dragging.disable();
      }
    };

    const handleMouseMove = (e: any) => {
      if (isDrawing && startPoint) {
        const currentPoint: [number, number] = [e.latlng.lat, e.latlng.lng];

        // Calculate square bounding box
        const centerLat = (startPoint[0] + currentPoint[0]) / 2;
        const centerLng = (startPoint[1] + currentPoint[1]) / 2;

        // Calculate the maximum distance to ensure square proportions
        // Account for Mercator projection distortion
        const latDiff = Math.abs(currentPoint[0] - startPoint[0]);
        const lngDiff = Math.abs(currentPoint[1] - startPoint[1]) * Math.cos((centerLat * Math.PI) / 180);

        const maxDiff = Math.max(latDiff, lngDiff);
        const adjustedLngDiff = maxDiff / Math.cos((centerLat * Math.PI) / 180);

        const newBounds: [[number, number], [number, number]] = [
          [centerLat - maxDiff / 2, centerLng - adjustedLngDiff / 2],
          [centerLat + maxDiff / 2, centerLng + adjustedLngDiff / 2]
        ];

        setBoundingBox(newBounds);
      }
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setStartPoint(null);
        map.dragging.enable();

        if (boundingBox) {
          // Format coordinates as comma-separated string: minLng,minLat,maxLng,maxLat
          const coordString = `${boundingBox[0][1].toFixed(5)},${boundingBox[0][0].toFixed(5)},${boundingBox[1][1].toFixed(5)},${boundingBox[1][0].toFixed(5)}`;
          onBoundingBoxChange(coordString);
        }
      }
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
    };
  }, [map, isDrawing, startPoint, boundingBox, onBoundingBoxChange]);

  return (
    <>
      {gpxData && (
        <>
          {/* Render GPX tracks */}
          {gpxData.gpx.tracks.map((track: any, trackIndex: number) => (
            <Polyline
              key={`track-${trackIndex}`}
              positions={track.points.map((point: any) => [point.lat, point.lon])}
              color="#10b981"
              weight={4}
              opacity={0.8}
            />
          ))}

          {/* Render GPX routes */}
          {gpxData.gpx.routes.map((route: any, routeIndex: number) => (
            <Polyline
              key={`route-${routeIndex}`}
              positions={route.points.map((point: any) => [point.lat, point.lon])}
              color="#10b981"
              weight={4}
              opacity={0.8}
            />
          ))}
        </>
      )}

      {/* Render bounding box */}
      {boundingBox && (
        <Rectangle
          bounds={boundingBox}
          pathOptions={{
            color: '#ef4444',
            weight: 3,
            opacity: 0.8,
            fillColor: '#ef4444',
            fillOpacity: 0.1,
          }}
        />
      )}
    </>
  );
}

export default function MapWithInteraction({ gpxData, onBoundingBoxChange }: MapWithInteractionProps) {
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
      <MapController gpxData={gpxData} onBoundingBoxChange={onBoundingBoxChange} />
    </MapContainer>
  );
}
