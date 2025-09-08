"use client";

import { useState, useRef } from "react";
// @ts-ignore - gpxparser doesn't have proper TypeScript definitions
import gpxParser from "gpxparser";

interface GPXUploaderProps {
  onGPXUpload: (parsedGPX: any) => void;
}

export default function GPXUploader({ onGPXUpload }: GPXUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setUploadError("Please select a valid GPX file.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadedFile(file.name);

    try {
      // Read the file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Parse the GPX data
      const gpx = new gpxParser();
      gpx.parse(fileContent);

      // Validate that we have track or waypoint data
      if (!gpx.tracks.length && !gpx.waypoints.length && !gpx.routes.length) {
        throw new Error("No track, route, or waypoint data found in the GPX file.");
      }

      // Extract coordinates for map bounds
      let allPoints: Array<{ lat: number; lon: number }> = [];

      // Get points from tracks
      gpx.tracks.forEach((track: any) => {
        track.points.forEach((point: any) => {
          allPoints.push({ lat: point.lat, lon: point.lon });
        });
      });

      // Get points from routes
      gpx.routes.forEach((route: any) => {
        route.points.forEach((point: any) => {
          allPoints.push({ lat: point.lat, lon: point.lon });
        });
      });

      // Get waypoints
      gpx.waypoints.forEach((waypoint: any) => {
        allPoints.push({ lat: waypoint.lat, lon: waypoint.lon });
      });

      // Calculate bounds
      const lats = allPoints.map(p => p.lat);
      const lons = allPoints.map(p => p.lon);

      const bounds = {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLon: Math.min(...lons),
        maxLon: Math.max(...lons),
      };

      const parsedData = {
        gpx,
        points: allPoints,
        bounds,
        fileName: file.name,
        fileSize: file.size,
      };

      onGPXUpload(parsedData);

    } catch (error) {
      console.error("Error parsing GPX file:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to parse GPX file. Please ensure it&apos;s a valid GPX file."
      );
      setUploadedFile("");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile("");
    setUploadError("");
    onGPXUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-headline font-semibold text-basalt mb-2">
          Upload GPX File
        </label>
        <div className="border-2 border-dashed border-slate-storm/20 rounded-lg p-6 text-center hover:border-summit-sage/50 transition-colors">
          {!uploadedFile ? (
            <div>
              <div className="w-12 h-12 mx-auto mb-4 text-slate-storm/50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-slate-storm mb-3">
                Drag and drop your GPX file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="gpx-upload"
              />
              <label
                htmlFor="gpx-upload"
                className={`btn-secondary cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
              >
                {isUploading ? "Processing..." : "Choose GPX File"}
              </label>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 mx-auto mb-4 text-summit-sage">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-basalt mb-1">{uploadedFile}</p>
              <p className="text-xs text-slate-storm mb-3">GPX file uploaded successfully</p>
              <button
                onClick={resetUpload}
                className="text-sm text-summit-sage hover:text-summit-sage/80 font-semibold"
              >
                Upload Different File
              </button>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-semibold">Upload Error</p>
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      <div className="text-xs text-slate-storm">
        <p className="mb-1">
          <strong>Supported sources:</strong> Strava, Garmin Connect, Komoot, and most GPS devices
        </p>
        <p>
          <strong>File format:</strong> .gpx files only
        </p>
      </div>
    </div>
  );
}
