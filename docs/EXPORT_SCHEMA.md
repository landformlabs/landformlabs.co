# Landform Labs Print Export Schema v1.0.0

This document describes the comprehensive JSON schema for exporting 3D print data from the Landform Labs design application. The schema includes all necessary information for manufacturing custom route prints, including GPS data, design configuration, and manufacturing specifications.

## Overview

The export schema captures:
- **Complete GPX data**: Original file content, parsed GPS points, elevation data, timestamps
- **Route metadata**: Statistics, bounds, activity information
- **Design configuration**: Labels, colors, print type, dimensions
- **Manufacturing specs**: Material, dimensions, rendering settings, NFC configuration
- **Quality assurance**: Validation results, recommendations, data quality metrics

## Schema Files

- `schema/print-export-schema.json` - JSON Schema definition
- `src/types/print-export.ts` - TypeScript interfaces
- `src/utils/print-export.ts` - Utility functions
- `src/examples/enhanced-export.ts` - Example implementation

## Key Improvements Over Legacy Format

### 1. Complete GPX Data Structure
```typescript
// OLD: Only basic parsed data
{
  gpxString: string;
  points: Array<{lat: number, lon: number}>;
}

// NEW: Complete structured data
{
  gpxData: {
    originalGpxString: string;
    points: Array<{lat: number, lon: number, ele?: number, time?: string}>;
    tracks?: Track[];
    waypoints?: Waypoint[];
    activityName?: string;
  }
}
```

### 2. Comprehensive Route Statistics
```typescript
{
  statistics: {
    totalPoints: number;
    totalDistance: number;
    totalDuration?: number;
    elevationGain?: number;
    elevationLoss?: number;
    maxElevation?: number;
    minElevation?: number;
    startTime?: string;
    endTime?: string;
  }
}
```

### 3. Manufacturing Specifications
```typescript
{
  manufacturingSpecs: {
    material: {
      type: "PLA" | "PETG" | "ABS";
      color: string;
    };
    dimensions: {
      width: number;    // mm
      height: number;   // mm
      depth?: number;   // mm
      baseThickness?: number;
      routeHeight?: number;
    };
    rendering: {
      resolution: { dpi: number; canvasSize: number };
      hillshade?: { enabled: boolean; opacity: number; tileZoom: number };
      mapSnapshot?: string; // base64
    };
    nfc?: {
      enabled: boolean;
      targetUrl?: string;
      chipType?: string;
    };
  }
}
```

### 4. Quality Assurance & Validation
```typescript
{
  metadata: {
    qualityChecks: {
      routeValidation: {
        hasMinimumPoints: boolean;
        hasValidBounds: boolean;
        hasElevationData: boolean;
        hasTimestamps: boolean;
      };
      designValidation: {
        hasValidColors: boolean;
        labelCount: number;
        allLabelsWithinBounds: boolean;
      };
    };
  }
}
```

## Usage Examples

### Creating Export Data
```typescript
import { createPrintExportData, convertLegacyGPXData } from '@/utils/print-export';

// Convert from legacy format
const gpxData = convertLegacyGPXData(legacyGPXData);

// Create comprehensive export
const exportData = createPrintExportData({
  gpxData,
  bounds: routeBounds,
  selectedBounds: userSelectedBounds,
  designConfig: {
    printType: "tile",
    tileSize: "ridgeline",
    routeColor: "#2563eb",
    labels: [...]
  }
});
```

### Validating Export Data
```typescript
import { validateExportData } from '@/utils/print-export';

const validation = validateExportData(exportData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Validation warnings:', validation.warnings);
}
```

### Enhanced Export Function
```typescript
import { exportEnhancedDesign } from '@/examples/enhanced-export';

// Replace the current exportDesign function with this enhanced version
await exportEnhancedDesign(
  gpxData,        // LegacyGPXData
  designConfig,   // LegacyDesignConfig  
  boundingBox,    // string
  mapSnapshot,    // string | null
  canvasRef       // React.RefObject<HTMLCanvasElement>
);
```

## Export Package Contents

The enhanced export creates a ZIP file containing:

### Core Files
- `print-specifications.json` - Complete technical specifications (new schema)
- `route-data.gpx` - Original GPS route data
- `design-preview.png` - Standard resolution preview (400px)
- `design-preview-hires.png` - High resolution for manufacturing (1200px)

### Manufacturing Files
- `manufacturing-specs.json` - Detailed manufacturing instructions
- `route-analysis.json` - Comprehensive route analysis and metrics
- `quality-check.json` - Data validation results and recommendations

### Documentation
- `order-summary.txt` - Human-readable order summary

## Schema Validation

The schema includes comprehensive validation rules:

### Required Fields
- `schemaVersion` - Must be "1.0.0"
- `orderInfo.orderReference` - Format: "LF-{timestamp}"
- `routeData.gpxData.points` - Minimum 2 GPS points
- `designConfig.printType` - "tile" or "ornament"

### Data Quality Checks
- GPS coordinates within valid ranges (-90/90 lat, -180/180 lon)
- Color values in valid hex format (#RRGGBB)
- Consistent print type and size configuration
- Valid font families and label positioning

### Manufacturing Constraints
- Minimum/maximum dimensions based on print type
- Material and color compatibility
- NFC configuration validation
- Resolution and rendering settings

## Migration from Legacy Format

To integrate with existing code:

1. **Install the new types**: Import from `@/types/print-export`
2. **Add utility functions**: Import from `@/utils/print-export`  
3. **Replace export function**: Use enhanced export from examples
4. **Validate data**: Add validation to catch issues early

### Backward Compatibility
The schema includes utilities to convert between formats:
```typescript
// Convert new format back to legacy (if needed)
const { gpxData, designConfig, boundingBox } = toLegacyFormat(exportData);
```

## Benefits for Manufacturing

### For 3D Printing
- Precise material specifications
- Exact dimensional requirements
- Layer height and print settings
- Post-processing instructions

### For Quality Control
- Automated validation
- Data quality metrics
- Manufacturing recommendations
- Traceability through order reference

### For Customer Service
- Complete order history
- Clear troubleshooting data
- Standardized file format
- Human-readable summaries

## Schema Evolution

The schema is versioned to support future enhancements:
- `schemaVersion: "1.0.0"` - Current version
- Future versions will maintain backward compatibility
- Migration utilities will be provided for major version changes

## Integration Checklist

- [ ] Add new type definitions to project
- [ ] Import utility functions for data conversion
- [ ] Replace export function with enhanced version
- [ ] Add validation to data input pipeline
- [ ] Update manufacturing workflow to use new specifications
- [ ] Test with existing GPX files and design configurations
- [ ] Update documentation for customer-facing features

## Examples

See `src/examples/enhanced-export.ts` for a complete implementation that shows how to:
- Convert legacy data to new format
- Generate all export files
- Validate data quality
- Create manufacturing specifications
- Generate quality reports and recommendations

The enhanced export provides everything needed for manufacturing while maintaining compatibility with the existing application structure.