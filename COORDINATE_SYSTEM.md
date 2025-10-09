# Label Coordinate System for Blender Integration

## Overview
The JSON export uses a 2D canvas-based coordinate system with specific conventions for label placement. This document explains how to interpret these coordinates in Blender.

**Important**: All coordinates in the exported JSON are automatically scaled to the canonical `400x400` canvas coordinate space, regardless of the display size on the user's screen. This ensures consistency across all devices.

## Canvas Coordinate System

### Canvas Size
- **Base canvas size**: `400 x 400` pixels (canonical coordinate space)
- **Export resolution**: `1200 x 1200` pixels (scaled up 3x for PNG export)

### Origin Point (0,0)
- **Location**: Top-left corner of the canvas
- **X-axis**: Increases from left (0) to right (400)
- **Y-axis**: Increases from top (0) to bottom (400)

```
(0,0) ──────────> X (400)
  │
  │
  │
  ▼
  Y (400)
```

## Tile Labels

### Position Coordinates
Labels have a `position` object with `x` and `y` coordinates:

```json
{
  "position": {
    "x": 50,    // Distance from left edge in pixels
    "y": 100    // Distance from top edge in pixels
  }
}
```

### Size
Labels have a `size` object defining their bounding box:

```json
{
  "size": {
    "width": 150,   // Width of label bounding box
    "height": 40    // Height of label bounding box
  }
}
```

### Pivot Point
The label's **pivot point** for rotation and positioning is at the **center** of its bounding box:

```
Pivot Point X = position.x + (size.width / 2)
Pivot Point Y = position.y + (size.height / 2)
```

### Rotation
- `rotation`: Angle in degrees (0-360 or -360-360)
- Rotates around the pivot point (center of bounding box)
- Positive rotation is **clockwise** when viewing the canvas with Y-down orientation

### Text Alignment
- `typography.textAlign`: "left", "center", or "right"
- Aligns text within the label's bounding box
- The pivot point remains at the center of the box regardless of alignment

## Ornament Labels

### Position System
Ornament labels use a **polar coordinate system** centered on the ornament circle:

```json
{
  "angle": 90,      // Position around circle in degrees (0 = top)
  "radius": 180     // Distance from center point in pixels
}
```

### Ornament Circle
The ornament circle is always centered on the canvas:

```json
{
  "ornamentCircle": {
    "x": 200,       // Center X (canvasSize / 2)
    "y": 200,       // Center Y (canvasSize / 2)
    "radius": 190   // Circle radius (canvasSize / 2 - 10)
  }
}
```

### Angle Convention
- **0°**: Top of circle (12 o'clock position)
- **90°**: Right side (3 o'clock position)
- **180°**: Bottom (6 o'clock position)
- **270°**: Left side (9 o'clock position)
- Range: 0-360 degrees

### Curved Text
- Text follows the curve of the circle
- Characters are positioned along an arc at the specified radius
- Text automatically flips for bottom half (180° - 360°) to remain readable

## Route Coordinate Mapping

GPS coordinates are mapped to canvas coordinates using the selected bounds:

```javascript
// bbox = [minLon, minLat, maxLon, maxLat]
x = ((longitude - bbox[0]) / (bbox[2] - bbox[0])) * canvasSize
y = canvasSize - ((latitude - bbox[1]) / (bbox[3] - bbox[1])) * canvasSize
```

**Note**: Y-coordinate is inverted (`canvasSize - ...`) because:
- Canvas Y increases downward (0 at top)
- Latitude increases upward (north)

## Converting to Blender (3D Print Space)

### For Tile Labels

1. **Origin Transform**: Move origin from top-left to bottom-left
   ```python
   blender_x = label_x
   blender_y = canvas_size - label_y  # Flip Y-axis
   ```

2. **Scale to Physical Dimensions**: Convert pixels to millimeters
   ```python
   # For a 155mm x 155mm tile (ridgeline)
   scale_factor = 155 / 400  # mm per pixel
   physical_x = blender_x * scale_factor
   physical_y = blender_y * scale_factor
   ```

3. **Rotation**: Use the same rotation value (degrees)
   - Ensure rotation is around the pivot point (center of bounding box)

4. **Text Alignment**:
   - Left align: Text starts at left edge of box
   - Center align: Text centered in box
   - Right align: Text ends at right edge of box

### For Ornament Labels

1. **Polar to Cartesian Conversion**:
   ```python
   # Center point
   center_x = ornament_circle.x
   center_y = ornament_circle.y

   # Convert angle (canvas: 0° = top) to radians
   # Adjust for different angle conventions if needed
   angle_rad = (angle - 90) * (π / 180)  # Shift by -90° if needed

   # Calculate position
   canvas_x = center_x + radius * cos(angle_rad)
   canvas_y = center_y + radius * sin(angle_rad)
   ```

2. **Y-axis Flip**: Convert to Blender's coordinate system
   ```python
   blender_x = canvas_x
   blender_y = canvas_size - canvas_y
   ```

3. **Scale to Physical**: 75mm diameter for ornaments
   ```python
   scale_factor = 75 / 400
   physical_x = blender_x * scale_factor
   physical_y = blender_y * scale_factor
   ```

## Physical Dimensions

### Tile Sizes
- **Basecamp**: 100mm × 100mm
- **Ridgeline**: 155mm × 155mm
- **Summit**: 210mm × 210mm

### Ornament Size
- **Standard**: 75mm × 75mm (75mm diameter circle)

## Example Calculation

For a tile label with:
```json
{
  "position": { "x": 50, "y": 100 },
  "size": { "width": 150, "height": 40 },
  "rotation": 15
}
```

On a Ridgeline tile (155mm × 155mm):

1. **Pivot point (canvas space)**:
   - X: 50 + 150/2 = 125 pixels
   - Y: 100 + 40/2 = 120 pixels

2. **Convert to Blender (bottom-left origin)**:
   - X: 125 pixels
   - Y: 400 - 120 = 280 pixels

3. **Scale to physical dimensions**:
   - Scale: 155mm / 400px = 0.3875 mm/px
   - Physical X: 125 × 0.3875 = 48.44mm from left
   - Physical Y: 280 × 0.3875 = 108.5mm from bottom

4. **Rotation**: 15° clockwise around pivot point

## Typography Details

Font sizes in the JSON are in **points** and should be scaled proportionally:

```python
# Example for tile scaling
tile_size_scaling = {
    "basecamp": 1.0,
    "ridgeline": 1.55,
    "summit": 2.1
}

physical_font_size = font_size_points * tile_size_scaling[tile_size] * (physical_size / 400)
```

## Summary for Blender Integration

1. **Canvas Origin**: Top-left (0,0), Y increases downward
2. **Blender Origin**: Bottom-left, Y increases upward → **Flip Y-axis**
3. **Scale Factor**: `physical_dimension / 400`
4. **Label Pivot**: Center of bounding box (position + size/2)
5. **Ornament Labels**: Convert polar → cartesian, then flip Y
6. **Rotation**: Degrees, clockwise, around pivot point
