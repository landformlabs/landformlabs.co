/**
 * Activity stream cache utility for caching GPS data
 * Uses sessionStorage for tab-specific caching and LRU eviction
 */

interface CachedStream {
  activityId: number;
  activityName: string;
  gpxData: any;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

interface StreamCacheMetadata {
  version: string;
  maxSize: number;
  currentSize: number;
  entries: number;
}

const CACHE_VERSION = "1.0";
const MAX_CACHE_ENTRIES = 50; // Maximum number of cached streams
const CACHE_TTL_HOURS = 24; // Streams valid for 24 hours
const STORAGE_KEY_PREFIX = "strava_stream_";
const METADATA_KEY = "stream_cache_metadata";

/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    const test = '__session_test__';
    sessionStorage.setItem(test, 'test');
    sessionStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get cache metadata
 */
function getCacheMetadata(): StreamCacheMetadata {
  if (!isSessionStorageAvailable()) {
    return { version: CACHE_VERSION, maxSize: MAX_CACHE_ENTRIES, currentSize: 0, entries: 0 };
  }

  try {
    const metadata = sessionStorage.getItem(METADATA_KEY);
    if (metadata) {
      return JSON.parse(metadata);
    }
  } catch (error) {
    console.warn('Failed to read stream cache metadata:', error);
  }

  return { version: CACHE_VERSION, maxSize: MAX_CACHE_ENTRIES, currentSize: 0, entries: 0 };
}

/**
 * Update cache metadata
 */
function updateCacheMetadata(metadata: StreamCacheMetadata): void {
  if (!isSessionStorageAvailable()) return;

  try {
    sessionStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('Failed to update stream cache metadata:', error);
  }
}

/**
 * Get cache key for an activity stream
 */
function getStreamCacheKey(activityId: number): string {
  return `${STORAGE_KEY_PREFIX}${activityId}`;
}

/**
 * Get all cached stream keys
 */
function getAllStreamKeys(): string[] {
  if (!isSessionStorageAvailable()) return [];

  const keys: string[] = [];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.warn('Failed to get stream cache keys:', error);
  }
  return keys;
}

/**
 * Check if cached stream is valid (not expired)
 */
function isStreamValid(cachedStream: CachedStream): boolean {
  const now = Date.now();
  const age = now - cachedStream.timestamp;
  const maxAge = CACHE_TTL_HOURS * 60 * 60 * 1000;
  return age < maxAge;
}

/**
 * Perform LRU eviction to make room for new entries
 */
function evictLRU(targetCount: number = MAX_CACHE_ENTRIES - 1): void {
  if (!isSessionStorageAvailable()) return;

  try {
    const allKeys = getAllStreamKeys();
    if (allKeys.length <= targetCount) return;

    // Get all cached streams with access info
    const streams: Array<{ key: string; stream: CachedStream }> = [];

    for (const key of allKeys) {
      try {
        const data = sessionStorage.getItem(key);
        if (data) {
          const stream = JSON.parse(data);
          streams.push({ key, stream });
        }
      } catch (error) {
        // Remove corrupted entries
        sessionStorage.removeItem(key);
      }
    }

    // Sort by last access time (oldest first)
    streams.sort((a, b) => a.stream.lastAccess - b.stream.lastAccess);

    // Remove oldest entries
    const toRemove = streams.slice(0, streams.length - targetCount);
    for (const { key } of toRemove) {
      sessionStorage.removeItem(key);
    }

    console.log(`Evicted ${toRemove.length} old stream entries from cache`);
  } catch (error) {
    console.warn('Failed to perform LRU eviction:', error);
  }
}

/**
 * Get cached stream for an activity
 */
export function getCachedStream(activityId: number): any | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  try {
    const cacheKey = getStreamCacheKey(activityId);
    const cachedData = sessionStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsed: CachedStream = JSON.parse(cachedData);

    // Check if stream is still valid
    if (!isStreamValid(parsed)) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    // Update access statistics
    parsed.accessCount = (parsed.accessCount || 0) + 1;
    parsed.lastAccess = Date.now();

    // Save updated access info
    sessionStorage.setItem(cacheKey, JSON.stringify(parsed));

    console.log(`Retrieved stream for activity ${activityId} from cache (accessed ${parsed.accessCount} times)`);
    return parsed.gpxData;
  } catch (error) {
    console.warn('Failed to read from stream cache:', error);
    return null;
  }
}

/**
 * Cache stream data for an activity
 */
