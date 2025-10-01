import MiniSearch from "minisearch";

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

interface SearchableActivity extends StravaActivity {
  // Computed fields for better search
  distance_km: number;
  date_formatted: string;
  sport_name: string;
}

let miniSearchInstance: MiniSearch<SearchableActivity> | null = null;

/**
 * Creates a MiniSearch index for Strava activities with fuzzy matching and auto-suggest
 */
export function createActivitySearchIndex(activities: StravaActivity[]): MiniSearch<SearchableActivity> {
  // Prepare activities with searchable fields
  const searchableActivities: SearchableActivity[] = activities.map((activity) => ({
    ...activity,
    distance_km: Math.round(activity.distance / 1000),
    date_formatted: new Date(activity.start_date_local).toLocaleDateString(),
    sport_name: activity.sport_type.toLowerCase(),
  }));

  // Create MiniSearch instance
  const miniSearch = new MiniSearch<SearchableActivity>({
    fields: ["name", "sport_name", "date_formatted"], // Fields to index for full-text search
    storeFields: ["id", "name", "distance", "moving_time", "sport_type", "start_date_local", "distance_km", "total_elevation_gain", "photos", "map"], // Fields to return with results
    searchOptions: {
      boost: { name: 3, sport_name: 1.5, date_formatted: 1 }, // Boost name matches
      fuzzy: 0.2, // Allow slight misspellings
      prefix: true, // Match partial words
      combineWith: "AND", // Default to AND for multiple terms
    },
  });

  // Index all activities
  miniSearch.addAll(searchableActivities);

  // Cache the instance
  miniSearchInstance = miniSearch;

  return miniSearch;
}

/**
 * Get the cached MiniSearch instance (if exists)
 */
export function getSearchIndex(): MiniSearch<SearchableActivity> | null {
  return miniSearchInstance;
}

/**
 * Clear the cached MiniSearch instance
 */
export function clearSearchIndex(): void {
  miniSearchInstance = null;
}

/**
 * Search activities with fuzzy matching
 */
export function searchActivities(
  query: string,
  options?: {
    fuzzy?: number;
    prefix?: boolean;
    boost?: Record<string, number>;
  }
): SearchableActivity[] {
  if (!miniSearchInstance) {
    console.warn("MiniSearch index not initialized");
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const results = miniSearchInstance.search(query, {
      fuzzy: options?.fuzzy ?? 0.2,
      prefix: options?.prefix ?? true,
      boost: options?.boost ?? { name: 3, sport_name: 1.5, date_formatted: 1 },
    });

    return results.map((result) => result as unknown as SearchableActivity);
  } catch (error) {
    console.error("MiniSearch query error:", error);
    return [];
  }
}

/**
 * Get auto-suggestions for a query
 */
export function getAutoSuggestions(
  query: string,
  maxSuggestions: number = 5
): string[] {
  if (!miniSearchInstance) {
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const suggestions = miniSearchInstance.autoSuggest(query, {
      fuzzy: 0.2,
      prefix: true,
    });

    return suggestions
      .slice(0, maxSuggestions)
      .map((suggestion) => suggestion.suggestion);
  } catch (error) {
    console.error("MiniSearch auto-suggest error:", error);
    return [];
  }
}

/**
 * Rank and score search results by relevance
 */
export function rankSearchResults(
  activities: StravaActivity[],
  query: string,
  options?: {
    preferRecent?: boolean;
    preferLonger?: boolean;
  }
): StravaActivity[] {
  if (!miniSearchInstance || !query.trim()) {
    return activities;
  }

  // Get fuzzy search results with scores
  const searchResults = miniSearchInstance.search(query, {
    fuzzy: 0.2,
    prefix: true,
  });

  // Create a map of activity ID to search score
  const scoreMap = new Map<number, number>();
  searchResults.forEach((result) => {
    scoreMap.set(result.id, result.score);
  });

  // Filter and sort activities
  const scoredActivities = activities
    .filter((activity) => scoreMap.has(activity.id))
    .map((activity) => {
      let score = scoreMap.get(activity.id) || 0;

      // Boost recent activities if requested
      if (options?.preferRecent) {
        const daysAgo = (Date.now() - new Date(activity.start_date_local).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(0, 1 - daysAgo / 365); // Boost activities from past year
        score += recencyBoost * 0.5;
      }

      // Boost longer activities if requested
      if (options?.preferLonger) {
        const distanceBoost = Math.min(1, activity.distance / 100000); // Cap at 100km
        score += distanceBoost * 0.3;
      }

      return { activity, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.activity);

  return scoredActivities;
}
