/**
 * Example implementation of enhanced export using the new schema
 * This shows how to integrate the new PrintExportData schema with the existing app
 */

import JSZip from "jszip";
import type {
  PrintExportData,
  LegacyGPXData,
  LegacyDesignConfig,
  GPXData,
  DesignConfig,
  Bounds,
} from "@/types/print-export";
import {
  createPrintExportData,
  validateExportData,
  convertLegacyGPXData,
  getDefaultManufacturingSpecs,
} from "@/utils/print-export";

/**
 * Enhanced export function that replaces the current exportDesign function
 * This function creates a comprehensive export with all manufacturing data
 */
export const exportEnhancedDesign = async (
  // Current app parameters
  gpxData: LegacyGPXData,
  designConfig: LegacyDesignConfig,
  boundingBox: string, // "minLng,minLat,maxLng,maxLat"
  mapSnapshot?: string | null,
  canvasRef?: React.RefObject<HTMLCanvasElement>
): Promise<void> => {
  try {
    // Convert legacy data to new format
    const enhancedGPXData = convertLegacyGPXData(gpxData);
    
    // Parse bounding box
    const bboxCoords = boundingBox.split(",").map(Number);
    if (bboxCoords.length !== 4) {
      throw new Error("Invalid bounding box format");
    }

    const bounds: Bounds = {
      minLat: gpxData.bounds.minLat,
      maxLat: gpxData.bounds.maxLat,
      minLon: gpxData.bounds.minLon,
      maxLon: gpxData.bounds.maxLon,
    };

    const selectedBounds: Bounds = {
      minLon: bboxCoords[0],
      minLat: bboxCoords[1],
      maxLon: bboxCoords[2],
      maxLat: bboxCoords[3],
    };

    // Convert design config to new format
    const newDesignConfig: DesignConfig = {
      routeColor: designConfig.routeColor,
      printType: designConfig.printType,
      tileSize: designConfig.tileSize,
      labels: designConfig.labels.map(label => ({
        text: label.text,
        position: { x: label.x, y: label.y },
        size: { width: label.width, height: label.height },
        typography: {
          fontFamily: label.fontFamily,
          fontSize: label.size,
          textAlign: label.textAlign,
          bold: label.bold,
          italic: label.italic,
          color: label.color,
        },
        rotation: label.rotation,
      })),
      ornamentLabels: designConfig.ornamentLabels.map(label => ({
        text: label.text,
        angle: label.angle,
        radius: label.radius,
        typography: {
          fontFamily: label.fontFamily,
          fontSize: label.size,
          bold: label.bold,
          italic: label.italic,
          color: label.color,
        },
      })),
      ornamentCircle: designConfig.ornamentCircle,
    };

    // Create comprehensive export data
    const exportData = createPrintExportData({
      gpxData: enhancedGPXData,
      bounds,
      selectedBounds,
      designConfig: newDesignConfig,
      orderInfo: {
        stravaActivityUrl: gpxData.activityId 
          ? `https://www.strava.com/activities/${gpxData.activityId}` 
          : undefined,
      },
      manufacturingSpecs: {
        rendering: {
          resolution: {
            dpi: 300,
            canvasSize: 400,
          },
          mapSnapshot: mapSnapshot || undefined,
        },
      },
      metadata: {
        fileInfo: {
          originalFileName: gpxData.fileName,
          fileSize: gpxData.fileSize,
          uploadTimestamp: gpxData.date?.toISOString(),
        },
      },
    });

    // Validate the export data
    const validation = validateExportData(exportData);
    if (!validation.isValid) {
      console.error("Export validation failed:", validation.errors);
      throw new Error(`Export validation failed: ${validation.errors.join(", ")}`);
    }

    if (validation.warnings.length > 0) {
      console.warn("Export warnings:", validation.warnings);
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add the comprehensive JSON specification
    zip.file("print-specifications.json", JSON.stringify(exportData, null, 2));

    // Add design preview (if canvas available)
    if (canvasRef?.current) {
      const canvas = canvasRef.current;
      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (pngBlob) {
        zip.file("design-preview.png", pngBlob);
      }
    }

    // Add high-resolution preview (if needed for manufacturing)
    if (canvasRef?.current) {
      const highResBlob = await generateHighResolutionPreview(
        canvasRef.current,
        newDesignConfig,
        1200 // High resolution for manufacturing
      );
      if (highResBlob) {
        zip.file("design-preview-hires.png", highResBlob);
      }
    }

    // Add the original GPX file
    zip.file("route-data.gpx", enhancedGPXData.originalGpxString);

    // Add manufacturing specifications as separate file
    const manufacturingSpecs = {
      material: exportData.manufacturingSpecs.material,
      dimensions: exportData.manufacturingSpecs.dimensions,
      printSettings: {
        layerHeight: "0.2mm",
        infill: "15%",
        supports: false,
        buildPlateAdhesion: "brim",
      },
      postProcessing: {
        sanding: exportData.designConfig.printType === "tile",
        nfcInstallation: exportData.manufacturingSpecs.nfc?.enabled || false,
      },
    };
    zip.file("manufacturing-specs.json", JSON.stringify(manufacturingSpecs, null, 2));

    // Add detailed route analysis
    const routeAnalysis = generateRouteAnalysis(exportData);
    zip.file("route-analysis.json", JSON.stringify(routeAnalysis, null, 2));

    // Create comprehensive order summary
    const orderSummary = generateOrderSummary(exportData);
    zip.file("order-summary.txt", orderSummary);

    // Add quality check report
    const qualityReport = generateQualityReport(exportData);
    zip.file("quality-check.json", JSON.stringify(qualityReport, null, 2));

    // Generate and download the ZIP
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `landform-labs-order-${exportData.orderInfo.orderReference.split("-")[1]}.zip`;
    link.click();

    console.log("Enhanced export completed successfully", {
      orderReference: exportData.orderInfo.orderReference,
      totalFiles: Object.keys(zip.files).length,
      validation,
    });

  } catch (error) {
    console.error("Enhanced export failed:", error);
    throw error;
  }
};

/**
 * Generate high-resolution preview for manufacturing
 */
const generateHighResolutionPreview = async (
  sourceCanvas: HTMLCanvasElement,
  designConfig: DesignConfig,
  targetSize: number
): Promise<Blob | null> => {
  const exportCanvas = document.createElement("canvas");
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) return null;

  exportCanvas.width = targetSize;
  exportCanvas.height = targetSize;

  // Scale up the original canvas
  const scale = targetSize / sourceCanvas.width;
  ctx.drawImage(sourceCanvas, 0, 0, targetSize, targetSize);

  // Re-render labels at high resolution
  if (designConfig.printType === "tile" && designConfig.labels) {
    designConfig.labels.forEach(label => {
      ctx.save();
      ctx.translate(
        label.position.x * scale + (label.size.width * scale) / 2,
        label.position.y * scale + (label.size.height * scale) / 2
      );
      ctx.rotate((label.rotation || 0) * Math.PI / 180);
      ctx.fillStyle = label.typography.color || "#1f2937";
      ctx.font = `${label.typography.bold ? "bold " : ""}${label.typography.italic ? "italic " : ""}${label.typography.fontSize * scale}px ${label.typography.fontFamily}`;
      ctx.textAlign = label.typography.textAlign || "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label.text, 0, 0);
      ctx.restore();
    });
  }

  return new Promise(resolve => exportCanvas.toBlob(resolve, "image/png"));
};

