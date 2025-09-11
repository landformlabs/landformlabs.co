import React from "react";

interface RouteThumbnailProps {
  polyline?: string | null;
  sportType: string;
  className?: string;
}

export default function RouteThumbnail({
  polyline,
  sportType,
  className = "",
}: RouteThumbnailProps) {
  // Decode Google polyline format to coordinates
  const decodePolyline = (encoded: string): [number, number][] => {
    if (!encoded) return [];

    let index = 0;
    const coordinates: [number, number][] = [];
    let currentLat = 0;
    let currentLng = 0;

    try {
      while (index < encoded.length) {
        let byte = 0;
        let shift = 0;
        let result = 0;

        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);

        const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        currentLat += deltaLat;

        shift = 0;
        result = 0;

        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);

        const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        currentLng += deltaLng;

        coordinates.push([currentLat / 1e5, currentLng / 1e5]);
      }
    } catch (error) {
      console.warn("Failed to decode polyline:", error);
      return [];
    }

    return coordinates;
  };

  // Convert coordinates to SVG path
  const coordinatesToPath = (coords: [number, number][]): string => {
    if (coords.length === 0) return "";

    // Find bounding box
    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding - increased for better visual breathing room
    const padding = 8; // 8% of viewBox for more spacious layout
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    // Normalize coordinates to SVG viewBox (0-100)
    const svgCoords = coords.map(([lat, lng]) => {
      const x = ((lng - minLng) / lngRange) * (100 - 2 * padding) + padding;
      const y = ((maxLat - lat) / latRange) * (100 - 2 * padding) + padding; // Flip Y axis
      return [x, y];
    });

    // Create SVG path
    if (svgCoords.length === 0) return "";

    let path = `M ${svgCoords[0][0]},${svgCoords[0][1]}`;
    for (let i = 1; i < svgCoords.length; i++) {
      path += ` L ${svgCoords[i][0]},${svgCoords[i][1]}`;
    }

    return path;
  };

  // Get sport type icon
  const getSportIcon = (sport: string): string => {
    const icons: { [key: string]: string } = {
      Ride: "🚴‍♂️",
      Run: "🏃‍♂️",
      Hike: "🥾",
      Walk: "🚶‍♂️",
      Swim: "🏊‍♂️",
      Workout: "💪",
      Yoga: "🧘‍♂️",
      VirtualRide: "🚴‍♂️",
      EBikeRide: "🚴‍♂️",
      MountainBikeRide: "🚵‍♂️",
    };
    return icons[sport] || "🏃‍♂️";
  };

  const coordinates = polyline ? decodePolyline(polyline) : [];
  const pathData = coordinatesToPath(coordinates);

  if (!polyline || coordinates.length === 0) {
    // Fallback to sport icon when no route data
    return (
      <div
        className={`w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl ${className}`}
      >
        {getSportIcon(sportType)}
      </div>
    );
  }

  return (
    <div
      className={`relative w-16 h-16 bg-gradient-to-br from-alpine-mist to-slate-100 rounded-lg overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Route path */}
        <path
          d={pathData}
          stroke="#7A8471" // summit-sage color
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* Start point */}
        {coordinates.length > 0 && (
          <circle
            cx={
              ((coordinates[0][1] - Math.min(...coordinates.map((c) => c[1]))) /
                (Math.max(...coordinates.map((c) => c[1])) -
                  Math.min(...coordinates.map((c) => c[1])))) *
                90 +
              5
            }
            cy={
              ((Math.max(...coordinates.map((c) => c[0])) - coordinates[0][0]) /
                (Math.max(...coordinates.map((c) => c[0])) -
                  Math.min(...coordinates.map((c) => c[0])))) *
                90 +
              5
            }
            r="2"
            fill="#2D3142" // basalt color
            className="drop-shadow-sm"
          />
        )}

        {/* End point */}
        {coordinates.length > 1 && (
          <circle
            cx={
              ((coordinates[coordinates.length - 1][1] -
                Math.min(...coordinates.map((c) => c[1]))) /
                (Math.max(...coordinates.map((c) => c[1])) -
                  Math.min(...coordinates.map((c) => c[1])))) *
                90 +
              5
            }
            cy={
              ((Math.max(...coordinates.map((c) => c[0])) -
                coordinates[coordinates.length - 1][0]) /
                (Math.max(...coordinates.map((c) => c[0])) -
                  Math.min(...coordinates.map((c) => c[0])))) *
                90 +
              5
            }
            r="2"
            fill="#A6947C" // desert-stone color
            className="drop-shadow-sm"
          />
        )}
      </svg>
    </div>
  );
}
