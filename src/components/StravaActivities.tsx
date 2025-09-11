"use client";

import { useEffect, useState } from "react";

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
}

export default function StravaActivities({ accessToken, onActivitySelect }: { accessToken: string, onActivitySelect: (activity: any) => void }) {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [after, setAfter] = useState<string>("");
  const [before, setBefore] = useState<string>("");

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
        const beforeTimestamp = before ? new Date(before).getTime() / 1000 : null;

        let url = `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&page=${page}&per_page=10`;
        if (afterTimestamp) {
          url += `&after=${afterTimestamp}`;
        }
        if (beforeTimestamp) {
          url += `&before=${beforeTimestamp}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch activities from Strava.");
        }
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error("Error fetching Strava activities:", error);
        setError("Failed to fetch activities. Please try again later.");
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
        `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng&key_by_type=true&access_token=${accessToken}`
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
      setError("Failed to load activity. Please try again later.");
    } finally {
      setActivityLoading(null);
    }
  };

  if (loading) {
    return <div>Loading Strava activities...</div>;
  }

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4">Your Strava Activities</h2>
      <input
        type="text"
        placeholder="Search activities..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
      />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="after" className="block text-sm font-medium text-gray-700">After</label>
          <input
            type="date"
            id="after"
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label htmlFor="before" className="block text-sm font-medium text-gray-700">Before</label>
          <input
            type="date"
            id="before"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {filteredActivities.length > 0 ? (
        <ul>
          {filteredActivities.map((activity) => (
            <li key={activity.id}>
              <button
                onClick={() => handleActivityClick(activity.id)}
                className="text-left w-full p-2 hover:bg-gray-200 rounded flex justify-between items-center"
                disabled={activityLoading !== null}
              >
                <div className="flex justify-between items-center w-full">
                  <span>{activity.name}</span>
                  <span className="text-sm text-gray-500">{(activity.distance / 1000).toFixed(2)} km</span>
                </div>
                {activityLoading === activity.id && <span>Loading...</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No activities found.</p>
      )}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={activities.length < 10 || loading}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
