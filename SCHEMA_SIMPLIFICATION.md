# Schema Simplification Summary

## Overview
The print export schema has been streamlined to include only manufacturing essentials, removing unnecessary metadata and complexity.

## What's Included (Manufacturing Essentials)

### 1. Bounding Box Details
- `routeData.bounds` - Full route bounding box
- `routeData.selectedBounds` - User-selected print area

### 2. GPX Data (Simplified)
- `routeData.gpxData.originalGpxString` - Simplified GPX file content
- `routeData.gpxData.points` - Simplified GPS track points with lat/lon/elevation

### 3. Label Information
- Text content
- Font family, size, style (bold, italic)
- Text alignment
- Position (x, y coordinates for tiles, angle/radius for ornaments)
- Size (width, height)
- Rotation (for tile labels)

### 4. Print Size
- `designConfig.dimensions.width` - Width in millimeters
- `designConfig.dimensions.height` - Height in millimeters
- `designConfig.dimensions.sizeName` - Human-readable size name (e.g., "ridgeline", "basecamp", "summit", "standard")

### 5. Print Type
- `printType` - Either "tile" or "ornament"

### 6. NFC Details
- `nfc.enabled` - Whether NFC chip should be included
- `nfc.targetUrl` - URL to program into chip (if enabled)

### 7. Route Details
- `designConfig.routeColor` - Hex color code for the route

## What Was Removed

### Removed Fields
- ❌ `orderInfo` - Order reference, timestamp, customer notes (not needed for manufacturing)
- ❌ `routeData.gpxData.tracks` - Duplicate of points array
- ❌ `routeData.gpxData.waypoints` - POI markers not needed for route print
- ❌ `routeData.gpxData.simplificationResult` - Metadata about simplification process
- ❌ `routeData.statistics` - Duration, timestamps, elevation stats
- ❌ `manufacturingSpecs.material` - Material type and color specs
- ❌ `manufacturingSpecs.dimensions` - Physical print dimensions (consolidated into designConfig)
- ❌ `manufacturingSpecs.rendering` - DPI, canvas size, hillshade settings, map snapshot
- ❌ `metadata.fileInfo` - Original filename, file size, upload timestamp
- ❌ `metadata.generationInfo` - App version, user agent, export format
- ❌ `metadata.qualityChecks` - Validation results

### Why These Were Removed
These fields were either:
1. **Redundant** - Already available elsewhere or not needed for manufacturing
2. **Metadata** - Useful for tracking but not for creating the physical print
3. **UI-specific** - Rendering settings that don't affect the final product
4. **Quality checks** - Validation data that doesn't inform manufacturing

## Schema Structure

```json
{
  "schemaVersion": "1.0.0",
  "printType": "tile" | "ornament",
  "routeData": {
    "gpxData": {
      "originalGpxString": "...",
      "points": [{ "lat": 0, "lon": 0, "ele": 0 }]
    },
    "bounds": { "minLat": 0, "maxLat": 0, "minLon": 0, "maxLon": 0 },
    "selectedBounds": { "minLat": 0, "maxLat": 0, "minLon": 0, "maxLon": 0 }
  },
  "designConfig": {
    "routeColor": "#000000",
    "dimensions": {
      "width": 155,
      "height": 155,
      "sizeName": "ridgeline"
    },
    "labels": [...],           // For tiles
    "ornamentLabels": [...],   // For ornaments
    "ornamentCircle": {...}    // For ornaments
  },
  "nfc": {
    "enabled": true,
    "targetUrl": "https://..."
  }
}
```

## Files Updated

1. **`schema/print-export-schema.json`** - Simplified JSON Schema definition
2. **`src/types/print-export.ts`** - Updated TypeScript interfaces
3. **`src/components/DesignConfigurator.tsx`** - Updated export logic to match simplified schema
4. **Removed**: `src/examples/enhanced-export.ts` - No longer needed
5. **Removed**: `src/utils/print-export.ts` - No longer needed

## Benefits

- ✅ **Clearer focus** - Only manufacturing-essential data
- ✅ **Smaller files** - Removed ~60% of JSON fields
- ✅ **Easier to maintain** - Less complexity in schema and code
- ✅ **Better performance** - Smaller payloads for export files
- ✅ **Simpler validation** - Fewer required fields to check
