/**
 * Landform Labs Print Export Type Definitions
 * Generated from print-export-schema.json v1.0.0
 */

// GPS and Route Data Types
export interface GPSPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string; // ISO 8601 date-time
}

export interface Waypoint {
  lat: number;
  lon: number;
  name?: string;
  ele?: number;
  desc?: string;
}

export interface TrackSegment {
  points: GPSPoint[];
}

export interface Track {
  name?: string;
  segments: TrackSegment[];
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface RouteStatistics {
  totalPoints: number;
  totalDistance: number;
  totalDuration?: number;
  startTime?: string; // ISO 8601 date-time
  endTime?: string; // ISO 8601 date-time
  elevationGain?: number;
  elevationLoss?: number;
  maxElevation?: number;
  minElevation?: number;
}

export interface SimplificationResult {
  originalCount: number;
  simplifiedCount: number;
  reductionPercentage: number;
  toleranceUsed: number;
}

export interface GPXData {
  originalGpxString: string;
  activityName?: string;
  points: GPSPoint[];
  tracks?: Track[];
  waypoints?: Waypoint[];
  // GPX Simplification data (if applied)
  originalPoints?: GPSPoint[];
  simplificationResult?: SimplificationResult;
}

export interface RouteData {
  gpxData: GPXData;
  bounds: Bounds;
  selectedBounds: Bounds;
  statistics: RouteStatistics;
}

// Design Configuration Types
export type FontFamily = "Garamond" | "Poppins" | "Trispace";
export type TextAlign = "left" | "center" | "right";
export type PrintType = "tile" | "ornament";
export type TileSize = "basecamp" | "ridgeline" | "summit";

export interface Typography {
  fontFamily: FontFamily;
  fontSize: number;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  color?: string; // hex color
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TileLabel {
  text: string;
  position: Position;
  size: Size;
  typography: Typography;
  rotation?: number;
}

export interface OrnamentLabel {
  text: string;
  angle: number; // 0-360 degrees
  radius: number;
  typography: Typography;
}

export interface OrnamentCircle {
  x: number;
  y: number;
  radius: number;
}

export interface DesignConfig {
  routeColor: string; // hex color
  printType: PrintType;
  tileSize?: TileSize;
  labels?: TileLabel[];
  ornamentLabels?: OrnamentLabel[];
  ornamentCircle?: OrnamentCircle;
}

// Manufacturing and Technical Specifications
export type MaterialType = "PLA" | "PETG" | "ABS";

export interface Material {
  type: MaterialType;
  color: string;
}

export interface Dimensions {
  width: number; // millimeters
  height: number; // millimeters
  depth?: number; // millimeters
  baseThickness?: number; // millimeters
  routeHeight?: number; // millimeters
}

export interface Resolution {
  dpi: number;
  canvasSize: number; // pixels
}

export interface HillshadeSettings {
  enabled?: boolean;
  opacity?: number; // 0-1
  tileZoom?: number; // 1-18
}

export interface RenderingConfig {
  resolution: Resolution;
  hillshade?: HillshadeSettings;
  mapSnapshot?: string; // base64 encoded image
}

export interface NFCConfig {
  enabled?: boolean;
  targetUrl?: string;
  chipType?: string;
}

export interface ManufacturingSpecs {
  material: Material;
  dimensions: Dimensions;
  rendering: RenderingConfig;
  nfc?: NFCConfig;
}

// Order and Metadata Types
export interface OrderInfo {
  orderReference: string; // format: LF-{timestamp}
  timestamp: string; // ISO 8601 date-time
  printType: PrintType;
  tileSize?: TileSize;
  stravaActivityUrl?: string;
  customerNotes?: string;
}

export interface FileInfo {
  originalFileName?: string;
  fileSize?: number; // bytes
  uploadTimestamp?: string; // ISO 8601 date-time
}

export interface GenerationInfo {
  appVersion?: string;
  userAgent?: string;
  exportFormat?: "zip" | "json";
}

export interface RouteValidation {
  hasMinimumPoints?: boolean;
  hasValidBounds?: boolean;
  hasElevationData?: boolean;
  hasTimestamps?: boolean;
}

export interface DesignValidation {
  hasValidColors?: boolean;
  labelCount?: number;
  allLabelsWithinBounds?: boolean;
}

export interface QualityChecks {
  routeValidation?: RouteValidation;
  designValidation?: DesignValidation;
}

export interface Metadata {
  fileInfo?: FileInfo;
  generationInfo?: GenerationInfo;
  qualityChecks?: QualityChecks;
}

// Main Export Interface
export interface PrintExportData {
  schemaVersion: "1.0.0";
  orderInfo: OrderInfo;
  routeData: RouteData;
  designConfig: DesignConfig;
  manufacturingSpecs: ManufacturingSpecs;
  metadata?: Metadata;
}

// Utility Types for Working with Export Data
export type PartialPrintExportData = Partial<PrintExportData> & {
  orderInfo: OrderInfo;
  routeData: Pick<RouteData, "gpxData">;
};

export interface ExportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Helper type for creating new exports
export interface CreateExportOptions {
  gpxData: GPXData;
  bounds: Bounds;
  selectedBounds: Bounds;
  designConfig: DesignConfig;
  orderInfo?: Partial<OrderInfo>;
  manufacturingSpecs?: Partial<ManufacturingSpecs>;
  metadata?: Partial<Metadata>;
}

// Legacy compatibility (current app structure)
export interface LegacyGPXData {
  fileName: string;
  fileSize: number;
  gpxString: string;
  points: { lat: number; lon: number; ele?: number }[];
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  totalPoints: number;
  activityName?: string;
  date?: Date;
  distance: number;
  duration: number;
  activityId?: string;
}

export interface LegacyDesignConfig {
  routeColor: string;
  printType: "tile" | "ornament";
  tileSize: "basecamp" | "ridgeline" | "summit";
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
    bold: boolean;
    italic: boolean;
    color?: string;
  }>;
  ornamentLabels: Array<{
    text: string;
    angle: number;
    radius: number;
    size: number;
    fontFamily: "Garamond" | "Poppins" | "Trispace";
    bold: boolean;
    italic: boolean;
    color?: string;
  }>;
  ornamentCircle: {
    x: number;
    y: number;
    radius: number;
  };
}