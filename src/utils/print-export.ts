/**
 * Utility functions for working with Print Export data
 */

import type {
  PrintExportData,
  LegacyGPXData,
  LegacyDesignConfig,
  CreateExportOptions,
  ExportValidationResult,
  RouteStatistics,
  GPXData,
  ManufacturingSpecs,
  Metadata,
  GPSPoint,
} from "@/types/print-export";

/**
 * Default manufacturing specifications based on product type and size
 */
export const getDefaultManufacturingSpecs = (
  printType: "tile" | "ornament",
  tileSize?: "basecamp" | "ridgeline" | "summit"
): ManufacturingSpecs => {
  const baseDimensions = {
    tile: {
      basecamp: { width: 100, height: 100 },
      ridgeline: { width: 155, height: 155 },
      summit: { width: 210, height: 210 },
    },
    ornament: { width: 100, height: 100 }, // Standard ornament size
  };

  let dimensions;
  if (printType === "tile" && tileSize) {
    dimensions = baseDimensions.tile[tileSize];
  } else {
    dimensions = baseDimensions.ornament;
  }

  return {
    material: {
      type: "PLA",
      color: printType === "ornament" ? "white" : "black",
    },
    dimensions: {
      ...dimensions,
      depth: printType === "tile" ? 6 : 3,
      baseThickness: 2,
      routeHeight: printType === "tile" ? 1.5 : 1,
    },
    rendering: {
      resolution: {
        dpi: 300,
        canvasSize: 400,
      },
      hillshade: {
        enabled: true,
        opacity: 1,
        tileZoom: 14,
      },
    },
    nfc: {
      enabled: printType === "tile",
    },
  };
};

/**
 * Calculate route statistics from GPS points
 */
export const calculateRouteStatistics = (points: GPSPoint[]): RouteStatistics => {
  if (points.length < 2) {
    return {
      totalPoints: points.length,
      totalDistance: 0,
    };
  }

  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxElevation = -Infinity;
  let minElevation = Infinity;
  let startTime: string | undefined;
  let endTime: string | undefined;

  // Calculate distance and elevation data
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    // Distance calculation using Haversine formula
    const distance = calculateDistance(current, next);
    totalDistance += distance;

    // Elevation calculations
    if (current.ele !== undefined) {
      maxElevation = Math.max(maxElevation, current.ele);
      minElevation = Math.min(minElevation, current.ele);
    }

    if (current.ele !== undefined && next.ele !== undefined) {
      const elevDiff = next.ele - current.ele;
      if (elevDiff > 0) {
        elevationGain += elevDiff;
      } else {
        elevationLoss += Math.abs(elevDiff);
      }
    }
  }

  // Handle last point for elevation
  const lastPoint = points[points.length - 1];
  if (lastPoint.ele !== undefined) {
    maxElevation = Math.max(maxElevation, lastPoint.ele);
    minElevation = Math.min(minElevation, lastPoint.ele);
  }

  // Time calculations
  const timesWithData = points.filter(p => p.time).map(p => p.time!);
  if (timesWithData.length >= 2) {
    startTime = timesWithData[0];
    endTime = timesWithData[timesWithData.length - 1];
  }

  const result: RouteStatistics = {
    totalPoints: points.length,
    totalDistance,
  };

  if (startTime && endTime) {
    result.startTime = startTime;
    result.endTime = endTime;
    result.totalDuration = new Date(endTime).getTime() - new Date(startTime).getTime();
  }

  if (maxElevation !== -Infinity) {
    result.maxElevation = maxElevation;
    result.minElevation = minElevation;
    result.elevationGain = elevationGain;
    result.elevationLoss = elevationLoss;
  }

  return result;
};

/**
 * Calculate distance between two GPS points using Haversine formula
 */
