/**
 * Client-side activity cache utility for Strava activities
 * Implements localStorage-based persistent caching with compression and expiry
 */

interface CachedActivityData {
  activities: any[] | string; // Can be either compressed string or decompressed array
  totalFetched: number;
  hasMore: boolean;
  lastFetched: number;
  cacheVersion: string;
  userToken: string; // Hash of access token to ensure user-specific cache
}

interface CacheMetadata {
  version: string;
  created: number;
  lastAccess: number;
  size: number;
}

const CACHE_VERSION = "1.0";
const CACHE_TTL_HOURS = 6;
const CACHE_KEY_PREFIX = "strava_activities_";
const METADATA_KEY = "strava_cache_metadata";
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit for localStorage

/**
 * Simple compression using JSON.stringify with replacer
 * Removes redundant data and compresses common patterns
 */
function compressActivities(activities: any[]): string {
  // Remove less important fields to reduce size
  const compressed = activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    distance: activity.distance,
    moving_time: activity.moving_time,
    sport_type: activity.sport_type,
    start_date_local: activity.start_date_local,
    total_elevation_gain: activity.total_elevation_gain,
    map: activity.map
      ? {
          id: activity.map.id,
          summary_polyline: activity.map.summary_polyline,
        }
      : null,
    photos: activity.photos
      ? {
          count: activity.photos.count,
          primary: activity.photos.primary,
        }
      : null,
  }));

  return JSON.stringify(compressed);
}

/**
 * Decompress activities data
 */
function decompressActivities(compressed: string): any[] {
  try {
    return JSON.parse(compressed);
  } catch (error) {
    console.warn("Failed to decompress activities:", error);
    return [];
  }
}

/**
 * Generate a cache key based on user token hash
 */
