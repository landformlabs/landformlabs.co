import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { boundingBox } = await request.json();

    if (!boundingBox) {
      return NextResponse.json(
        { error: "Bounding box coordinates are required" },
        { status: 400 },
      );
    }

    // Parse bounding box: "minLng,minLat,maxLng,maxLat"
    const coords = boundingBox.split(",").map(Number);
    if (coords.length !== 4) {
      return NextResponse.json(
        { error: "Invalid bounding box format" },
        { status: 400 },
      );
    }

    const [minLng, minLat, maxLng, maxLat] = coords;

    // Validate coordinates
    if (minLat >= maxLat || minLng >= maxLng) {
      return NextResponse.json(
        { error: "Invalid bounding box coordinates" },
        { status: 400 },
      );
    }

    // Validate bounding box size (OpenTopography has limits)
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    if (latDiff > 0.5 || lngDiff > 0.5) {
      return NextResponse.json(
        { error: "Bounding box too large. Maximum size is 0.5 degrees." },
        { status: 400 },
      );
    }

    const OPENTOPO_API_KEY = process.env.OPENTOPOGRAPHY_API_KEY;

    if (!OPENTOPO_API_KEY) {
      return NextResponse.json(
        { error: "OpenTopography API key not configured" },
        { status: 500 },
      );
    }

    // Call OpenTopography API for elevation data
    // Using SRTM30 (30m resolution) for better coverage
    const openTopoUrl = `https://portal.opentopography.org/API/globaldem?demtype=SRTM30&south=${minLat}&north=${maxLat}&west=${minLng}&east=${maxLng}&outputFormat=AAIGrid&API_Key=${OPENTOPO_API_KEY}`;

    console.log("Fetching elevation data from OpenTopography...");
    const response = await fetch(openTopoUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenTopography API error:", response.status, errorText);
      return NextResponse.json(
        { error: `OpenTopography API error: ${response.status}` },
        { status: 500 },
      );
    }

    // Get the elevation data (AAIGrid format - ASCII text)
    const elevationText = await response.text();

    // Parse AAIGrid format
    const lines = elevationText.split("\n");
    const headers: { [key: string]: number } = {};
    let dataStartIndex = 0;

    // Parse header information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        line.includes("ncols") ||
        line.includes("nrows") ||
        line.includes("xllcorner") ||
        line.includes("yllcorner") ||
        line.includes("cellsize") ||
        line.includes("NODATA_value")
      ) {
        const [key, value] = line.split(/\s+/);
        headers[key.toLowerCase()] = parseFloat(value);
        dataStartIndex = i + 1;
      } else if (line && !isNaN(parseFloat(line.split(/\s+/)[0]))) {
        break;
      }
    }

    // Parse elevation data
    const elevationData: number[][] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(/\s+/).map((val) => {
          const num = parseFloat(val);
          return isNaN(num) || num === headers.nodata_value ? 0 : num;
        });
        if (values.length > 0) {
          elevationData.push(values);
        }
      }
    }

    // Calculate elevation statistics for better visualization
    const flatElevations = elevationData.flat().filter((val) => val > 0);
    const minElevation = Math.min(...flatElevations);
    const maxElevation = Math.max(...flatElevations);
    const avgElevation =
      flatElevations.reduce((a, b) => a + b, 0) / flatElevations.length;

    return NextResponse.json({
      success: true,
      message: "Elevation data retrieved successfully",
      bounds: { minLat, maxLat, minLng, maxLng },
      headers,
      elevationData,
      stats: {
        minElevation,
        maxElevation,
        avgElevation,
        resolution: headers.cellsize,
        width: headers.ncols,
        height: headers.nrows,
      },
    });
  } catch (error) {
    console.error("Topography API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve topography data" },
      { status: 500 },
    );
  }
}