/**
 * Generate detailed route analysis
 */
const generateRouteAnalysis = (exportData: PrintExportData) => {
  const { routeData } = exportData;
  const points = routeData.gpxData.points;
  
  // Calculate additional metrics
  const elevations = points.filter(p => p.ele !== undefined).map(p => p.ele!);
  const hasElevation = elevations.length > 0;
  
  const analysis = {
    overview: {
      totalPoints: routeData.statistics.totalPoints,
      totalDistance: routeData.statistics.totalDistance,
      hasElevationData: hasElevation,
      hasTimestamps: routeData.statistics.startTime !== undefined,
    },
    bounds: {
      total: routeData.bounds,
      selected: routeData.selectedBounds,
      selectionRatio: {
        lat: (routeData.selectedBounds.maxLat - routeData.selectedBounds.minLat) / 
             (routeData.bounds.maxLat - routeData.bounds.minLat),
        lon: (routeData.selectedBounds.maxLon - routeData.selectedBounds.minLon) / 
             (routeData.bounds.maxLon - routeData.bounds.minLon),
      },
    },
    elevation: hasElevation ? {
      min: routeData.statistics.minElevation,
      max: routeData.statistics.maxElevation,
      gain: routeData.statistics.elevationGain,
      loss: routeData.statistics.elevationLoss,
      range: routeData.statistics.maxElevation! - routeData.statistics.minElevation!,
    } : null,
    designComplexity: {
      labelCount: (exportData.designConfig.labels?.length || 0) + 
                   (exportData.designConfig.ornamentLabels?.length || 0),
      customColors: exportData.designConfig.routeColor !== "#2563eb",
      hasRotatedLabels: exportData.designConfig.labels?.some(l => l.rotation !== 0) || false,
    },
  };

  return analysis;
};

