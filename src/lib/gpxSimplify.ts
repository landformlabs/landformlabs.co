import simplify from 'simplify-js';

interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface SimplifyResult {
  simplifiedPoints: GPXPoint[];
  originalCount: number;
  simplifiedCount: number;
  reductionPercentage: number;
  toleranceUsed: number;
}

/**
 * Calculate an appropriate tolerance value based on track characteristics
 */
export function calculateOptimalTolerance(points: GPXPoint[], targetReduction: number = 0.7): number {
  if (points.length < 10) return 0; // Don't simplify very short tracks
  
  // Calculate track bounds to determine appropriate scale
  const lats = points.map(p => p.lat);
  const lons = points.map(p => p.lon);
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lonRange = Math.max(...lons) - Math.min(...lons);
  const boundsSize = Math.max(latRange, lonRange);
  
  // Start with a tolerance based on the track size
  // For typical GPS tracks, this gives good results
  let tolerance = boundsSize * 0.0001; // Start with 0.01% of bounds
  
  // Adjust based on point density
  const pointDensity = points.length / boundsSize;
  if (pointDensity > 1000) {
    tolerance *= 2; // Increase tolerance for very dense tracks
  } else if (pointDensity < 100) {
    tolerance *= 0.5; // Decrease tolerance for sparse tracks
  }
  
  return tolerance;
}

/**
 * Simplify a GPX track using the Douglas-Peucker algorithm
 */
export function simplifyGPXTrack(
  points: GPXPoint[], 
  tolerance?: number, 
  highQuality: boolean = false
): SimplifyResult {
  if (points.length < 3) {
    return {
      simplifiedPoints: points,
      originalCount: points.length,
      simplifiedCount: points.length,
      reductionPercentage: 0,
      toleranceUsed: 0
    };
  }

  // Use provided tolerance or calculate optimal one
  const actualTolerance = tolerance ?? calculateOptimalTolerance(points);
  
  // Convert GPX points to simplify-js format
  const simplifyPoints = points.map(point => ({
    x: point.lon,
    y: point.lat
  }));
  
  // Apply simplification
  const simplified = simplify(simplifyPoints, actualTolerance, highQuality);
  
  // Convert back to GPX format
  const simplifiedGPXPoints: GPXPoint[] = simplified.map(point => ({
    lat: point.y,
    lon: point.x
  }));
  
  const reductionPercentage = ((points.length - simplified.length) / points.length) * 100;
  
  return {
    simplifiedPoints: simplifiedGPXPoints,
    originalCount: points.length,
    simplifiedCount: simplified.length,
    reductionPercentage,
    toleranceUsed: actualTolerance
  };
}

/**
 * Auto-simplify with intelligent tolerance adjustment
 * Attempts to achieve target reduction while maintaining quality
 */
export function autoSimplifyGPXTrack(
  points: GPXPoint[], 
  targetReduction: number = 0.7,
  maxIterations: number = 5
): SimplifyResult {
  if (points.length < 10) {
    return {
      simplifiedPoints: points,
      originalCount: points.length,
      simplifiedCount: points.length,
      reductionPercentage: 0,
      toleranceUsed: 0
    };
  }

  let tolerance = calculateOptimalTolerance(points, targetReduction);
  let result = simplifyGPXTrack(points, tolerance);
  let iterations = 0;
  
  // Adjust tolerance to hit target reduction
  while (iterations < maxIterations && Math.abs(result.reductionPercentage - targetReduction * 100) > 10) {
    if (result.reductionPercentage < targetReduction * 100) {
      // Need more reduction, increase tolerance
      tolerance *= 1.5;
    } else {
      // Too much reduction, decrease tolerance
      tolerance *= 0.7;
    }
    
    result = simplifyGPXTrack(points, tolerance);
    iterations++;
  }
  
  return result;
}

/**
 * Generate a simplified GPX string from simplified points
 */
export function generateSimplifiedGPXString(
  simplifiedPoints: GPXPoint[],
  originalMetadata: {
    activityName?: string;
    date?: Date;
  }
): string {
  const timestamp = originalMetadata.date?.toISOString() || new Date().toISOString();
  const name = originalMetadata.activityName || 'Simplified Track';
  
  const trackPoints = simplifiedPoints.map(point => 
    `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}"></trkpt>`
  ).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Landform Labs" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <time>${timestamp}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}