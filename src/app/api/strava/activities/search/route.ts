import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// In-memory cache for activities (in production, use Redis or similar)
const activityCache = new Map<
  string,
  {
    activities: any[];
    lastFetched: number;
    totalFetched: number;
    hasMore: boolean;
  }
>();

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

async function fetchActivitiesBatch(
  accessToken: string,
  page: number,
  perPage: number = 200,
): Promise<StravaActivity[]> {
  const url = `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&page=${page}&per_page=${perPage}`;

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

  return response.json();
}

function searchActivities(
  activities: StravaActivity[],
  query: string,
  sportType?: string,
): StravaActivity[] {
  const normalizedQuery = query.toLowerCase().trim();

  return activities.filter((activity) => {
    // Sport type filter
    if (sportType && activity.sport_type !== sportType) {
      return false;
    }

    // Text search across multiple fields
    if (normalizedQuery) {
      const searchableText = [
        activity.name,
        activity.sport_type,
        new Date(activity.start_date_local).toLocaleDateString(),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    }

    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const sportType = searchParams.get("sport_type") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 2000);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Create cache key based on access token (user-specific)
    const cacheKey = accessToken;
    const now = Date.now();
    const cacheExpiry = 60 * 60 * 1000; // 1 hour

    // Check cache
    let cached = activityCache.get(cacheKey);
    const needsRefresh =
      !cached ||
      forceRefresh ||
      now - cached.lastFetched > cacheExpiry ||
      (cached.activities.length < limit && cached.hasMore);

    if (needsRefresh) {
      try {
        let allActivities: StravaActivity[] = cached?.activities || [];
        let page = cached ? Math.floor(cached.totalFetched / 200) + 1 : 1;
        let hasMore = true;
        let totalFetched = cached?.totalFetched || 0;

        // Fetch activities in batches until we have enough or no more exist
        while (allActivities.length < limit && hasMore) {
          const batch = await fetchActivitiesBatch(accessToken, page);

          if (batch.length === 0) {
            hasMore = false;
            break;
          }

          // Merge new activities, avoiding duplicates
          const existingIds = new Set(allActivities.map((a) => a.id));
          const newActivities = batch.filter(
            (activity) => !existingIds.has(activity.id),
          );

          allActivities = [...allActivities, ...newActivities];
          totalFetched += batch.length;
          page++;

          // If we got fewer than expected, we've reached the end
          if (batch.length < 200) {
            hasMore = false;
          }

          // Rate limiting: wait 10 seconds between requests if we need more
          if (allActivities.length < limit && hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
          }
        }

        // Update cache
        activityCache.set(cacheKey, {
          activities: allActivities,
          lastFetched: now,
          totalFetched,
          hasMore,
        });

        cached = activityCache.get(cacheKey)!;
      } catch (error) {
        console.error("Error fetching activities:", error);

        // If we have cached data, use it despite the error
        if (cached) {
        } else {
          // Return error if no cached data available
          if (error instanceof Error && error.message === "AUTH_ERROR") {
            return NextResponse.json(
              { error: "Authentication expired" },
              { status: 401 },
            );
          } else if (error instanceof Error && error.message === "RATE_LIMIT") {
            return NextResponse.json(
              { error: "Rate limit exceeded. Please try again later." },
              { status: 429 },
            );
          }

          return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 },
          );
        }
      }
    }

    // Perform search on cached activities
    if (!cached) {
      return NextResponse.json(
        { error: "No activity data available" },
        { status: 500 },
      );
    }

    const searchResults = searchActivities(cached.activities, query, sportType);

    return NextResponse.json({
      activities: searchResults,
      totalActivities: cached.activities.length,
      hasMore: cached.hasMore,
      lastFetched: cached.lastFetched,
      searchQuery: query,
      sportTypeFilter: sportType,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Clear cache for this user
    const cacheKey = accessToken;
    activityCache.delete(cacheKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cache clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 },
    );
  }
}
