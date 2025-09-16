import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

// In-memory cache for activities per user
const activitiesCache = new Map<
  string,
  {
    activities: StravaActivity[];
    lastFetched: number;
    hasMore: boolean;
    totalFetched: number;
  }
>();

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  sport_type: string;
  start_date_local: string;
  total_elevation_gain?: number;
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

async function fetchAndCacheActivities(
  accessToken: string,
  includeVirtual: boolean,
  requestedPage: number,
  perPage: number
): Promise<{
  activities: StravaActivity[];
  hasMore: boolean;
  totalInCache: number;
}> {
  const cacheKey = `${accessToken}_${includeVirtual}`;
  const now = Date.now();
  const cacheExpiry = 60 * 60 * 1000; // 1 hour

  let cached = activitiesCache.get(cacheKey);
  const needsRefresh = !cached || now - cached.lastFetched > cacheExpiry;

  // Calculate how many activities we need in total to serve this page
  const requiredActivities = requestedPage * perPage;

  // If cache exists but doesn't have enough activities for this page, extend it
  const needsMore = cached && cached.activities.length < requiredActivities && cached.hasMore;

  if (needsRefresh || needsMore) {
    let allActivities: StravaActivity[] = cached?.activities || [];
    let stravaPage = cached ? Math.floor(cached.totalFetched / 200) + 1 : 1;
    let hasMore = cached?.hasMore ?? true;
    let totalFetched = cached?.totalFetched || 0;

    // Fetch activities until we have enough for the requested page or no more exist
    while (allActivities.length < requiredActivities && hasMore) {
      const url = `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&page=${stravaPage}&per_page=200`;

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

      const data: StravaActivity[] = await response.json();

      // If no more data, we've reached the end
      if (data.length === 0) {
        hasMore = false;
        break;
      }

      // Filter out activities with zero distance
      let filteredBatch = data.filter(
        (activity: StravaActivity) => activity.distance > 0
      );

      // Filter out virtual rides if not requested
      if (!includeVirtual) {
        filteredBatch = filteredBatch.filter(
          (activity: StravaActivity) => activity.sport_type !== "VirtualRide"
        );
      }

      // Avoid duplicates when extending cache
      const existingIds = new Set(allActivities.map(a => a.id));
      const newActivities = filteredBatch.filter(a => !existingIds.has(a.id));

      allActivities = [...allActivities, ...newActivities];
      totalFetched += data.length;

      // If we got fewer activities than requested from Strava, there are no more
      if (data.length < 200) {
        hasMore = false;
        break;
      }

      stravaPage++;
    }

    // Update cache
    activitiesCache.set(cacheKey, {
      activities: allActivities,
      lastFetched: now,
      hasMore,
      totalFetched,
    });

    cached = activitiesCache.get(cacheKey)!;
  }

  if (!cached) {
    throw new Error("Failed to cache activities");
  }

  return {
    activities: cached.activities,
    hasMore: cached.hasMore,
    totalInCache: cached.activities.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(searchParams.get("per_page") || "20"), 50);
    const includeVirtual = searchParams.get("include_virtual") === "true";

    try {
      const { activities: allActivities, hasMore: hasMoreInStrava } = await fetchAndCacheActivities(
        accessToken,
        includeVirtual,
        page,
        perPage
      );

      // Calculate pagination from the filtered activities
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const pageActivities = allActivities.slice(startIndex, endIndex);

      // Determine if there are more pages available
      const hasMorePages = endIndex < allActivities.length || hasMoreInStrava;

      return NextResponse.json({
        activities: pageActivities,
        page,
        perPage,
        hasMore: hasMorePages,
        totalReturned: pageActivities.length,
        totalInCache: allActivities.length,
      });
    } catch (error) {
      console.error("Error fetching activities:", error);

      if (error instanceof Error && error.message === "AUTH_ERROR") {
        return NextResponse.json(
          { error: "Authentication expired" },
          { status: 401 }
        );
      } else if (error instanceof Error && error.message === "RATE_LIMIT") {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      } else if (error instanceof Error && error.message === "SERVER_ERROR") {
        return NextResponse.json(
          { error: "Strava server error. Please try again later." },
          { status: 503 }
        );
      } else {
        return NextResponse.json(
          { error: "Failed to fetch activities" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Activities API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}