/**
 * Landform Labs Print Export Type Definitions
 * Generated from print-export-schema.json v1.0.0
 *
 * Simplified schema focused on manufacturing essentials:
 * - Bounding box details
 * - GPX data (simplified)
 * - Label information (text, size, font, location)
 * - Print size and type
 * - NFC details
 * - Route details (color)
 */

// GPS and Route Data Types
export interface GPSPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface GPXData {
  originalGpxString: string; // Simplified GPX string optimized for manufacturing
  points: GPSPoint[]; // Simplified GPS points optimized for 3D printing
}

export interface RouteData {
  gpxData: GPXData;
  bounds: Bounds;
  selectedBounds: Bounds;
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
  dimensions: {
    width: number; // millimeters
    height: number; // millimeters
    sizeName: string; // human-readable size name (e.g., 'ridgeline', 'basecamp', 'summit', 'standard')
  };
  labels?: TileLabel[];
  ornamentLabels?: OrnamentLabel[];
  ornamentCircle?: OrnamentCircle;
}

// NFC Configuration
export interface NFCConfig {
  enabled: boolean;
  targetUrl?: string; // Required if enabled is true
}

// Main Export Interface
export interface PrintExportData {
  schemaVersion: "1.0.0";
  printType: PrintType;
  routeData: RouteData;
  designConfig: DesignConfig;
  nfc: NFCConfig;
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