export function setCachedStream(activityId: number, activityName: string, gpxData: any): boolean {
  if (!isSessionStorageAvailable()) {
    console.warn('sessionStorage not available, skipping stream cache');
    return false;
  }

  try {
    // Check if we need to evict old entries
    const allKeys = getAllStreamKeys();
    if (allKeys.length >= MAX_CACHE_ENTRIES) {
      evictLRU();
    }

    const cacheKey = getStreamCacheKey(activityId);
    const now = Date.now();

    const cachedStream: CachedStream = {
      activityId,
      activityName,
      gpxData,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    };

    const serialized = JSON.stringify(cachedStream);
    sessionStorage.setItem(cacheKey, serialized);

    // Update metadata
    const metadata = getCacheMetadata();
    metadata.entries = getAllStreamKeys().length;
    metadata.currentSize = metadata.entries;
    updateCacheMetadata(metadata);

    console.log(`Cached stream for activity "${activityName}" (${Math.round(serialized.length / 1024)}KB)`);
    return true;
  } catch (error) {
    console.warn('Failed to cache stream:', error);

    // If storage is full, try to make room and retry once
    try {
      evictLRU(MAX_CACHE_ENTRIES - 10); // More aggressive cleanup
      const retryKey = getStreamCacheKey(activityId);
      const retryData = JSON.stringify({
        activityId,
        activityName,
        gpxData,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccess: Date.now()
      });

      sessionStorage.setItem(retryKey, retryData);
      console.log(`Cached stream for activity "${activityName}" after cleanup`);
      return true;
    } catch (retryError) {
      console.warn('Failed to cache stream after cleanup:', retryError);
      return false;
    }
  }
}

/**
 * Remove cached stream for a specific activity
 */
export function removeCachedStream(activityId: number): void {
  if (!isSessionStorageAvailable()) return;

  try {
    const cacheKey = getStreamCacheKey(activityId);
    sessionStorage.removeItem(cacheKey);

    // Update metadata
    const metadata = getCacheMetadata();
    metadata.entries = getAllStreamKeys().length;
    metadata.currentSize = metadata.entries;
    updateCacheMetadata(metadata);

    console.log(`Removed cached stream for activity ${activityId}`);
  } catch (error) {
    console.warn('Failed to remove cached stream:', error);
  }
}

/**
 * Clear all cached streams
 */
export function clearAllStreams(): void {
  if (!isSessionStorageAvailable()) return;

  try {
    const allKeys = getAllStreamKeys();
    for (const key of allKeys) {
      sessionStorage.removeItem(key);
    }

    sessionStorage.removeItem(METADATA_KEY);
    console.log(`Cleared ${allKeys.length} cached streams`);
  } catch (error) {
    console.warn('Failed to clear all cached streams:', error);
  }
}

/**
 * Get cache statistics for debugging
 */
export function getStreamCacheStats(): {
  totalEntries: number;
  maxEntries: number;
  totalSize: number;
  entries: Array<{
    activityId: number;
    activityName: string;
    size: number;
    age: number;
    accessCount: number;
  }>;
} {
  if (!isSessionStorageAvailable()) {
    return { totalEntries: 0, maxEntries: MAX_CACHE_ENTRIES, totalSize: 0, entries: [] };
  }

  try {
    const allKeys = getAllStreamKeys();
    const now = Date.now();
    const entries = [];
    let totalSize = 0;

    for (const key of allKeys) {
      try {
        const data = sessionStorage.getItem(key);
        if (data) {
          const stream: CachedStream = JSON.parse(data);
          const size = data.length;
          const age = Math.round((now - stream.timestamp) / (1000 * 60 * 60)); // hours

          entries.push({
            activityId: stream.activityId,
            activityName: stream.activityName,
            size,
            age,
            accessCount: stream.accessCount || 1
          });

          totalSize += size;
        }
      } catch (error) {
        console.warn(`Failed to process cached stream key: ${key}`, error);
      }
    }

    // Sort by access count (most accessed first)
    entries.sort((a, b) => b.accessCount - a.accessCount);

    return {
      totalEntries: entries.length,
      maxEntries: MAX_CACHE_ENTRIES,
      totalSize,
      entries
    };
  } catch (error) {
    console.warn('Failed to get stream cache stats:', error);
    return { totalEntries: 0, maxEntries: MAX_CACHE_ENTRIES, totalSize: 0, entries: [] };
  }
}

/**
 * Preload streams for a list of activities (for visible activities)
 */
export function preloadActivityStreams(activities: Array<{ id: number; name: string }>, accessToken: string): void {
  if (!isSessionStorageAvailable()) return;

  // Only preload a few activities to avoid hitting rate limits
  const toPreload = activities.slice(0, 5).filter(activity => !getCachedStream(activity.id));

  if (toPreload.length === 0) {
    console.log('All visible activities already cached');
    return;
  }

  console.log(`Preloading streams for ${toPreload.length} activities`);

  // Preload with a small delay between requests to be respectful
  toPreload.forEach((activity, index) => {
    setTimeout(async () => {
      try {
        const response = await fetch(
          `https://www.strava.com/api/v3/activities/${activity.id}/streams?keys=latlng&key_by_type=true&access_token=${accessToken}`
        );

        if (response.ok) {
          const stream = await response.json();

          if (stream.latlng) {
            const points = stream.latlng.data.map((point: [number, number]) => ({
              lat: point[0],
              lon: point[1],
            }));

            const gpxData = {
              fileName: `${activity.name}.gpx`,
              totalPoints: points.length,
              activityId: activity.id,
              activityName: activity.name,
              points
            };

            setCachedStream(activity.id, activity.name, gpxData);
          }
        }
      } catch (error) {
        console.warn(`Failed to preload stream for activity ${activity.id}:`, error);
      }
    }, index * 2000); // 2-second delay between preload requests
  });
}
