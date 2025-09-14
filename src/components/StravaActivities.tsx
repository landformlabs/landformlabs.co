"use client";

import { useEffect, useState, useCallback } from "react";
import RouteThumbnail from "./RouteThumbnail";
import {
  parseNaturalLanguageQuery,
  getSearchSuggestions,
  interpretQuery,
  type ParsedFilter,
} from "../utils/naturalLanguageParser";
import {
  getCachedActivities,
  setCachedActivities,
  clearUserCache,
  getCacheStats,
} from "../utils/activityCache";
import {
  getCachedStream,
  setCachedStream,
  getStreamCacheStats,
  preloadActivityStreams,
} from "../utils/streamCache";

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  sport_type: string;
  start_date_local: string;
  photos?: {
    primary?: {
      unique_id: string;
      urls: {
        100: string;
        600: string;
      };
    };
    count: number;
  };
  map?: {
    id: string;
    polyline: string | null;
    summary_polyline: string;
  };
}

export default function StravaActivities({
  accessToken,
  onActivitySelect,
}: {
  accessToken: string;
  onActivitySelect: (activity: any) => void;
}) {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState<number | null>(null);
  const [error, setError] = useState<{
    type: "network" | "auth" | "api" | "general";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StravaActivity[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [parsedFilter, setParsedFilter] = useState<ParsedFilter>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalActivitiesCount, setTotalActivitiesCount] = useState<
    number | null
  >(null);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [includeVirtualRides, setIncludeVirtualRides] = useState(false);
  const [showCacheDebug, setShowCacheDebug] = useState(false);

  // Format activity date for display
  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Natural language search function
  const performNaturalLanguageSearch = useCallback(
    async (query: string) => {
      if (!accessToken) {
        setSearchResults([]);
        return;
      }

      if (!query.trim()) {
        setSearchResults([]);
        setParsedFilter({});
        return;
      }

      setSearchLoading(true);
      setError(null);

      try {
        // Parse the natural language query
        const parsed = parseNaturalLanguageQuery(query);
        setParsedFilter(parsed);

        // Build search parameters for the API
        const params = new URLSearchParams({
          query: query.trim(),
          limit: "1000",
          parsed_filter: JSON.stringify(parsed),
        });

        if (!includeVirtualRides) {
          params.append("exclude_virtual", "true");
        }

        const response = await fetch(`/api/strava/activities/search?${params}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("AUTH_ERROR");
          } else if (response.status === 429) {
            throw new Error("RATE_LIMIT");
          } else {
            throw new Error("API_ERROR");
          }
        }

        const data = await response.json();
        let filteredData = data.activities.filter(
          (activity: StravaActivity) => activity.distance > 0,
        );

        setSearchResults(filteredData);
        setTotalActivitiesCount(data.totalActivities);
        setHasMoreActivities(data.hasMore);
      } catch (error) {
        console.error("Natural language search error:", error);
        if (error instanceof Error && error.message === "AUTH_ERROR") {
          setError({
            type: "auth",
            message:
              "Your Strava session has expired. Please reconnect your account.",
          });
        } else if (error instanceof Error && error.message === "RATE_LIMIT") {
          setError({
            type: "api",
            message:
              "Search rate limit reached. Please try again in a few minutes.",
          });
        } else {
          setError({
            type: "general",
            message: "Search failed. Please try again later.",
          });
        }
        setSearchResults([]);
        setParsedFilter({});
      } finally {
        setSearchLoading(false);
      }
    },
    [accessToken, includeVirtualRides],
  );

  // Debounced natural language search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performNaturalLanguageSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, includeVirtualRides, performNaturalLanguageSearch]);

  // Load initial activities when component mounts using unified search API
  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchInitialActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, try to get cached activities
        const cachedData = getCachedActivities(accessToken);

        if (
          cachedData &&
          Array.isArray(cachedData.activities) &&
          cachedData.activities.length > 0
        ) {
          console.log(
            `Loaded ${cachedData.activities.length} activities from cache`,
          );

          // Filter cached activities based on current settings (activities are already decompressed by getCachedActivities)
          let filteredActivities = (
            cachedData.activities as StravaActivity[]
          ).filter((activity: StravaActivity) => activity.distance > 0);

          if (!includeVirtualRides) {
            filteredActivities = filteredActivities.filter(
              (activity: StravaActivity) =>
                activity.sport_type !== "VirtualRide",
            );
          }

          // Set activities from cache immediately for fast loading
          const displayActivities = filteredActivities.slice(0, 20);
          setActivities(displayActivities);
          setTotalActivitiesCount(cachedData.totalFetched);
          setHasMoreActivities(cachedData.hasMore);
          setLoading(false);

          // Preload streams for the first few visible activities
          setTimeout(() => {
            preloadActivityStreams(displayActivities.slice(0, 3), accessToken);
          }, 1000); // Wait 1 second after loading to avoid overwhelming the UI

          // Optionally refresh data in background if cache is getting old
          const cacheAge = Date.now() - cachedData.lastFetched;
          const refreshThreshold = 2 * 60 * 60 * 1000; // 2 hours

          if (cacheAge > refreshThreshold) {
            console.log("Cache is getting old, refreshing in background...");
            // Don't await this - let it refresh in background
            refreshActivitiesInBackground();
          }

          return;
        }

        // No cache available, fetch from API using unified search endpoint
        console.log("No cache found, fetching activities from API...");
        await fetchFromSearchAPI(true);
      } catch (error) {
        console.error("Error loading initial activities:", error);
        handleActivityError(error);
      }
    };

    // Function to fetch activities using the unified search API
    const fetchFromSearchAPI = async (isInitialLoad = false) => {
      try {
        const params = new URLSearchParams({
          query: "", // Empty query for all activities
          limit: "100", // Fetch more initially to populate cache
          initial: "true", // Flag to indicate this is initial load
        });

        if (!includeVirtualRides) {
          params.append("exclude_virtual", "true");
        }

        const response = await fetch(`/api/strava/activities/search?${params}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("AUTH_ERROR");
          } else if (response.status === 429) {
            throw new Error("RATE_LIMIT");
          } else {
            throw new Error("API_ERROR");
          }
        }

        const data = await response.json();
        let filteredData = data.activities.filter(
          (activity: StravaActivity) => activity.distance > 0,
        );

        // Cache the fetched activities
        if (filteredData.length > 0) {
          setCachedActivities(
            accessToken,
            filteredData,
            data.totalActivities || filteredData.length,
            data.hasMore || false,
          );
        }

        // Set state with first 20 activities for display
        const displayActivities = filteredData.slice(0, 20);
        setActivities(displayActivities);
        setTotalActivitiesCount(data.totalActivities);
        setHasMoreActivities(data.hasMore);

        // Preload streams for the first few visible activities (only for initial loads)
        if (isInitialLoad) {
          setTimeout(() => {
            preloadActivityStreams(displayActivities.slice(0, 3), accessToken);
          }, 2000); // Wait 2 seconds after initial load
        }

        if (isInitialLoad) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching from search API:", error);
        if (isInitialLoad) {
          handleActivityError(error);
          setLoading(false);
        }
      }
    };

    // Background refresh function
    const refreshActivitiesInBackground = async () => {
      try {
        await fetchFromSearchAPI(false);
        console.log("Background refresh completed");
      } catch (error) {
        console.warn("Background refresh failed:", error);
      }
    };

    // Error handling helper
    const handleActivityError = (error: any) => {
      if (error instanceof TypeError) {
        setError({
          type: "network",
          message:
            "Network connection failed. Please check your internet connection and try again.",
        });
      } else if (error instanceof Error && error.message === "AUTH_ERROR") {
        setError({
          type: "auth",
          message:
            "Your Strava session has expired. Please reconnect your account.",
        });
      } else if (error instanceof Error && error.message === "RATE_LIMIT") {
        setError({
          type: "api",
          message:
            "Too many requests to Strava. Please wait a moment and try again.",
        });
      } else {
        setError({
          type: "general",
          message: "Failed to load activities. Please try again later.",
        });
      }
    };

    fetchInitialActivities();
  }, [accessToken, includeVirtualRides]);

  const handleActivityClick = async (activityId: number) => {
    setActivityLoading(activityId);
    setError(null);

    try {
      // Find activity in either activities or search results
      const activity = [...activities, ...searchResults].find(
        (a) => a.id === activityId,
      );
      if (!activity) {
        throw new Error("Activity not found");
      }

      // First, try to get cached stream data
      const cachedStreamData = getCachedStream(activityId);

      if (cachedStreamData) {
        console.log(`Using cached stream for activity "${activity.name}"`);

        // Build GPX data from cached stream
        const gpxData = {
          ...cachedStreamData,
          date: new Date(activity.start_date_local),
          distance: activity.distance,
          duration: activity.moving_time * 1000, // convert to ms
        };

        onActivitySelect(gpxData);
        setActivityLoading(null);
        return;
      }

      // No cached data, fetch from Strava API
      console.log(
        `Fetching stream for activity "${activity.name}" from Strava API`,
      );

      const response = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng&key_by_type=true&access_token=${accessToken}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch activity stream from Strava.");
      }
      const stream = await response.json();

      if (stream.latlng) {
        const totalPoints = stream.latlng.data.length;
        const points = stream.latlng.data.map((point: [number, number]) => ({
          lat: point[0],
          lon: point[1],
        }));

        let gpxString = `<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="Landform Labs">
<trk>
<name>${activity.name}</name>
<trkseg>
`;
        points.forEach((p: any) => {
          gpxString += `<trkpt lat="${p.lat}" lon="${p.lon}"></trkpt>\n`;
        });
        gpxString += `</trkseg>
</trk>
</gpx>`;

        const gpxData = {
          fileName: `${activity.name}.gpx`,
          totalPoints,
          fileSize: gpxString.length,
          gpxString,
          activityId: activity.id,
          activityName: activity.name,
          date: new Date(activity.start_date_local),
          distance: activity.distance,
          duration: activity.moving_time * 1000, // convert to ms
          gpx: {
            trk: {
              trkseg: {
                trkpt: points.map((p: any) => ({
                  "@_lat": p.lat,
                  "@_lon": p.lon,
                })),
              },
            },
          },
        };

        // Cache the processed GPX data for future use
        setCachedStream(activityId, activity.name, gpxData);

        onActivitySelect(gpxData);
      } else {
        throw new Error("No latlng data in activity stream.");
      }
    } catch (error) {
      console.error("Error fetching Strava activity stream:", error);
      setError({
        type: "general",
        message: "Failed to load activity. Please try again later.",
      });
    } finally {
      setActivityLoading(null);
    }
  };

  // Determine which activities to display
  const displayActivities = searchQuery.trim() ? searchResults : activities;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-storm">Loading your Strava activities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-basalt mb-2 font-trispace">
          Your Strava Activities
        </h2>
        <p className="text-slate-storm">
          Select an activity to create a custom route tile from your adventure.
        </p>
      </div>

      {/* Natural Language Search */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-storm/10 p-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-basalt font-trispace">
              Search Your Activities
            </h3>
            {totalActivitiesCount !== null && (
              <div className="text-sm text-slate-storm">
                Searching {totalActivitiesCount} activities
                {hasMoreActivities && (
                  <span className="ml-1 text-xs">+ more</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="search"
              className="block text-sm font-semibold text-basalt mb-2"
            >
              Ask for activities using natural language
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Try: 'My longest ride', 'Rides from December 2021', 'LoToJa 2021'"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.trim() !== "");
                }}
                onFocus={() => setShowSuggestions(searchQuery.trim() !== "")}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt placeholder-slate-storm/60"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="mt-2 bg-white border border-slate-storm/20 rounded-lg shadow-lg p-3 z-10">
                <div className="text-xs text-slate-storm/70 mb-2 font-medium">
                  Try these examples:
                </div>
                <div className="flex flex-wrap gap-2">
                  {getSearchSuggestions(searchQuery).map(
                    (suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="px-2 py-1 text-xs rounded-full border border-slate-storm/20 text-slate-storm hover:border-summit-sage hover:text-summit-sage transition-colors duration-200"
                      >
                        {suggestion}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Query Interpretation */}
            {searchQuery.trim() && (
              <div className="mt-2 text-sm">
                <span className="text-slate-storm/70">
                  {interpretQuery(searchQuery)}
                </span>
                {searchResults.length > 0 && (
                  <span className="ml-2 text-summit-sage font-medium">
                    ({searchResults.length} found)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Virtual Rides Toggle */}
          <div className="pt-2 border-t border-slate-storm/10">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeVirtualRides"
                checked={includeVirtualRides}
                onChange={(e) => setIncludeVirtualRides(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-summit-sage focus:ring-summit-sage"
              />
              <label
                htmlFor="includeVirtualRides"
                className="ml-2 block text-sm text-gray-900"
              >
                Include Virtual Activities
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0">
              {error.type === "auth"
                ? "🔒"
                : error.type === "network"
                  ? "🌐"
                  : error.type === "api"
                    ? "⚡"
                    : "⚠️"}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-1">
                {error.type === "auth"
                  ? "Authentication Required"
                  : error.type === "network"
                    ? "Connection Issue"
                    : error.type === "api"
                      ? "Strava Service Issue"
                      : "Error"}
              </h4>
              <p className="text-sm text-red-700 mb-3">{error.message}</p>

              {error.type === "auth" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => (window.location.href = "/strava")}
                    className="btn-primary text-sm"
                  >
                    Reconnect Strava
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="btn-secondary text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {error.type === "network" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setError(null);
                      window.location.reload();
                    }}
                    className="btn-primary text-sm"
                  >
                    Retry Connection
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="btn-secondary text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {(error.type === "api" || error.type === "general") && (
                <button
                  onClick={() => setError(null)}
                  className="btn-secondary text-sm"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      {displayActivities.length > 0 ? (
        <div className="space-y-3 mb-8">
          {displayActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-lg shadow-sm border border-slate-storm/10 hover:border-summit-sage/30 hover:shadow-md transition-all duration-200"
            >
              <button
                onClick={() => handleActivityClick(activity.id)}
                disabled={activityLoading !== null}
                className="w-full p-6 text-left disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer hover:bg-slate-storm/5 transition-all duration-200"
              >
                <div className="flex items-center">
                  {/* Left side: Sport icon and activity details */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0 pr-4">
                    {/* Sport Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {(() => {
                        const icons: { [key: string]: string } = {
                          Ride: "🚴‍♂️",
                          Run: "🏃‍♂️",
                          Hike: "🥾",
                          Walk: "🚶‍♂️",
                          Swim: "🏊‍♂️",
                          Workout: "💪",
                          Yoga: "🧘‍♂️",
                          VirtualRide: "🚴‍♂️",
                          EBikeRide: "🚴‍♂️",
                          MountainBikeRide: "🚵‍♂️",
                        };
                        return icons[activity.sport_type] || "🏃‍♂️";
                      })()}
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-basalt group-hover:text-summit-sage transition-colors duration-200 truncate mb-1">
                        {activity.name}
                      </h3>

                      <div className="flex items-center space-x-4 text-sm text-slate-storm">
                        <span className="flex items-center">
                          <span className="font-medium text-xs text-slate-storm/70 mr-1">
                            Distance:
                          </span>
                          {(activity.distance / 1000).toFixed(2)} km
                        </span>

                        <span className="flex items-center">
                          <span className="font-medium text-xs text-slate-storm/70 mr-1">
                            Date:
                          </span>
                          {formatActivityDate(activity.start_date_local)}
                        </span>

                        {activity.photos?.count &&
                          activity.photos.count > 0 && (
                            <span className="flex items-center">
                              <span className="font-medium text-xs text-slate-storm/70 mr-1">
                                Photos:
                              </span>
                              {activity.photos.count}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Route thumbnail or loading state */}
                  <div className="flex-shrink-0">
                    {activityLoading === activity.id ? (
                      <div className="flex items-center text-summit-sage w-16 justify-center">
                        <div className="w-5 h-5 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="group-hover:scale-105 transition-transform duration-200">
                        <RouteThumbnail
                          polyline={activity.map?.summary_polyline}
                          sportType={activity.sport_type}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-slate-storm/10">
          <div className="text-6xl mb-4">🚴‍♂️</div>
          <h3 className="text-lg font-semibold text-basalt mb-2">
            No Activities Found
          </h3>
          <p className="text-slate-storm">
            {searchQuery.trim()
              ? "Try a different search query or check your spelling."
              : "You don't have any activities yet. Go create some adventures!"}
          </p>
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery.trim() && (
        <div className="text-center py-4">
          <div className="text-sm text-slate-storm">
            {searchLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
                <span>Searching through your activities...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <span>
                Found {searchResults.length} matching activities
                {totalActivitiesCount && (
                  <span className="text-basalt font-medium">
                    {" "}
                    out of {totalActivitiesCount} total
                  </span>
                )}
              </span>
            ) : searchQuery.trim() && !searchLoading ? (
              <span className="text-slate-storm">
                No activities found matching &quot;{searchQuery}&quot;
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