export const calculateDistance = (point1: GPSPoint, point2: GPSPoint): number => {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLngRad = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Convert legacy GPX data to new format
 */
export const convertLegacyGPXData = (legacy: LegacyGPXData): GPXData => {
  return {
    originalGpxString: legacy.gpxString,
    activityName: legacy.activityName,
    points: legacy.points.map(p => ({
      lat: p.lat,
      lon: p.lon,
      ele: p.ele,
    })),
  };
};

/**
 * Create a complete export data structure
 */
export const createPrintExportData = (options: CreateExportOptions): PrintExportData => {
  const {
    gpxData,
    bounds,
    selectedBounds,
    designConfig,
    orderInfo = {},
    manufacturingSpecs = {},
    metadata = {},
  } = options;

  // Calculate route statistics
  const statistics = calculateRouteStatistics(gpxData.points);

  // Generate order reference if not provided
  const timestamp = new Date().toISOString();
  const orderReference = orderInfo.orderReference || `LF-${Date.now()}`;

  // Get default manufacturing specs
  const defaultManufacturingSpecs = getDefaultManufacturingSpecs(
    designConfig.printType,
    designConfig.tileSize
  );

  // Merge with provided specs
  const finalManufacturingSpecs: ManufacturingSpecs = {
    material: { ...defaultManufacturingSpecs.material, ...manufacturingSpecs.material },
    dimensions: { ...defaultManufacturingSpecs.dimensions, ...manufacturingSpecs.dimensions },
    rendering: {
      ...defaultManufacturingSpecs.rendering,
      ...manufacturingSpecs.rendering,
      resolution: {
        ...defaultManufacturingSpecs.rendering.resolution,
        ...manufacturingSpecs.rendering?.resolution,
      },
      hillshade: {
        ...defaultManufacturingSpecs.rendering.hillshade,
        ...manufacturingSpecs.rendering?.hillshade,
      },
    },
    nfc: { ...defaultManufacturingSpecs.nfc, ...manufacturingSpecs.nfc },
  };

  // Create metadata with generation info
  const finalMetadata: Metadata = {
    generationInfo: {
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      exportFormat: "zip",
      ...metadata.generationInfo,
    },
    qualityChecks: {
      routeValidation: {
        hasMinimumPoints: statistics.totalPoints >= 2,
        hasValidBounds: bounds.maxLat > bounds.minLat && bounds.maxLon > bounds.minLon,
        hasElevationData: gpxData.points.some(p => p.ele !== undefined),
        hasTimestamps: gpxData.points.some(p => p.time !== undefined),
      },
      designValidation: {
        hasValidColors: /^#[0-9A-Fa-f]{6}$/.test(designConfig.routeColor),
        labelCount: (designConfig.labels?.length || 0) + (designConfig.ornamentLabels?.length || 0),
        allLabelsWithinBounds: true, // TODO: Implement bounds checking
      },
      ...metadata.qualityChecks,
    },
    ...metadata,
  };

  return {
    schemaVersion: "1.0.0",
    orderInfo: {
      printType: designConfig.printType,
      timestamp,
      orderReference,
      tileSize: designConfig.tileSize,
      ...orderInfo,
    },
    routeData: {
      gpxData,
      bounds,
      selectedBounds,
      statistics,
    },
    designConfig,
    manufacturingSpecs: finalManufacturingSpecs,
    metadata: finalMetadata,
  };
};

/**
 * Validate export data against schema requirements
 */
export const validateExportData = (data: PrintExportData): ExportValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!data.schemaVersion) errors.push("Missing schema version");
  if (!data.orderInfo?.orderReference) errors.push("Missing order reference");
  if (!data.routeData?.gpxData?.points?.length) errors.push("Missing GPS points");
  if (data.routeData?.gpxData?.points?.length < 2) errors.push("Insufficient GPS points (minimum 2 required)");

  // Validate print type and tile size consistency
  if (data.designConfig.printType === "tile" && !data.designConfig.tileSize) {
    errors.push("Tile size is required for tile prints");
  }
  if (data.designConfig.printType === "ornament" && data.designConfig.tileSize) {
    warnings.push("Tile size is ignored for ornament prints");
  }

  // Validate colors
  if (!/^#[0-9A-Fa-f]{6}$/.test(data.designConfig.routeColor)) {
    errors.push("Invalid route color format (must be hex)");
  }

  // Validate bounds
  const { bounds, selectedBounds } = data.routeData;
  if (bounds.maxLat <= bounds.minLat || bounds.maxLon <= bounds.minLon) {
    errors.push("Invalid route bounds");
  }
  if (selectedBounds.maxLat <= selectedBounds.minLat || selectedBounds.maxLon <= selectedBounds.minLon) {
    errors.push("Invalid selected bounds");
  }

  // Check for empty GPX string
  if (!data.routeData.gpxData.originalGpxString?.trim()) {
    errors.push("Missing original GPX data");
  }

  // Validate labels
  if (data.designConfig.printType === "tile" && data.designConfig.labels) {
    data.designConfig.labels.forEach((label, index) => {
      if (!label.text?.trim()) warnings.push(`Empty text in label ${index + 1}`);
      if (label.typography.fontSize <= 0) errors.push(`Invalid font size in label ${index + 1}`);
    });
  }

  if (data.designConfig.printType === "ornament" && data.designConfig.ornamentLabels) {
    data.designConfig.ornamentLabels.forEach((label, index) => {
      if (!label.text?.trim()) warnings.push(`Empty text in ornament label ${index + 1}`);
      if (label.angle < 0 || label.angle > 360) errors.push(`Invalid angle in ornament label ${index + 1}`);
      if (label.radius < 0) errors.push(`Invalid radius in ornament label ${index + 1}`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Convert new export data back to legacy format for compatibility
 */
export const toLegacyFormat = (exportData: PrintExportData): {
  gpxData: LegacyGPXData;
  designConfig: LegacyDesignConfig;
  boundingBox: string;
} => {
  const { routeData, designConfig } = exportData;

  const legacyGPXData: LegacyGPXData = {
    fileName: exportData.metadata?.fileInfo?.originalFileName || "route.gpx",
    fileSize: exportData.metadata?.fileInfo?.fileSize || 0,
    gpxString: routeData.gpxData.originalGpxString,
    points: routeData.gpxData.points,
    bounds: routeData.bounds,
    totalPoints: routeData.statistics.totalPoints,
    activityName: routeData.gpxData.activityName,
    distance: routeData.statistics.totalDistance,
    duration: routeData.statistics.totalDuration || 0,
  };

  if (routeData.statistics.startTime) {
    legacyGPXData.date = new Date(routeData.statistics.startTime);
  }

  // Extract activity ID from Strava URL if present
  if (exportData.orderInfo.stravaActivityUrl) {
    const match = exportData.orderInfo.stravaActivityUrl.match(/activities\/(\d+)/);
    if (match) {
      legacyGPXData.activityId = match[1];
    }
  }

  const legacyDesignConfig: LegacyDesignConfig = {
    routeColor: designConfig.routeColor,
    printType: designConfig.printType,
    tileSize: designConfig.tileSize || "ridgeline",
    labels: (designConfig.labels || []).map(label => ({
      text: label.text,
      x: label.position.x,
      y: label.position.y,
      size: label.typography.fontSize,
      rotation: label.rotation || 0,
      width: label.size.width,
      height: label.size.height,
      fontFamily: label.typography.fontFamily,
      textAlign: label.typography.textAlign || "center",
      bold: label.typography.bold || false,
      italic: label.typography.italic || false,
      color: label.typography.color,
    })),
    ornamentLabels: (designConfig.ornamentLabels || []).map(label => ({
      text: label.text,
      angle: label.angle,
      radius: label.radius,
      size: label.typography.fontSize,
      fontFamily: label.typography.fontFamily,
      bold: label.typography.bold || false,
      italic: label.typography.italic || false,
      color: label.typography.color,
    })),
    ornamentCircle: designConfig.ornamentCircle || { x: 200, y: 200, radius: 160 },
  };

  const boundingBox = [
    routeData.selectedBounds.minLon,
    routeData.selectedBounds.minLat,
    routeData.selectedBounds.maxLon,
    routeData.selectedBounds.maxLat,
  ].join(",");

  return {
    gpxData: legacyGPXData,
    designConfig: legacyDesignConfig,
    boundingBox,
  };
};