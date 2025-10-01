"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import RouteThumbnail from "./RouteThumbnail";
import {
  parseNaturalLanguageQuery,
  getSearchSuggestions,
  interpretQuery,
  type ParsedFilter,
} from "../utils/naturalLanguageParser";
import {
  createActivitySearchIndex,
  searchActivities as miniSearchActivities,
  rankSearchResults,
  getAutoSuggestions,
} from "../utils/activitySearch";
import { autoSimplifyGPXTrack, generateSimplifiedGPXString } from "@/lib/gpxSimplify";
import { calculateDistance } from "@/lib/gpx";
import {
  Bike,
  Footprints,
  Mountain,
  PersonStanding,
  Waves,
  Dumbbell,
  User,
  Zap,
  AlertTriangle,
  Globe,
  Lock,
  TreePine,
  Activity,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [searchIndexReady, setSearchIndexReady] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "date" | "distance" | "time">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Format activity date for display
  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format duration (moving_time in seconds) to HH:MM:SS or MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

        // Initialize MiniSearch index with all activities for better fuzzy search
        if (data.activities.length > 0) {
          try {
            createActivitySearchIndex(data.activities);
            setSearchIndexReady(true);
          } catch (error) {
            console.error("Failed to create search index:", error);
          }
        }

        // If we have remaining text search and MiniSearch is ready, apply fuzzy matching
        if (parsed.textSearch && data.activities.length > 0) {
          try {
            // Use MiniSearch to rank results by fuzzy match relevance
            const rankedResults = rankSearchResults(filteredData, parsed.textSearch, {
              preferRecent: parsed.superlative?.type === 'recent',
            });
            filteredData = rankedResults;
          } catch (error) {
            console.error("MiniSearch ranking error:", error);
            // Fall back to original results if ranking fails
          }
        }

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

  // Load activities for the current page
  const loadActivities = useCallback(async (page: number, isInitialLoad = false) => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setPaginationLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
        include_virtual: includeVirtualRides.toString(),
      });

      const response = await fetch(`/api/strava/activities?${params}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("AUTH_ERROR");
        } else if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        } else if (response.status >= 500) {
          throw new Error("SERVER_ERROR");
        } else {
          throw new Error("API_ERROR");
        }
      }

      const data = await response.json();
      setActivities(data.activities);
      setHasMoreActivities(data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching Strava activities:", error);
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
      } else if (error instanceof Error && error.message === "SERVER_ERROR") {
        setError({
          type: "api",
          message:
            "Strava's servers are temporarily unavailable. Please try again in a few minutes.",
        });
      } else {
        setError({
          type: "general",
          message: "Failed to load activities. Please try again later.",
        });
      }
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [accessToken, includeVirtualRides]);

  // Load initial activities when component mounts or settings change
  useEffect(() => {
    setCurrentPage(1);
    loadActivities(1, true);
  }, [loadActivities]);

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

      const response = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng&key_by_type=true&access_token=${accessToken}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch activity stream from Strava.");
      }
      const stream = await response.json();

      if (stream.latlng) {
        const originalPoints = stream.latlng.data.map((point: [number, number]) => ({
          lat: point[0],
          lon: point[1],
        }));

        console.log('Original GPX points:', originalPoints.length);
        
        // Apply automatic simplification to the track points
        const simplifyResult = autoSimplifyGPXTrack(originalPoints, 0.7);
        console.log('GPX simplification result:', simplifyResult);

        // Recalculate distance for simplified points
        let simplifiedDistance = 0;
        for (let i = 0; i < simplifyResult.simplifiedPoints.length - 1; i++) {
          simplifiedDistance += calculateDistance(
            simplifyResult.simplifiedPoints[i], 
            simplifyResult.simplifiedPoints[i + 1]
          );
        }

        // Calculate bounds for simplified points
        const simplifiedLats = simplifyResult.simplifiedPoints.map(p => p.lat);
        const simplifiedLons = simplifyResult.simplifiedPoints.map(p => p.lon);
        const bounds = {
          minLat: Math.min(...simplifiedLats),
          maxLat: Math.max(...simplifiedLats),
          minLon: Math.min(...simplifiedLons),
          maxLon: Math.max(...simplifiedLons),
        };

        // Generate simplified GPX string for export
        const simplifiedGPXString = generateSimplifiedGPXString(
          simplifyResult.simplifiedPoints,
          {
            activityName: activity.name,
            date: new Date(activity.start_date_local)
          }
        );

        const gpxData = {
          fileName: `${activity.name}.gpx`,
          points: simplifyResult.simplifiedPoints, // Use simplified points
          bounds,
          totalPoints: simplifyResult.simplifiedCount,
          originalTotalPoints: originalPoints.length,
          fileSize: simplifiedGPXString.length,
          gpxString: simplifiedGPXString, // Use simplified GPX string for export
          activityId: activity.id,
          activityName: activity.name,
          date: new Date(activity.start_date_local),
          distance: simplifiedDistance, // Use simplified distance
          duration: activity.moving_time * 1000, // convert to ms
          originalPoints: originalPoints, // Keep original for reference
          simplificationResult: simplifyResult,
          gpx: {
            trk: {
              trkseg: {
                trkpt: simplifyResult.simplifiedPoints.map((p: any) => ({
                  "@_lat": p.lat,
                  "@_lon": p.lon,
                })),
              },
            },
          },
        };
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

  // Handle column header click for sorting
  const handleSort = (column: "name" | "date" | "distance" | "time") => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending (except for name)
      setSortBy(column);
      setSortDirection(column === "name" ? "asc" : "desc");
    }
  };

  // Sort activities based on selected sort option and direction
  const sortActivities = useCallback((activitiesToSort: StravaActivity[]) => {
    const sorted = [...activitiesToSort];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "distance":
          comparison = a.distance - b.distance;
          break;
        case "time":
          comparison = a.moving_time - b.moving_time;
          break;
        case "date":
        default:
          comparison = new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [sortBy, sortDirection]);

  // Determine which activities to display and sort them
  const displayActivities = useMemo(() => {
    const activitiesToDisplay = searchQuery.trim() ? searchResults : activities;
    return sortActivities(activitiesToDisplay);
  }, [searchQuery, searchResults, activities, sortActivities]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-storm">Loading your Strava activities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-[1400px]">
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
                placeholder="Try: 'Fastest century ride', 'My fastest marathon', 'Runs in Saint George'"
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
            {showSuggestions && (() => {
              const suggestions = getSearchSuggestions(searchQuery);
              const autoSuggestions = searchIndexReady ? getAutoSuggestions(searchQuery, 3) : [];
              const allSuggestions = Array.from(new Set([...autoSuggestions, ...suggestions])).slice(0, 8);

              return (
                <div className="mt-2 bg-white border border-slate-storm/20 rounded-lg shadow-lg p-3 z-10">
                  <div className="text-xs text-slate-storm/70 mb-2 font-medium">
                    {autoSuggestions.length > 0 ? "Suggestions from your activities:" : "Try these examples:"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allSuggestions.map(
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
              );
            })()}

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
              {error.type === "auth" ? (
                <Lock className="w-6 h-6" />
              ) : error.type === "network" ? (
                <Globe className="w-6 h-6" />
              ) : error.type === "api" ? (
                <Zap className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
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

      {/* Sort Controls - Mobile Only */}
      {displayActivities.length > 0 && (
        <div className="md:hidden mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-storm/10 p-4">
            <label className="block text-sm font-semibold text-basalt mb-2">
              Sort by
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleSort("date")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  sortBy === "date"
                    ? "bg-summit-sage text-white"
                    : "bg-slate-50 text-slate-storm hover:bg-slate-100"
                }`}
              >
                Date
                {sortBy === "date" && (
                  sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort("distance")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  sortBy === "distance"
                    ? "bg-summit-sage text-white"
                    : "bg-slate-50 text-slate-storm hover:bg-slate-100"
                }`}
              >
                Distance
                {sortBy === "distance" && (
                  sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort("time")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  sortBy === "time"
                    ? "bg-summit-sage text-white"
                    : "bg-slate-50 text-slate-storm hover:bg-slate-100"
                }`}
              >
                Duration
                {sortBy === "time" && (
                  sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort("name")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  sortBy === "name"
                    ? "bg-summit-sage text-white"
                    : "bg-slate-50 text-slate-storm hover:bg-slate-100"
                }`}
              >
                Name
                {sortBy === "name" && (
                  sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities - Mobile Card View */}
      {displayActivities.length > 0 ? (
        <>
          <div className="md:hidden space-y-3 mb-8">
            {displayActivities.map((activity) => {
              const getSportIcon = (sportType: string) => {
                switch (sportType) {
                  case "Ride":
                  case "VirtualRide":
                  case "EBikeRide":
                    return <Bike className="w-5 h-5" />;
                  case "MountainBikeRide":
                    return <Mountain className="w-5 h-5" />;
                  case "Run":
                    return <Footprints className="w-5 h-5" />;
                  case "Hike":
                    return <TreePine className="w-5 h-5" />;
                  case "Walk":
                    return <PersonStanding className="w-5 h-5" />;
                  case "Swim":
                    return <Waves className="w-5 h-5" />;
                  case "Workout":
                    return <Dumbbell className="w-5 h-5" />;
                  case "Yoga":
                    return <Activity className="w-5 h-5" />;
                  default:
                    return <Footprints className="w-5 h-5" />;
                }
              };

              return (
                <div
                  key={activity.id}
                  onClick={() => handleActivityClick(activity.id)}
                  className="bg-white rounded-lg shadow-sm border border-slate-storm/10 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Route Preview - Full Width Top Section */}
                  <div className="relative bg-slate-50 h-40 flex items-center justify-center">
                    {activityLoading === activity.id ? (
                      <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="scale-150">
                        <RouteThumbnail
                          polyline={activity.map?.summary_polyline}
                          sportType={activity.sport_type}
                        />
                      </div>
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex-shrink-0 text-slate-storm mt-0.5">
                        {getSportIcon(activity.sport_type)}
                      </div>
                      <h3 className="font-medium text-basalt line-clamp-2 flex-1">
                        {activity.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-storm">
                      <div>
                        <div className="font-semibold text-basalt">Distance</div>
                        <div>{(activity.distance / 1000).toFixed(2)} km</div>
                      </div>
                      <div>
                        <div className="font-semibold text-basalt">Duration</div>
                        <div>{formatDuration(activity.moving_time)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-basalt">Date</div>
                        <div>{formatActivityDate(activity.start_date_local)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activities Table - Desktop Only */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-storm/10 overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[40%]" /> {/* Activity name */}
                  <col className="w-[13%]" /> {/* Distance */}
                  <col className="w-[13%]" /> {/* Duration */}
                  <col className="w-[14%]" /> {/* Date */}
                  <col className="w-[20%]" /> {/* Route thumbnail */}
                </colgroup>
                <thead className="bg-slate-50 border-b border-slate-storm/10">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 text-sm font-semibold text-basalt hover:text-summit-sage transition-colors"
                      >
                        Activity
                        {sortBy === "name" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("distance")}
                        className="flex items-center gap-1 text-sm font-semibold text-basalt hover:text-summit-sage transition-colors"
                      >
                        Distance
                        {sortBy === "distance" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("time")}
                        className="flex items-center gap-1 text-sm font-semibold text-basalt hover:text-summit-sage transition-colors"
                      >
                        Duration
                        {sortBy === "time" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 text-sm font-semibold text-basalt hover:text-summit-sage transition-colors"
                      >
                        Date
                        {sortBy === "date" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-basalt">
                      Route
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-storm/5">
                  {displayActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      onClick={() => handleActivityClick(activity.id)}
                      className="hover:bg-slate-storm/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 text-slate-storm">
                            {(() => {
                              const getSportIcon = (sportType: string) => {
                                switch (sportType) {
                                  case "Ride":
                                  case "VirtualRide":
                                  case "EBikeRide":
                                    return <Bike className="w-5 h-5" />;
                                  case "MountainBikeRide":
                                    return <Mountain className="w-5 h-5" />;
                                  case "Run":
                                    return <Footprints className="w-5 h-5" />;
                                  case "Hike":
                                    return <TreePine className="w-5 h-5" />;
                                  case "Walk":
                                    return <PersonStanding className="w-5 h-5" />;
                                  case "Swim":
                                    return <Waves className="w-5 h-5" />;
                                  case "Workout":
                                    return <Dumbbell className="w-5 h-5" />;
                                  case "Yoga":
                                    return <Activity className="w-5 h-5" />;
                                  default:
                                    return <Footprints className="w-5 h-5" />;
                                }
                              };
                              return getSportIcon(activity.sport_type);
                            })()}
                          </div>
                          <span className="font-medium text-basalt group-hover:text-summit-sage transition-colors truncate">
                            {activity.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-storm">
                        {(activity.distance / 1000).toFixed(2)} km
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-storm">
                        {formatDuration(activity.moving_time)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-storm">
                        {formatActivityDate(activity.start_date_local)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {activityLoading === activity.id ? (
                            <div className="w-5 h-5 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <div className="group-hover:scale-105 transition-transform duration-200">
                              <RouteThumbnail
                                polyline={activity.map?.summary_polyline}
                                sportType={activity.sport_type}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-slate-storm/10">
          <div className="text-slate-storm mb-4">
            <Bike className="w-16 h-16 mx-auto" />
          </div>
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

      {/* Pagination Controls - only show when not searching */}
      {!searchQuery.trim() && displayActivities.length > 0 && (
        <div className="flex items-center justify-between py-6 border-t border-slate-storm/10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => loadActivities(currentPage - 1)}
              disabled={currentPage <= 1 || paginationLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-storm hover:text-summit-sage border border-slate-storm/20 rounded-lg hover:border-summit-sage/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-storm disabled:hover:border-slate-storm/20 transition-all duration-200"
            >
              {paginationLoading ? (
                <div className="w-4 h-4 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>←</span>
              )}
              <span>Previous</span>
            </button>

            <span className="text-sm text-slate-storm">
              Page {currentPage}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-storm">
              {displayActivities.length} activities
            </span>

            <button
              onClick={() => loadActivities(currentPage + 1)}
              disabled={!hasMoreActivities || paginationLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-storm hover:text-summit-sage border border-slate-storm/20 rounded-lg hover:border-summit-sage/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-storm disabled:hover:border-slate-storm/20 transition-all duration-200"
            >
              <span>Next</span>
              {paginationLoading ? (
                <div className="w-4 h-4 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>→</span>
              )}
            </button>
          </div>
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