/**
 * Generate comprehensive order summary
 */
const generateOrderSummary = (exportData: PrintExportData): string => {
  const { orderInfo, designConfig, routeData, manufacturingSpecs } = exportData;
  
  let summary = `LANDFORM LABS - ENHANCED PRINT ORDER\n`;
  summary += `=========================================\n\n`;
  summary += `Order Reference: ${orderInfo.orderReference}\n`;
  summary += `Date: ${new Date(orderInfo.timestamp).toLocaleDateString()}\n`;
  summary += `Schema Version: ${exportData.schemaVersion}\n\n`;

  summary += `PRODUCT SPECIFICATIONS:\n`;
  summary += `Print Type: ${designConfig.printType.charAt(0).toUpperCase() + designConfig.printType.slice(1)}\n`;
  if (designConfig.tileSize) {
    summary += `Tile Size: ${designConfig.tileSize.charAt(0).toUpperCase() + designConfig.tileSize.slice(1)}\n`;
  }
  summary += `Route Color: ${designConfig.routeColor}\n`;
  summary += `Material: ${manufacturingSpecs.material.type} (${manufacturingSpecs.material.color})\n`;
  summary += `Dimensions: ${manufacturingSpecs.dimensions.width}mm × ${manufacturingSpecs.dimensions.height}mm × ${manufacturingSpecs.dimensions.depth}mm\n\n`;

  summary += `ROUTE DATA:\n`;
  summary += `Total Points: ${routeData.statistics.totalPoints.toLocaleString()}\n`;
  summary += `Distance: ${(routeData.statistics.totalDistance / 1000).toFixed(2)} km\n`;
  if (routeData.statistics.elevationGain) {
    summary += `Elevation Gain: ${routeData.statistics.elevationGain.toFixed(0)}m\n`;
  }
  if (routeData.gpxData.activityName) {
    summary += `Activity: ${routeData.gpxData.activityName}\n`;
  }
  if (orderInfo.stravaActivityUrl) {
    summary += `Strava: ${orderInfo.stravaActivityUrl}\n`;
  }
  summary += `\n`;

  summary += `DESIGN ELEMENTS:\n`;
  const totalLabels = (designConfig.labels?.length || 0) + (designConfig.ornamentLabels?.length || 0);
  summary += `Labels: ${totalLabels}\n`;
  if (manufacturingSpecs.nfc?.enabled) {
    summary += `NFC Chip: Included\n`;
    if (manufacturingSpecs.nfc.targetUrl) {
      summary += `NFC Target: ${manufacturingSpecs.nfc.targetUrl}\n`;
    }
  }
  summary += `\n`;

  summary += `FILES INCLUDED:\n`;
  summary += `- print-specifications.json: Complete technical specifications\n`;
  summary += `- route-data.gpx: Original GPS route data\n`;
  summary += `- design-preview.png: Standard resolution preview\n`;
  summary += `- design-preview-hires.png: High resolution for manufacturing\n`;
  summary += `- manufacturing-specs.json: Detailed manufacturing instructions\n`;
  summary += `- route-analysis.json: Comprehensive route analysis\n`;
  summary += `- quality-check.json: Data validation results\n`;
  summary += `- order-summary.txt: This human-readable summary\n\n`;

  summary += `QUALITY ASSURANCE:\n`;
  const qa = exportData.metadata?.qualityChecks;
  if (qa?.routeValidation) {
    summary += `✓ Route validation: ${qa.routeValidation.hasValidBounds ? 'PASS' : 'FAIL'}\n`;
    summary += `✓ Minimum points: ${qa.routeValidation.hasMinimumPoints ? 'PASS' : 'FAIL'}\n`;
    summary += `✓ Elevation data: ${qa.routeValidation.hasElevationData ? 'Available' : 'Not available'}\n`;
  }
  summary += `\n`;

  summary += `To place your order, email this entire ZIP file to: orders@landformlabs.co\n`;
  summary += `For questions about this order, reference: ${orderInfo.orderReference}\n`;

  return summary;
};

