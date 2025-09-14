export type UnitSystem = 'metric' | 'imperial';

export interface ConvertedDistance {
  value: number;
  unit: string;
  formatted: string;
}

export interface ConvertedSpeed {
  value: number;
  unit: string;
  formatted: string;
}

/**
 * Convert distance from meters to the specified unit system
 */
export function convertDistance(meters: number, system: UnitSystem): ConvertedDistance {
  if (system === 'imperial') {
    const miles = meters * 0.000621371;
    return {
      value: miles,
      unit: 'mi',
      formatted: `${miles.toFixed(2)} mi`
    };
  } else {
    const kilometers = meters / 1000;
    return {
      value: kilometers,
      unit: 'km',
      formatted: `${kilometers.toFixed(2)} km`
    };
  }
}

/**
 * Convert speed from m/s to the specified unit system
 */
export function convertSpeed(metersPerSecond: number, system: UnitSystem): ConvertedSpeed {
  if (system === 'imperial') {
    const mph = metersPerSecond * 2.237;
    return {
      value: mph,
      unit: 'mph',
      formatted: `${mph.toFixed(1)} mph`
    };
  } else {
    const kph = metersPerSecond * 3.6;
    return {
      value: kph,
      unit: 'km/h',
      formatted: `${kph.toFixed(1)} km/h`
    };
  }
}

/**
 * Convert elevation from meters to the specified unit system
 */
export function convertElevation(meters: number, system: UnitSystem): ConvertedDistance {
  if (system === 'imperial') {
    const feet = meters * 3.28084;
    return {
      value: feet,
      unit: 'ft',
      formatted: `${Math.round(feet)} ft`
    };
  } else {
    return {
      value: meters,
      unit: 'm',
      formatted: `${Math.round(meters)} m`
    };
  }
}

/**
 * Format time duration from seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return 'N/A';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(remainingSeconds).toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${Math.floor(remainingSeconds).toString().padStart(2, '0')}`;
  }
}

/**
 * Check if a value is available (not null, undefined, 0, or empty string)
 */
export function isValueAvailable(value: any): boolean {
  return value !== null && value !== undefined && value !== 0 && value !== '';
}
