import { NextRequest, NextResponse } from "next/server";
import {
  createCanvas,
  loadImage,
  Canvas,
  CanvasRenderingContext2D,
} from "canvas";

interface TerrainCaptureRequest {
  boundingBox: string; // "minLng,minLat,maxLng,maxLat"
  width?: number; // Canvas dimensions (default: 400)
  height?: number;
  zoom?: number; // Map zoom level (default: auto-calculated)
}

interface TileCoordinate {
  x: number;
  y: number;
  z: number;
}

// Convert latitude/longitude to tile coordinates
function latLngToTile(
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
  return { x, y };
}

// Convert tile coordinates to latitude/longitude
function tileToLatLng(
  x: number,
  y: number,
  zoom: number,
): { lat: number; lng: number } {
  const lng = (x / Math.pow(2, zoom)) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

// Calculate optimal zoom level for given bounds and canvas size
function calculateOptimalZoom(bounds: number[], canvasWidth: number): number {
  const [minLng, minLat, maxLng, maxLat] = bounds;

  // Calculate the span in degrees
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;

  // Calculate zoom based on longitude span (generally more reliable)
  const lngZoom = Math.floor(Math.log2(360 / lngSpan));

  // Ensure we don't exceed reasonable zoom levels for terrain tiles
  return Math.min(Math.max(lngZoom, 8), 15);
}

// Fetch a single terrain tile
async function fetchTerrainTile(
  x: number,
  y: number,
  z: number,
): Promise<Buffer | null> {
  try {
    // Use USGS Shaded Relief for high-resolution, roads-free hillshade
    const tileUrl = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/${z}/${y}/${x}`;

    console.log(`Fetching tile: ${tileUrl}`);

    const response = await fetch(tileUrl, {
      headers: {
        "User-Agent": "Landform Labs (landformlabs.co)",
        Accept: "image/png,image/*,*/*",
      },
    });

    console.log(
      `Tile ${z}/${x}/${y} response: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch tile ${z}/${x}/${y}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error fetching tile ${z}/${x}/${y}:`, error);
    return null;
  }
}

// Compose terrain tiles into a single image
async function composeTerrainImage(
  tiles: Array<{ x: number; y: number; z: number; buffer: Buffer }>,
  bounds: number[],
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
): Promise<string> {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Fill with light background color
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const [minLng, minLat, maxLng, maxLat] = bounds;

  // Calculate the pixel offset for precise positioning
  const topLeft = latLngToTile(maxLat, minLng, zoom);
  const bottomRight = latLngToTile(minLat, maxLng, zoom);

  // Standard tile size (OpenTopoMap uses 256px tiles)
  const TILE_SIZE = 256;

  // Calculate the bounds in tile coordinate system
  const tileSpanX = bottomRight.x - topLeft.x + 1;
  const tileSpanY = bottomRight.y - topLeft.y + 1;

  // Calculate scaling factor to fit tiles into canvas
  const scaleX = canvasWidth / (tileSpanX * TILE_SIZE);
  const scaleY = canvasHeight / (tileSpanY * TILE_SIZE);
  const scale = Math.min(scaleX, scaleY);

  // Load and draw each tile
  for (const tile of tiles) {
    try {
      const image = await loadImage(tile.buffer);

      // Calculate position relative to the top-left tile
      const relativeX = tile.x - Math.floor(topLeft.x);
      const relativeY = tile.y - Math.floor(topLeft.y);

      // Calculate canvas position
      const canvasX = relativeX * TILE_SIZE * scale;
      const canvasY = relativeY * TILE_SIZE * scale;

      // Draw the tile
      ctx.drawImage(
        image,
        canvasX,
        canvasY,
        TILE_SIZE * scale,
        TILE_SIZE * scale,
      );
    } catch (error) {
      console.warn(
        `Failed to load tile image for ${tile.x}/${tile.y}/${tile.z}:`,
        error,
      );
    }
  }

  // Apply grayscale filter for minimal aesthetic
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale using luminance formula
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // Apply extreme contrast adjustments for dramatic terrain definition
    const brightened = Math.min(255, gray * 0.6); // brightness(0.6) - darken significantly
    const contrasted = (brightened - 128) * 5.0 + 128; // contrast(5.0) - extreme contrast
    const final = Math.max(0, Math.min(255, contrasted));

    data[i] = final; // Red
    data[i + 1] = final; // Green
    data[i + 2] = final; // Blue
    // Alpha stays the same
  }

  ctx.putImageData(imageData, 0, 0);

  // Return as base64 encoded PNG
  return canvas.toDataURL("image/png");
}

export async function POST(request: NextRequest) {
  try {
    const body: TerrainCaptureRequest = await request.json();
    const { boundingBox, width = 400, height = 400, zoom } = body;

    if (!boundingBox) {
      return NextResponse.json(
        { error: "Missing required parameter: boundingBox" },
        { status: 400 },
      );
    }

    // Parse bounding box coordinates
    const bounds = boundingBox.split(",").map(Number);
    if (bounds.length !== 4 || bounds.some(isNaN)) {
      return NextResponse.json(
        {
          error:
            'Invalid bounding box format. Expected: "minLng,minLat,maxLng,maxLat"',
        },
        { status: 400 },
      );
    }

    const [minLng, minLat, maxLng, maxLat] = bounds;

    // Calculate optimal zoom level if not provided
    const tileZoom = zoom || calculateOptimalZoom(bounds, width);

    // Get tile coordinates for the bounds
    const topLeft = latLngToTile(maxLat, minLng, tileZoom);
    const bottomRight = latLngToTile(minLat, maxLng, tileZoom);

    // Calculate tile grid dimensions
    const tileMinX = topLeft.x;
    const tileMaxX = bottomRight.x;
    const tileMinY = topLeft.y;
    const tileMaxY = bottomRight.y;

    // Collect all tile coordinates we need to fetch
    const tileCoords: TileCoordinate[] = [];
    for (let x = tileMinX; x <= tileMaxX; x++) {
      for (let y = tileMinY; y <= tileMaxY; y++) {
        tileCoords.push({ x, y, z: tileZoom });
      }
    }

    // Safeguard: Limit the number of tiles to prevent server overload
    const MAX_TILES = 64; // Reasonable limit for route-level detail
    if (tileCoords.length > MAX_TILES) {
      return NextResponse.json(
        {
          error: `Too many tiles requested (${tileCoords.length}). Maximum allowed: ${MAX_TILES}. Try reducing the bounding box size or zoom level.`,
        },
        { status: 400 },
      );
    }

    // Fetch all required tiles
    console.log(`Fetching ${tileCoords.length} tiles for bounds:`, bounds);
    const tilePromises = tileCoords.map((coord) =>
      fetchTerrainTile(coord.x, coord.y, coord.z).then((buffer) => ({
        ...coord,
        buffer,
      })),
    );

    const tiles = await Promise.all(tilePromises);
    const validTiles = tiles.filter(
      (tile): tile is { x: number; y: number; z: number; buffer: Buffer } =>
        tile.buffer !== null,
    );

    if (validTiles.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch any terrain tiles" },
        { status: 500 },
      );
    }

    // For now, return metadata about the operation
    // In the next step, we'll add Canvas API for image composition
    const response = {
      success: true,
      bounds: {
        minLng,
        minLat,
        maxLng,
        maxLat,
      },
      tileInfo: {
        zoom: tileZoom,
        tilesCount: validTiles.length,
        tileGrid: {
          minX: tileMinX,
          maxX: tileMaxX,
          minY: tileMinY,
          maxY: tileMaxY,
        },
      },
      // Compose the terrain tiles into a single image
      terrainImage: await composeTerrainImage(
        validTiles,
        bounds,
        width,
        height,
        tileZoom,
      ),
      dimensions: {
        width,
        height,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Terrain capture error:", error);
    return NextResponse.json(
      { error: "Internal server error during terrain capture" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Terrain Capture API",
    usage:
      'POST with { boundingBox: "minLng,minLat,maxLng,maxLat", width?, height?, zoom? }',
    example: {
      boundingBox: "-111.5,40.5,-111.4,40.6",
      width: 400,
      height: 400,
    },
  });
}
