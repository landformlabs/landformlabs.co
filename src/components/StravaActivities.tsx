"use client";

import { useEffect, useState } from "react";
import RouteThumbnail from "./RouteThumbnail";

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
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
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [after, setAfter] = useState<string>("");
  const [before, setBefore] = useState<string>("");

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

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const afterTimestamp = after ? new Date(after).getTime() / 1000 : null;
        const beforeTimestamp = before
          ? new Date(before).getTime() / 1000
          : null;

        let url = `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&page=${page}&per_page=10`;
        if (afterTimestamp) {
          url += `&after=${afterTimestamp}`;
        }
        if (beforeTimestamp) {
          url += `&before=${beforeTimestamp}`;
        }

        const response = await fetch(url);
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
        setActivities(data);
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
      }
    };

    fetchActivities();
  }, [accessToken, page, before, after]);

  const handleActivityClick = async (activityId: number) => {
    setActivityLoading(activityId);
    setError(null);
    try {
      const activity = activities.find((a) => a.id === activityId);
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

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-storm/10 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-semibold text-basalt mb-2"
            >
              Search Activities
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by activity name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt placeholder-slate-storm/60"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="after"
                className="block text-sm font-semibold text-basalt mb-2"
              >
                After Date
              </label>
              <input
                type="date"
                id="after"
                value={after}
                onChange={(e) => setAfter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt"
              />
            </div>
            <div>
              <label
                htmlFor="before"
                className="block text-sm font-semibold text-basalt mb-2"
              >
                Before Date
              </label>
              <input
                type="date"
                id="before"
                value={before}
                onChange={(e) => setBefore(e.target.value)}
                className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt"
              />
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
      {filteredActivities.length > 0 ? (
        <div className="space-y-3 mb-8">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-lg shadow-sm border border-slate-storm/10 hover:border-summit-sage/30 hover:shadow-md transition-all duration-200"
            >
              <button
                onClick={() => handleActivityClick(activity.id)}
                disabled={activityLoading !== null}
                className="w-full p-6 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  {/* Left side: Sport icon and activity details */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
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
                          <span className="w-4 h-4 mr-1">📏</span>
                          {(activity.distance / 1000).toFixed(2)} km
                        </span>

                        <span className="flex items-center">
                          <span className="w-4 h-4 mr-1">📅</span>
                          {formatActivityDate(activity.start_date_local)}
                        </span>

                        {activity.photos?.count &&
                          activity.photos.count > 0 && (
                            <span className="flex items-center">
                              <span className="w-4 h-4 mr-1">📸</span>
                              {activity.photos.count}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Loading state, thumbnail, and select indicator */}
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    {activityLoading === activity.id ? (
                      <div className="flex items-center text-summit-sage">
                        <div className="w-5 h-5 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-sm font-medium">Loading...</span>
                      </div>
                    ) : (
                      <>
                        {/* Route Thumbnail */}
                        <RouteThumbnail
                          polyline={activity.map?.summary_polyline}
                          sportType={activity.sport_type}
                        />

                        {/* Select Indicator */}
                        <div className="text-summit-sage opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="text-sm font-medium">Select →</span>
                        </div>
                      </>
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
            {searchQuery || after || before
              ? "Try adjusting your search criteria or date filters."
              : "You don't have any activities yet. Go create some adventures!"}
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <span className="text-sm text-slate-storm font-medium">
          Page {page}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={activities.length < 10 || loading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
