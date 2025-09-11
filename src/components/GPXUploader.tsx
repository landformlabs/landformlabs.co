"use client";

import { useState, useRef } from "react";

interface GPXUploaderProps {
  onGPXUpload: (parsedGPX: any) => void;
}

export default function GPXUploader({ onGPXUpload }: GPXUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseGPX = (gpxContent: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

    // Check for parsing errors
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Invalid GPX file format");
    }

    // Extract track points
    const trackPoints: Array<{ lat: number; lon: number; ele?: number }> = [];
    const tracks = xmlDoc.querySelectorAll("trk");

    tracks.forEach((track) => {
      const segments = track.querySelectorAll("trkseg");
      segments.forEach((segment) => {
        const points = segment.querySelectorAll("trkpt");
        points.forEach((point) => {
          const lat = parseFloat(point.getAttribute("lat") || "0");
          const lon = parseFloat(point.getAttribute("lon") || "0");
          const eleElement = point.querySelector("ele");
          const ele = eleElement
            ? parseFloat(eleElement.textContent || "0")
            : undefined;

          if (lat && lon) {
            trackPoints.push({ lat, lon, ele });
          }
        });
      });
    });

    // Extract route points if no tracks found
    if (trackPoints.length === 0) {
      const routes = xmlDoc.querySelectorAll("rte");
      routes.forEach((route) => {
        const points = route.querySelectorAll("rtept");
        points.forEach((point) => {
          const lat = parseFloat(point.getAttribute("lat") || "0");
          const lon = parseFloat(point.getAttribute("lon") || "0");

          if (lat && lon) {
            trackPoints.push({ lat, lon });
          }
        });
      });
    }

    // Extract waypoints if no tracks or routes found
    if (trackPoints.length === 0) {
      const waypoints = xmlDoc.querySelectorAll("wpt");
      waypoints.forEach((point) => {
        const lat = parseFloat(point.getAttribute("lat") || "0");
        const lon = parseFloat(point.getAttribute("lon") || "0");

        if (lat && lon) {
          trackPoints.push({ lat, lon });
        }
      });
    }

    if (trackPoints.length === 0) {
      throw new Error("No GPS track data found in this GPX file");
    }

    // Calculate bounds
    const lats = trackPoints.map((p) => p.lat);
    const lons = trackPoints.map((p) => p.lon);

    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
    };

    return {
      points: trackPoints,
      bounds,
      totalPoints: trackPoints.length,
    };
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
      );
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".gpx")) {
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
      const parsedData = parseGPX(fileContent);

      const gpxData = {
        ...parsedData,
        fileName: file.name,
        fileSize: file.size,
        gpxString: fileContent,
      };

      onGPXUpload(gpxData);
    } catch (error) {
      console.error("Error parsing GPX file:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to parse GPX file. Please ensure it's a valid GPX file.",
      );
      setUploadedFile("");
      onGPXUpload(null);
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
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-headline font-bold text-basalt mb-6">
        Upload Your GPX File
      </h2>

      <div className="space-y-6">
        <div className="border-2 border-dashed border-slate-storm/20 rounded-lg p-8 text-center hover:border-summit-sage/50 transition-colors">
          {!uploadedFile ? (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 text-slate-storm/50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-lg text-slate-storm mb-2">
                Drag and drop your GPX file here
              </p>
              <p className="text-sm text-slate-storm/70 mb-4">
                or click to browse your files
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
                className={`btn-primary cursor-pointer ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                {isUploading ? "Processing..." : "Choose GPX File"}
              </label>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 text-summit-sage">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-basalt mb-1">
                {uploadedFile}
              </p>
              <p className="text-sm text-slate-storm mb-4">
                GPX file uploaded successfully
              </p>
              <button onClick={resetUpload} className="btn-secondary">
                Upload Different File
              </button>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">
                  Upload Error
                </h3>
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-summit-sage/5 rounded-lg p-4">
          <h3 className="font-headline font-semibold text-basalt text-sm mb-2">
            You can export your GPX file from the following sources
          </h3>
          <div className="text-xs text-slate-storm space-y-1">
            <p>✓ Strava (or connect directly below)</p>
            <p>✓ Garmin Connect</p>
            <p>✓ Komoot</p>
            <p>✓ AllTrails</p>
            <p>✓ Most GPS devices and fitness apps</p>
          </div>
        </div>
      </div>
    </div>
  );
}
