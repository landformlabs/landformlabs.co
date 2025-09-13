import { NextRequest, NextResponse } from "next/server";

interface TerrainCaptureRequest {
  boundingBox: string; // "minLng,minLat,maxLng,maxLat"
  width?: number;
  height?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TerrainCaptureRequest = await request.json();
    const { boundingBox, width = 400, height = 400 } = body;

    if (!boundingBox) {
      return NextResponse.json(
        { error: "Missing required parameter: boundingBox" },
        { status: 400 },
      );
    }

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

    // Construct the URL for the ArcGIS MapServer export endpoint
    const imageUrl = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/export?bbox=${minLng},${minLat},${maxLng},${maxLat}&bboxSR=4326&imageSR=4326&size=${width},${height}&format=png&transparent=false&f=image`;

    console.log(`Fetching terrain image from: ${imageUrl}`);

    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Landform Labs (landformlabs.co)",
      },
    });

    if (!imageResponse.ok) {
      console.error(
        `Failed to fetch terrain image: ${imageResponse.status} ${imageResponse.statusText}`,
      );
      const errorBody = await imageResponse.text();
      console.error("Error body:", errorBody);
      return NextResponse.json(
        {
          error: "Failed to fetch terrain image from external service.",
          details: errorBody,
        },
        { status: imageResponse.status },
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = `data:image/png;base64,${Buffer.from(
      imageBuffer,
    ).toString("base64")}`;

    const response = {
      success: true,
      bounds: {
        minLng,
        minLat,
        maxLng,
        maxLat,
      },
      terrainImage: imageBase64,
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
      'POST with { boundingBox: "minLng,minLat,maxLng,maxLat", width?, height? }',
    example: {
      boundingBox: "-111.5,40.5,-111.4,40.6",
      width: 400,
      height: 400,
    },
  });
}