function getCacheKey(accessToken: string): string {
  // Create a simple hash of the access token for user-specific caching
  const hash = accessToken.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${CACHE_KEY_PREFIX}${Math.abs(hash)}`;
}

/**
 * Check if cache is valid (not expired)
 */
function isCacheValid(cacheData: CachedActivityData): boolean {
  const now = Date.now();
  const cacheAge = now - cacheData.lastFetched;
  const maxAge = CACHE_TTL_HOURS * 60 * 60 * 1000;

  return cacheData.cacheVersion === CACHE_VERSION && cacheAge < maxAge;
}

/**
 * Get cache metadata for management
 */
function getCacheMetadata(): CacheMetadata[] {
  try {
    const metadata = localStorage.getItem(METADATA_KEY);
    return metadata ? JSON.parse(metadata) : [];
  } catch (error) {
    console.warn("Failed to read cache metadata:", error);
    return [];
  }
}

/**
 * Update cache metadata
 */
function updateCacheMetadata(cacheKey: string, size: number): void {
  try {
    const metadata = getCacheMetadata();
    const existingIndex = metadata.findIndex((m) => m.version === cacheKey);
    const now = Date.now();

    const newEntry: CacheMetadata = {
      version: cacheKey,
      created: existingIndex >= 0 ? metadata[existingIndex].created : now,
      lastAccess: now,
      size,
    };

    if (existingIndex >= 0) {
      metadata[existingIndex] = newEntry;
    } else {
      metadata.push(newEntry);
    }

    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn("Failed to update cache metadata:", error);
  }
}

/**
 * Clean up old cache entries if approaching storage limits
 */
function cleanupCache(): void {
  try {
    const metadata = getCacheMetadata();
    const totalSize = metadata.reduce((sum, m) => sum + m.size, 0);

    if (totalSize > MAX_CACHE_SIZE * 0.8) {
      // Clean up at 80% capacity
      // Sort by last access time (oldest first)
      metadata.sort((a, b) => a.lastAccess - b.lastAccess);

      // Remove oldest entries until we're under 60% capacity
      while (metadata.length > 0 && totalSize > MAX_CACHE_SIZE * 0.6) {
        const oldest = metadata.shift()!;
        localStorage.removeItem(oldest.version);
      }

      // Update metadata
      localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    }
  } catch (error) {
    console.warn("Failed to cleanup cache:", error);
  }
}

/**
 * Check if localStorage is available and has space
 */
function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, "test");
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get cached activities for a user
 */
export function getCachedActivities(
  accessToken: string,
): CachedActivityData | null {
  if (!isStorageAvailable()) {
    console.warn("localStorage not available, skipping cache");
    return null;
  }

  try {
    const cacheKey = getCacheKey(accessToken);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsed = JSON.parse(cachedData);

    // Decompress activities
    if (typeof parsed.activities === "string") {
      parsed.activities = decompressActivities(parsed.activities);
    }

    // Check if cache is still valid
    if (!isCacheValid(parsed)) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Update access time in metadata
    updateCacheMetadata(cacheKey, cachedData.length);

    return parsed;
  } catch (error) {
    console.warn("Failed to read from activity cache:", error);
    return null;
  }
}

/**
 * Cache activities for a user
 */
export function setCachedActivities(
  accessToken: string,
  activities: any[],
  totalFetched: number,
  hasMore: boolean,
): boolean {
  if (!isStorageAvailable()) {
    console.warn("localStorage not available, skipping cache");
    return false;
  }

  try {
    // Clean up old cache entries if needed
    cleanupCache();

    const cacheKey = getCacheKey(accessToken);
    const now = Date.now();

    // Create hash of access token for user identification
    const userTokenHash = getCacheKey(accessToken).split("_")[2];

    const cacheData: CachedActivityData = {
      activities: compressActivities(activities),
      totalFetched,
      hasMore,
      lastFetched: now,
      cacheVersion: CACHE_VERSION,
      userToken: userTokenHash,
    };

    const serialized = JSON.stringify(cacheData);

    // Check if the data fits in localStorage
    if (serialized.length > MAX_CACHE_SIZE) {
      console.warn("Cache data too large, skipping cache");
      return false;
    }

    localStorage.setItem(cacheKey, serialized);
    updateCacheMetadata(cacheKey, serialized.length);

    console.log(
      `Cached ${activities.length} activities (${Math.round(serialized.length / 1024)}KB)`,
    );
    return true;
  } catch (error) {
    console.warn("Failed to write to activity cache:", error);

    // If storage is full, try to clean up and retry once
    try {
      cleanupCache();
      const retryKey = getCacheKey(accessToken);
      const retryData = JSON.stringify({
        activities: compressActivities(activities),
        totalFetched,
        hasMore,
        lastFetched: Date.now(),
        cacheVersion: CACHE_VERSION,
        userToken: retryKey.split("_")[2],
      });

      localStorage.setItem(retryKey, retryData);
      return true;
    } catch (retryError) {
      console.warn("Failed to cache activities after cleanup:", retryError);
      return false;
    }
  }
}

/**
 * Clear cache for a specific user
 */
export function clearUserCache(accessToken: string): void {
  if (!isStorageAvailable()) return;

  try {
    const cacheKey = getCacheKey(accessToken);
    localStorage.removeItem(cacheKey);

    // Update metadata
    const metadata = getCacheMetadata();
    const filteredMetadata = metadata.filter((m) => m.version !== cacheKey);
    localStorage.setItem(METADATA_KEY, JSON.stringify(filteredMetadata));

    console.log("Cleared user activity cache");
  } catch (error) {
    console.warn("Failed to clear user cache:", error);
  }
}

/**
 * Clear all activity caches
 */
export function clearAllCaches(): void {
  if (!isStorageAvailable()) return;

  try {
    const metadata = getCacheMetadata();
    metadata.forEach((m) => {
      localStorage.removeItem(m.version);
    });

    localStorage.removeItem(METADATA_KEY);
    console.log("Cleared all activity caches");
  } catch (error) {
    console.warn("Failed to clear all caches:", error);
  }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  totalEntries: number;
  totalSize: number;
  entries: { key: string; size: number; age: number }[];
} {
  if (!isStorageAvailable()) {
    return { totalEntries: 0, totalSize: 0, entries: [] };
  }

  try {
    const metadata = getCacheMetadata();
    const now = Date.now();

    return {
      totalEntries: metadata.length,
      totalSize: metadata.reduce((sum, m) => sum + m.size, 0),
      entries: metadata.map((m) => ({
        key: m.version,
        size: m.size,
        age: Math.round((now - m.created) / (1000 * 60 * 60)), // hours
      })),
    };
  } catch (error) {
    console.warn("Failed to get cache stats:", error);
    return { totalEntries: 0, totalSize: 0, entries: [] };
  }
}
