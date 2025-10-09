# Label Positioning Fix

## Problem

Labels were displaying correctly in the app preview but appearing in incorrect positions in both:
1. The exported PNG image
2. The JSON coordinate data

### Root Cause

The canvas container uses responsive sizing:
```javascript
width: "min(400px, calc(100vw - 2rem))"
```

This means on mobile or narrow screens, the container can be **smaller than 400px**. For example, on a 375px wide phone, the container might be only ~343px wide.

The draggable label components (Rnd) position themselves relative to this **display size**, not the canonical 400x400 canvas coordinate space. So a label at the right edge might have:
- Display coordinates: `x: 293` (out of 343px container)
- But should be: `x: 342` (in 400px canvas space)

The old export code was reading `label.x` directly without accounting for this difference, causing labels to bunch up when the display was smaller than 400px.

## Solution

### 1. Track Container Display Size
Added a ref to measure the actual displayed container size:
```typescript
const canvasContainerRef = useRef<HTMLDivElement>(null);
```

### 2. Calculate Scaling Factor
On export, calculate the scale factor to convert from display space to canvas space:
```typescript
const containerRect = container.getBoundingClientRect();
const displaySize = containerRect.width;  // e.g., 343px
const canvasSize = 400;                   // Canonical canvas space
const coordScale = canvasSize / displaySize; // e.g., 1.166
```

### 3. Scale Coordinates on Export
Apply scaling to all label coordinates before export:

#### PNG Export (drawing to canvas)
```typescript
const scaledX = label.x * coordScale;
const scaledY = label.y * coordScale;
const scaledWidth = label.width * coordScale;
const scaledHeight = label.height * coordScale;

exportCtx.translate(
  scaledX * scale + (scaledWidth * scale) / 2,
  scaledY * scale + (scaledHeight * scale) / 2,
);
```

#### JSON Export (data structure)
```typescript
labels: designConfig.labels.map((label) => ({
  position: {
    x: Math.round(label.x * coordScale),
    y: Math.round(label.y * coordScale)
  },
  size: {
    width: Math.round(label.width * coordScale),
    height: Math.round(label.height * coordScale)
  },
  // ... other properties
}))
```

## Example

### Before Fix (on 343px display)
```json
{
  "position": { "x": 253, "y": 0 },
  "size": { "width": 147, "height": 30 }
}
```
❌ This label appears at position 253 in a 400px space, causing it to be too centered

### After Fix (scaled to 400px space)
```json
{
  "position": { "x": 295, "y": 0 },
  "size": { "width": 172, "height": 35 }
}
```
✅ Label correctly positioned at right edge (253 × 1.166 ≈ 295)

## Benefits

1. **Consistent positioning** across all screen sizes
2. **Accurate JSON coordinates** for Blender integration
3. **Matching preview and export** - what you see is what you get
4. **Device-independent** - works on desktop, tablet, and mobile

## Technical Details

### Coordinate Spaces

1. **Display Space**: The actual rendered size of the container on screen
   - Variable: 200px to 400px depending on screen width
   - Used by: Rnd draggable components

2. **Canvas Space**: The canonical 400×400 coordinate system
   - Fixed: Always 400×400
   - Used by: Canvas rendering, JSON export, Blender addon

3. **Export Space**: The high-resolution export image
   - Fixed: 1200×1200 (3x scale of canvas space)
   - Used by: PNG export only

### Scaling Chain
```
Display Space → Canvas Space → Export Space
   (variable)      (400×400)     (1200×1200)
      ↓               ↓               ↓
   label.x    × coordScale    × 3    = PNG pixel
   (253px)    × 1.166         × 3    = 885px
```

## Testing

To verify the fix:
1. Design a print with labels at corners on different screen sizes
2. Export the design
3. Check that:
   - PNG shows labels in correct positions
   - JSON coordinates match visual placement
   - Coordinates are in 0-400 range

## Related Files

- `src/components/DesignConfigurator.tsx`: Main implementation
- `COORDINATE_SYSTEM.md`: Updated documentation
- `schema/print-export-schema.json`: Coordinate value schema
