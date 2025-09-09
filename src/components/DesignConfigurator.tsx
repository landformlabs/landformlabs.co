"use client";

import { useState, useEffect, useRef } from "react";

interface DesignConfiguratorProps {
  gpxData: any;
  boundingBox: string;
  designConfig: {
    routeColor: string;
    printType: "tile" | "ornament";
    labels: Array<{
      text: string;
      x: number;
      y: number;
      size: number;
      rotation: number;
    }>;
  };
  onConfigChange: (config: any) => void;
}

export default function DesignConfigurator({
  gpxData,
  boundingBox,
  designConfig,
  onConfigChange,
}: DesignConfiguratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [newLabel, setNewLabel] = useState({ text: "", size: 16 });
  const [draggingLabel, setDraggingLabel] = useState<number | null>(null);
  const [rotatingLabel, setRotatingLabel] = useState<number | null>(null);

  // Parse bounding box coordinates
  const bbox = boundingBox.split(",").map(Number); // [minLng, minLat, maxLng, maxLat]

  // Color options for routes
  const colorOptions = [
    { name: "Black", value: "#000000", bg: "bg-black" },
    { name: "Blue", value: "#2563eb", bg: "bg-blue-600" },
    { name: "Red", value: "#ef4444", bg: "bg-red-500" },
  ];

  // Canvas rendering and label interaction
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
      radius: number,
      rotation: number,
      fontSize: number,
    ) => {
      ctx.save();
      ctx.translate(canvasSize / 2, canvasSize / 2);
      ctx.font = `bold ${fontSize}px 'Trispace', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textWidth = ctx.measureText(text).width;
      const totalAngle = textWidth / radius;

      ctx.rotate(rotation - totalAngle / 2);

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charWidth = ctx.measureText(char).width;
        ctx.rotate(charWidth / 2 / radius);
        ctx.fillText(char, 0, -radius);
        ctx.rotate(charWidth / 2 / radius);
      }
      ctx.restore();
    };

    const redraw = () => {
      // Clear and draw background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasSize, canvasSize);

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

      // Draw ornament circle
      if (designConfig.printType === "ornament") {
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(
          canvasSize / 2,
          canvasSize / 2,
          canvasSize * 0.4,
          0,
          2 * Math.PI,
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw labels
      designConfig.labels.forEach((label) => {
        if (designConfig.printType === "ornament") {
          drawCurvedText(
            label.text,
            canvasSize * 0.35,
            label.rotation,
            label.size,
          );
        } else {
          ctx.fillStyle = "#1f2937";
          ctx.font = `bold ${label.size}px 'Trispace', monospace`;
          ctx.textAlign = "center";
          ctx.fillText(label.text, label.x * canvasSize, label.y * canvasSize);
        }
      });
    };

    redraw();

    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getMousePos(e);
      if (designConfig.printType === "ornament") {
        const dx = pos.x * canvasSize - canvasSize / 2;
        const dy = pos.y * canvasSize - canvasSize / 2;
        const radius = Math.sqrt(dx * dx + dy * dy);

        if (radius > canvasSize * 0.3 && radius < canvasSize * 0.5) {
          const clickAngle = Math.atan2(dy, dx);
          let closestLabelIndex = -1;
          let minAngleDiff = Infinity;

          for (let i = 0; i < designConfig.labels.length; i++) {
            const label = designConfig.labels[i];
            const angleDiff = Math.abs(clickAngle - label.rotation);
            if (angleDiff < minAngleDiff) {
              minAngleDiff = angleDiff;
              closestLabelIndex = i;
            }
          }

          if (closestLabelIndex !== -1) {
            setRotatingLabel(closestLabelIndex);
            return;
          }
        }
      } else {
        for (let i = designConfig.labels.length - 1; i >= 0; i--) {
          const label = designConfig.labels[i];
          ctx.font = `bold ${label.size}px 'Trispace', monospace`;
          const textWidth = ctx.measureText(label.text).width / canvasSize;
          const textHeight = label.size / canvasSize;
          if (
            pos.x > label.x - textWidth / 2 &&
            pos.x < label.x + textWidth / 2 &&
            pos.y > label.y - textHeight &&
            pos.y < label.y
          ) {
            setDraggingLabel(i);
            return;
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getMousePos(e);
      let cursor = "default";
      if (draggingLabel !== null) {
        cursor = "move";
        const newLabels = [...designConfig.labels];
        newLabels[draggingLabel] = {
          ...newLabels[draggingLabel],
          x: pos.x,
          y: pos.y,
        };
        onConfigChange({ ...designConfig, labels: newLabels });
      } else if (rotatingLabel !== null) {
        cursor = "move";
        const dx = pos.x * canvasSize - canvasSize / 2;
        const dy = pos.y * canvasSize - canvasSize / 2;
        const angle = Math.atan2(dy, dx);
        const newLabels = [...designConfig.labels];
        newLabels[rotatingLabel] = {
          ...newLabels[rotatingLabel],
          rotation: angle,
        };
        onConfigChange({ ...designConfig, labels: newLabels });
      } else {
        // Logic to change cursor on hover
      }
      canvas.style.cursor = cursor;
    };

    const handleMouseUp = () => {
      setDraggingLabel(null);
      setRotatingLabel(null);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [
    gpxData,
    boundingBox,
    bbox,
    designConfig,
    onConfigChange,
    draggingLabel,
    rotatingLabel,
  ]);

  const handleConfigChange = (updates: any) => {
    onConfigChange({ ...designConfig, ...updates });
  };

  const addLabel = () => {
    if (newLabel.text.trim()) {
      const updatedLabels = [
        ...designConfig.labels,
        {
          ...newLabel,
          x: 0.5,
          y: 0.9,
          rotation: 0,
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

    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    const exportSize = 1200;
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;

    exportCtx.scale(exportSize / 400, exportSize / 400);
    exportCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `route-print-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();

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
            <button onClick={exportDesign} className="btn-primary">
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