/**
 * Generate quality check report
 */
const generateQualityReport = (exportData: PrintExportData) => {
  const validation = validateExportData(exportData);
  const { routeData, designConfig } = exportData;

  return {
    timestamp: new Date().toISOString(),
    orderReference: exportData.orderInfo.orderReference,
    validation: {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    dataQuality: {
      route: {
        pointCount: routeData.statistics.totalPoints,
        hasElevation: routeData.gpxData.points.some(p => p.ele !== undefined),
        hasTimestamps: routeData.gpxData.points.some(p => p.time !== undefined),
        distanceReliability: routeData.statistics.totalDistance > 100 ? "good" : "low",
      },
      bounds: {
        validRoute: routeData.bounds.maxLat > routeData.bounds.minLat,
        validSelection: routeData.selectedBounds.maxLat > routeData.selectedBounds.minLat,
        selectionSize: {
          lat: routeData.selectedBounds.maxLat - routeData.selectedBounds.minLat,
          lon: routeData.selectedBounds.maxLon - routeData.selectedBounds.minLon,
        },
      },
      design: {
        hasLabels: (designConfig.labels?.length || 0) > 0 || (designConfig.ornamentLabels?.length || 0) > 0,
        colorValid: /^#[0-9A-Fa-f]{6}$/.test(designConfig.routeColor),
        printTypeConsistent: designConfig.printType === "tile" ? !!designConfig.tileSize : !designConfig.tileSize,
      },
    },
    recommendations: generateRecommendations(exportData),
  };
};

/**
 * Generate recommendations for the order
 */
const generateRecommendations = (exportData: PrintExportData): string[] => {
  const recommendations: string[] = [];
  const { routeData, designConfig, manufacturingSpecs } = exportData;

  // Route quality recommendations
  if (routeData.statistics.totalPoints < 100) {
    recommendations.push("Route has few GPS points - consider using a longer or more detailed route for better print quality");
  }

  if (!routeData.gpxData.points.some(p => p.ele !== undefined)) {
    recommendations.push("Route lacks elevation data - hillshade rendering may be less detailed");
  }

  // Design recommendations
  const totalLabels = (designConfig.labels?.length || 0) + (designConfig.ornamentLabels?.length || 0);
  if (totalLabels === 0) {
    recommendations.push("Consider adding labels to personalize your print");
  }

  if (totalLabels > 5) {
    recommendations.push("Many labels detected - ensure text is readable at print size");
  }

  // Size recommendations
  const boundingSize = Math.max(
    routeData.selectedBounds.maxLat - routeData.selectedBounds.minLat,
    routeData.selectedBounds.maxLon - routeData.selectedBounds.minLon
  );
  
  if (boundingSize < 0.01 && designConfig.tileSize === "summit") {
    recommendations.push("Small route area with large tile size - consider a smaller tile size for better detail");
  }

  if (boundingSize > 0.1 && designConfig.tileSize === "basecamp") {
    recommendations.push("Large route area with small tile size - consider a larger tile size to show more detail");
  }

  return recommendations;
};

export default exportEnhancedDesign;