"use client";

import { useState, useEffect, useRef } from "react";

interface DesignConfiguratorProps {
  gpxData: any;
  boundingBox: string;
  designConfig: {
    routeColor: string;
    printType: "tile" | "ornament";
    labels: Array<{ text: string; x: number; y: number; size: number }>;
  };
  onConfigChange: (config: any) => void;
}

export default function DesignConfigurator({
  gpxData,
  boundingBox,
  designConfig,
  onConfigChange,
}: DesignConfiguratorProps) {
  const [topographyData, setTopographyData] = useState<string | null>(null);
  const [isLoadingTopo, setIsLoadingTopo] = useState(true);
  const [topoError, setTopoError] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [newLabel, setNewLabel] = useState({ text: "", size: 16 });

  // Parse bounding box coordinates
  const bbox = boundingBox.split(",").map(Number); // [minLng, minLat, maxLng, maxLat]

  // Color options for routes
  const colorOptions = [
    { name: "Route Blue", value: "#2563eb", bg: "bg-blue-600" },
    { name: "Adventure Green", value: "#10b981", bg: "bg-emerald-500" },
    { name: "Summit Black", value: "#1f2937", bg: "bg-gray-800" },
    { name: "Trail Red", value: "#ef4444", bg: "bg-red-500" },
    { name: "Desert Orange", value: "#f97316", bg: "bg-orange-500" },
    { name: "Forest Dark", value: "#166534", bg: "bg-green-800" },
  ];

  // Load topography data
  useEffect(() => {
    const loadTopographyData = async () => {
      if (!boundingBox) return;

      setIsLoadingTopo(true);
      setTopoError("");

      try {
        // For now, we'll use a placeholder. In production, this would call the OpenTopography API
        // through a Next.js API route to avoid exposing the API key
        const response = await fetch("/api/topography", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ boundingBox }),
        });

        if (!response.ok) {
          throw new Error("Failed to load topography data");
        }

        const data = await response.text();
        setTopographyData(data);
      } catch (error) {
        console.error("Error loading topography:", error);
        setTopoError(
          "Unable to load topography data. Preview will show route only.",
        );
        // Continue without topography - just show the route
        setTopographyData(null);
      } finally {
        setIsLoadingTopo(false);
      }
    };

    loadTopographyData();
  }, [boundingBox]);

  // Render design preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gpxData || isLoadingTopo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size, size);

    // Draw topography placeholder (would be actual elevation data in production)
    if (!topoError) {
      // Generate placeholder topography pattern
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % size;
        const y = Math.floor(i / 4 / size);

        // Simple elevation simulation based on position
        const elevation = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 50 + 128;

        data[i] = elevation * 0.6; // R
        data[i + 1] = elevation * 0.7; // G
        data[i + 2] = elevation * 0.5; // B
        data[i + 3] = 255; // A
      }

      ctx.putImageData(imageData, 0, 0);
    }

    // Filter GPX points within bounding box
    const filteredPoints = gpxData.points.filter(
      (point: any) =>
        point.lat >= bbox[1] &&
        point.lat <= bbox[3] &&
        point.lon >= bbox[0] &&
        point.lon <= bbox[2],
    );

    // Draw route
    if (filteredPoints.length > 1) {
      ctx.strokeStyle = designConfig.routeColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      filteredPoints.forEach((point: any, index: number) => {
        // Convert lat/lon to canvas coordinates
        const x = ((point.lon - bbox[0]) / (bbox[2] - bbox[0])) * size;
        const y = size - ((point.lat - bbox[1]) / (bbox[3] - bbox[1])) * size;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw ornament circle if ornament type is selected
    if (designConfig.printType === "ornament") {
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.4;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw labels
    designConfig.labels.forEach((label) => {
      ctx.fillStyle = "#1f2937";
      ctx.font = `bold ${label.size}px 'Trispace', monospace`;
      ctx.textAlign = "center";
      ctx.fillText(label.text, label.x * size, label.y * size);
    });
  }, [gpxData, boundingBox, bbox, designConfig, isLoadingTopo, topoError]);

  const handleConfigChange = (updates: any) => {
    onConfigChange({ ...designConfig, ...updates });
  };

  const addLabel = () => {
    if (newLabel.text.trim()) {
      const updatedLabels = [
        ...designConfig.labels,
        {
          ...newLabel,
          x: 0.5, // Center
          y: 0.9, // Near bottom
        },
      ];
      handleConfigChange({ labels: updatedLabels });
      setNewLabel({ text: "", size: 16 });
    }
  };

  const removeLabel = (index: number) => {
    const updatedLabels = designConfig.labels.filter((_, i) => i !== index);
    handleConfigChange({ labels: updatedLabels });
  };

  const exportDesign = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high-resolution version
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    // Set high resolution (300 DPI equivalent)
    const exportSize = 1200;
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;

    // Scale up the current design
    exportCtx.scale(exportSize / 400, exportSize / 400);
    exportCtx.drawImage(canvas, 0, 0);

    // Download the image
    const link = document.createElement("a");
    link.download = `route-print-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();

    // Copy coordinates to clipboard
    try {
      await navigator.clipboard.writeText(boundingBox);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Design Preview */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-headline font-bold text-basalt">
              Design Preview
            </h2>
            <button
              onClick={exportDesign}
              className="btn-primary"
              disabled={isLoadingTopo}
            >
              Export Design
            </button>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border border-slate-storm/20 rounded-lg shadow-sm"
                style={{ maxWidth: "400px", maxHeight: "400px" }}
              />

              {isLoadingTopo && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-slate-storm">
                      Loading topography...
                    </p>
                  </div>
                </div>
              )}

              {topoError && (
                <div className="absolute top-2 left-2 bg-yellow-50 border border-yellow-200 rounded-md p-2 max-w-xs">
                  <p className="text-xs text-yellow-800">{topoError}</p>
                </div>
              )}
            </div>
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

      {/* Design Controls */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6 space-y-6">
          <h3 className="text-xl font-headline font-bold text-basalt">
            Customize Design
          </h3>

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
                  className={`relative w-full h-10 rounded-lg border-2 transition-all ${
                    designConfig.routeColor === color.value
                      ? "border-summit-sage scale-105"
                      : "border-slate-storm/20 hover:border-slate-storm/40"
                  }`}
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
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  designConfig.printType === "tile"
                    ? "border-summit-sage bg-summit-sage/5"
                    : "border-slate-storm/20 hover:border-slate-storm/40"
                }`}
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
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  designConfig.printType === "ornament"
                    ? "border-summit-sage bg-summit-sage/5"
                    : "border-slate-storm/20 hover:border-slate-storm/40"
                }`}
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

          {/* Text Labels */}
          <div>
            <label className="block text-sm font-headline font-semibold text-basalt mb-3">
              Text Labels
            </label>

            <div className="space-y-3">
              {designConfig.labels.map((label, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-basalt">
                      {label.text}
                    </div>
                    <div className="text-xs text-slate-storm">
                      Size: {label.size}px
                    </div>
                  </div>
                  <button
                    onClick={() => removeLabel(index)}
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
              ))}

              <div className="space-y-2">
                <input
                  type="text"
                  value={newLabel.text}
                  onChange={(e) =>
                    setNewLabel({ ...newLabel, text: e.target.value })
                  }
                  placeholder="Add label text..."
                  className="w-full px-3 py-2 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="12"
                    max="32"
                    value={newLabel.size}
                    onChange={(e) =>
                      setNewLabel({
                        ...newLabel,
                        size: parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-storm whitespace-nowrap">
                    {newLabel.size}px
                  </span>
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
    </div>
  );
}
