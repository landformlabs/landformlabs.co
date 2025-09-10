"use client";

import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import JSZip from "jszip";

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
      width: number;
      height: number;
      fontFamily: "Garamond" | "Poppins" | "Trispace";
      textAlign: "left" | "center" | "right";
    }>;
    ornamentLabels: Array<{
      text: string;
      size: number;
      rotation: number;
      fontFamily: "Garamond" | "Poppins" | "Trispace";
    }>;
  };
  onConfigChange: (config: any) => void;
  onRestart?: () => void;
}

export default function DesignConfigurator({
  gpxData,
  boundingBox,
  designConfig,
  onConfigChange,
  onRestart,
}: DesignConfiguratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [newLabel, setNewLabel] = useState({
    text: "",
    fontFamily: "Trispace" as const,
    textAlign: "center" as const,
  });
  const [newOrnamentLabel, setNewOrnamentLabel] = useState({
    text: "",
    size: 24,
    rotation: 0,
    fontFamily: "Trispace" as const,
  });
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(
    null,
  );

  // Parse bounding box coordinates
  const bbox = boundingBox.split(",").map(Number); // [minLng, minLat, maxLng, maxLat]

  // Color options for routes
  const colorOptions = [
    { name: "Black", value: "#000000" },
    { name: "Blue", value: "#2563eb" },
    { name: "Red", value: "#ef4444" },
  ];

  // Font family options
  const fontFamilyOptions = [
    {
      name: "Trispace",
      value: "Trispace" as const,
      cssFont: "'Trispace', monospace",
    },
    {
      name: "Garamond",
      value: "Garamond" as const,
      cssFont: "'EB Garamond', serif",
    },
    {
      name: "Poppins",
      value: "Poppins" as const,
      cssFont: "'Poppins', sans-serif",
    },
  ];

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
      radius: number,
      rotation: number,
      fontSize: number,
      fontFamily: string = "'Trispace', monospace",
    ) => {
      ctx.save();
      ctx.translate(canvasSize / 2, canvasSize / 2);
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textWidth = ctx.measureText(text).width;
      const totalAngle = textWidth / radius;

      ctx.rotate(rotation * (Math.PI / 180) - totalAngle / 2);

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

      // Draw ornament circle and labels
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

        designConfig.ornamentLabels.forEach((label) => {
          const fontOption = fontFamilyOptions.find(
            (f) => f.value === label.fontFamily,
          );
          drawCurvedText(
            label.text,
            canvasSize * 0.35,
            label.rotation,
            label.size,
            fontOption?.cssFont || "'Trispace', monospace",
          );
        });
      }
    };

    redraw();
  }, [gpxData, boundingBox, bbox, designConfig]);

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
        },
      ];
      handleConfigChange({ labels: updatedLabels });
      setNewLabel({ text: "", fontFamily: "Trispace", textAlign: "center" });
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
        size: 24,
        rotation: 0,
        fontFamily: "Trispace",
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
        exportCtx.font = `bold ${label.size * scale}px ${fontOption?.cssFont || "'Trispace', monospace"}`;
        exportCtx.textAlign = label.textAlign || "center";
        exportCtx.textBaseline = "middle";
        exportCtx.fillText(label.text, 0, 0);
        exportCtx.restore();
      });
    }

    const pngBlob = await new Promise((resolve) =>
      exportCanvas.toBlob(resolve, "image/png"),
    );
    zip.file("design.png", pngBlob);

    const gpxString = gpxData.gpxString;
    zip.file("route.gpx", gpxString);

    let labelInfo = "Bounding Box:\n" + boundingBox + "\n\n";
    if (designConfig.printType === "tile") {
      labelInfo += "Tile Labels:\n";
      designConfig.labels.forEach((l, i) => {
        labelInfo += `  Label ${i + 1}: ${l.text}\n`;
      });
    } else {
      labelInfo += "Ornament Labels:\n";
      designConfig.ornamentLabels.forEach((l, i) => {
        labelInfo += `  Label ${i + 1}: ${l.text}\n`;
      });
    }
    zip.file("info.txt", labelInfo);

    zip.generateAsync({ type: "blob" }).then((content) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "landform-labs-design.zip";
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
                    className="p-3 bg-slate-50 rounded-lg border border-slate-storm/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-basalt">
                          {label.text}
                        </div>
                        <div className="text-xs text-slate-storm">
                          {label.fontFamily} • {label.size}px •{" "}
                          {label.rotation.toFixed(0)}°
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
                      Rotation: {label.rotation.toFixed(0)}°
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={label.rotation}
                      onChange={(e) =>
                        handleOrnamentLabelChange(index, {
                          rotation: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
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
            <div className="flex items-center gap-4">
              <button onClick={onRestart} className="btn-secondary">
                Start Over
              </button>
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
                        fontSize: label.size,
                        fontFamily:
                          fontFamilyOptions.find(
                            (f) => f.value === label.fontFamily,
                          )?.cssFont || "'Trispace', monospace",
                        textAlign: label.textAlign || "center",
                        justifyContent:
                          label.textAlign === "left"
                            ? "flex-start"
                            : label.textAlign === "right"
                              ? "flex-end"
                              : "center",
                      }}
                    >
                      {label.text}
                    </div>
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center text-white"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const rect =
                          e.currentTarget.parentElement?.getBoundingClientRect();
                        if (!rect) return;

                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;

                        const onMouseMove = (moveEvent: MouseEvent) => {
                          const dx = moveEvent.clientX - centerX;
                          const dy = moveEvent.clientY - centerY;
                          handleLabelChange(index, {
                            rotation: (Math.atan2(dy, dx) * 180) / Math.PI + 90,
                          });
                        };

                        const onMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            onMouseMove,
                          );
                          document.removeEventListener("mouseup", onMouseUp);
                        };

                        document.addEventListener("mousemove", onMouseMove);
                        document.addEventListener("mouseup", onMouseUp);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h-5M20 20v-5h-5"
                        />
                      </svg>
                    </div>
                  </Rnd>
                ))}
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
    </div>
  );
}
