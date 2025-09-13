import * as chrono from "chrono-node";
import nlp from "compromise";
import { parse as parseQuery } from "search-query-parser";

export interface ParsedFilter {
  dateRange?: {
    after?: string;
    before?: string;
  };
  superlative?: {
    type:
      | "longest"
      | "shortest"
      | "fastest"
      | "slowest"
      | "recent"
      | "oldest"
      | "highest"
      | "lowest";
    field: "distance" | "time" | "elevation" | "date";
  };
  activityType?: string;
  textSearch?: string;
  interpretation?: string;
}

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  sport_type: string;
  start_date_local: string;
  total_elevation_gain?: number;
}

const SPORT_ALIASES: Record<string, string> = {
  bike: "Ride",
  biking: "Ride",
  cycling: "Ride",
  cycle: "Ride",
  ride: "Ride",
  riding: "Ride",
  running: "Run",
  run: "Run",
  jog: "Run",
  jogging: "Run",
  hike: "Hike",
  hiking: "Hike",
  walk: "Walk",
  walking: "Walk",
  swim: "Swim",
  swimming: "Swim",
  workout: "Workout",
  yoga: "Yoga",
  virtual: "VirtualRide",
  "e-bike": "EBikeRide",
  ebike: "EBikeRide",
  "mountain bike": "MountainBikeRide",
  mtb: "MountainBikeRide",
};

const SUPERLATIVE_PATTERNS = {
  longest: { field: "distance" as const, direction: "desc" },
  shortest: { field: "distance" as const, direction: "asc" },
  fastest: { field: "time" as const, direction: "asc" },
  slowest: { field: "time" as const, direction: "desc" },
  recent: { field: "date" as const, direction: "desc" },
  newest: { field: "date" as const, direction: "desc" },
  latest: { field: "date" as const, direction: "desc" },
  oldest: { field: "date" as const, direction: "asc" },
  earliest: { field: "date" as const, direction: "asc" },
  highest: { field: "elevation" as const, direction: "desc" },
  lowest: { field: "elevation" as const, direction: "asc" },
};

export function parseNaturalLanguageQuery(query: string): ParsedFilter {
  const result: ParsedFilter = {};
  const interpretationParts: string[] = [];

  // Normalize the query
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return result;
  }

  // Parse dates using Chrono
  const dateResults = chrono.parse(normalizedQuery);
  if (dateResults.length > 0) {
    const chronoResult = dateResults[0];

    if (chronoResult.start && chronoResult.end) {
      // Date range
      result.dateRange = {
        after: chronoResult.start.date().toISOString().split("T")[0],
        before: chronoResult.end.date().toISOString().split("T")[0],
      };
      interpretationParts.push(
        `from ${chronoResult.start.date().toLocaleDateString()} to ${chronoResult.end.date().toLocaleDateString()}`,
      );
    } else if (chronoResult.start) {
      const parsedDate = chronoResult.start.date();

      // Check if this looks like a month+year query (e.g., "September 2021")
      // We can detect this by checking if the original text mentions a month name
      const monthNames = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
        "jan",
        "feb",
        "mar",
        "apr",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      const hasMonthName = monthNames.some((month) =>
        normalizedQuery.includes(month),
      );
      const hasYear = /\b(19|20)\d{2}\b/.test(normalizedQuery);

      if (hasMonthName && hasYear && !normalizedQuery.includes("day")) {
        // This is likely a month+year query, create a full month range
        const startOfMonth = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          1,
        );
        const endOfMonth = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth() + 1,
          0,
        );

        result.dateRange = {
          after: startOfMonth.toISOString().split("T")[0],
          before: endOfMonth.toISOString().split("T")[0],
        };
        interpretationParts.push(
          `during ${parsedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
        );
      } else {
        // Single date - determine if it's "after" or "before" based on context
        const dateStr = parsedDate.toISOString().split("T")[0];
        const contextWords = ["since", "after", "from"];
        const hasAfterContext = contextWords.some((word) =>
          normalizedQuery.includes(word),
        );

        if (hasAfterContext) {
          result.dateRange = { after: dateStr };
          interpretationParts.push(`since ${parsedDate.toLocaleDateString()}`);
        } else {
          // For relative dates like "last week", create a range
          const now = new Date();
          if (parsedDate < now) {
            result.dateRange = { after: dateStr };
            interpretationParts.push(`from ${parsedDate.toLocaleDateString()}`);
          } else {
            result.dateRange = { before: dateStr };
            interpretationParts.push(
              `before ${parsedDate.toLocaleDateString()}`,
            );
          }
        }
      }
    }
  }

  // Parse superlatives using Compromise and manual patterns
  const doc = nlp(normalizedQuery);

  // Look for superlative adjectives
  const superlatives = doc.match("#Superlative").out("array");
  const comparatives = doc.match("#Comparative").out("array");

  // Check for both NLP-detected superlatives and manual patterns
  for (const [pattern, config] of Object.entries(SUPERLATIVE_PATTERNS)) {
    if (normalizedQuery.includes(pattern)) {
      result.superlative = {
        type: pattern as any,
        field: config.field,
      };
      interpretationParts.push(
        `${pattern} by ${config.field === "time" ? "duration" : config.field}`,
      );
      break;
    }
  }

  // If no manual pattern found, check NLP results
  if (
    !result.superlative &&
    (superlatives.length > 0 || comparatives.length > 0)
  ) {
    const allSuperlatives = [...superlatives, ...comparatives];
    for (const sup of allSuperlatives) {
      const normalized = sup.toLowerCase();
      if (
        SUPERLATIVE_PATTERNS[normalized as keyof typeof SUPERLATIVE_PATTERNS]
      ) {
        const config =
          SUPERLATIVE_PATTERNS[normalized as keyof typeof SUPERLATIVE_PATTERNS];
        result.superlative = {
          type: normalized as any,
          field: config.field,
        };
        interpretationParts.push(
          `${normalized} by ${config.field === "time" ? "duration" : config.field}`,
        );
        break;
      }
    }
  }

  // Parse activity types
  for (const [alias, sportType] of Object.entries(SPORT_ALIASES)) {
    if (normalizedQuery.includes(alias)) {
      result.activityType = sportType;
      interpretationParts.push(
        `${alias === sportType.toLowerCase() ? sportType.toLowerCase() : alias} activities`,
      );
      break;
    }
  }

  // Extract remaining text for name searching (remove parsed parts)
  let remainingText = normalizedQuery;

  // Remove date references
  if (dateResults.length > 0) {
    dateResults.forEach((dateResult) => {
      if (dateResult.text) {
        remainingText = remainingText
          .replace(dateResult.text.toLowerCase(), "")
          .trim();
      }
    });
  }

  // Remove superlative words
  if (result.superlative) {
    remainingText = remainingText.replace(result.superlative.type, "").trim();
  }

  // Remove activity type words
  if (result.activityType) {
    for (const [alias, sportType] of Object.entries(SPORT_ALIASES)) {
      if (sportType === result.activityType) {
        remainingText = remainingText.replace(alias, "").trim();
        break;
      }
    }
  }

  // Remove common filter words
  const filterWords = [
    "my",
    "the",
    "from",
    "in",
    "during",
    "on",
    "activities",
    "activity",
  ];
  filterWords.forEach((word) => {
    remainingText = remainingText
      .replace(new RegExp(`\\b${word}\\b`, "g"), "")
      .trim();
  });

  // Clean up remaining text
  remainingText = remainingText.replace(/\s+/g, " ").trim();

  if (remainingText) {
    result.textSearch = remainingText;
    interpretationParts.push(`containing "${remainingText}"`);
  }

  // Generate interpretation
  if (interpretationParts.length > 0) {
    result.interpretation = interpretationParts.join(", ");
  }

  return result;
}

export function applyParsedFilter(
  activities: StravaActivity[],
  filter: ParsedFilter,
): StravaActivity[] {
  let filtered = [...activities];

  // Apply date range filter
  if (filter.dateRange) {
    filtered = filtered.filter((activity) => {
      const activityDate = new Date(activity.start_date_local);
      const activityDateStr = activityDate.toISOString().split("T")[0];

      if (
        filter.dateRange!.after &&
        activityDateStr < filter.dateRange!.after
      ) {
        return false;
      }

      if (
        filter.dateRange!.before &&
        activityDateStr > filter.dateRange!.before
      ) {
        return false;
      }

      return true;
    });
  }

  // Apply activity type filter
  if (filter.activityType) {
    filtered = filtered.filter(
      (activity) => activity.sport_type === filter.activityType,
    );
  }

  // Apply text search filter
  if (filter.textSearch) {
    const searchTerm = filter.textSearch.toLowerCase();
    filtered = filtered.filter((activity) =>
      activity.name.toLowerCase().includes(searchTerm),
    );
  }

  // Apply superlative sorting and filtering
  if (filter.superlative) {
    const { field } = filter.superlative;

    // Sort based on the superlative
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (field) {
        case "distance":
          aValue = a.distance;
          bValue = b.distance;
          break;
        case "time":
          aValue = a.moving_time;
          bValue = b.moving_time;
          break;
        case "elevation":
          aValue = a.total_elevation_gain || 0;
          bValue = b.total_elevation_gain || 0;
          break;
        case "date":
          aValue = new Date(a.start_date_local).getTime();
          bValue = new Date(b.start_date_local).getTime();
          break;
        default:
          return 0;
      }

      const config = SUPERLATIVE_PATTERNS[filter.superlative!.type];
      return config.direction === "desc" ? bValue - aValue : aValue - bValue;
    });

    // For superlatives, typically users want the top results
    // Limit to top 20 results for superlative queries to avoid overwhelming
    if (
      [
        "longest",
        "shortest",
        "fastest",
        "slowest",
        "highest",
        "lowest",
      ].includes(filter.superlative.type)
    ) {
      filtered = filtered.slice(0, 20);
    }
  }

  return filtered;
}

export function getSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [
    "My longest ride",
    "Rides from December 2021",
    "LoToJa 2021",
    "Running activities last month",
    "Fastest cycling this year",
    "Recent hikes",
    "Longest run last week",
    "Virtual rides",
    "Mountain bike rides",
    "Century",
    "Marathon",
    "Bike commute",
    "Weekend rides",
    "Morning runs",
  ];

  if (!query.trim()) {
    return suggestions.slice(0, 8);
  }

  // Filter suggestions based on current query
  const normalizedQuery = query.toLowerCase();
  const matching = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery
        .split(" ")
        .some((word) => suggestion.toLowerCase().includes(word)),
  );

  return matching.slice(0, 6);
}

export function interpretQuery(query: string): string {
  const parsed = parseNaturalLanguageQuery(query);

  if (!parsed.interpretation && !query.trim()) {
    return "";
  }

  if (!parsed.interpretation) {
    return `Searching by activity name: "${query}"`;
  }

  let interpretation = "Showing ";

  if (parsed.superlative) {
    interpretation += `${parsed.superlative.type} `;
  }

  if (parsed.activityType) {
    const activityName =
      Object.keys(SPORT_ALIASES).find(
        (key) => SPORT_ALIASES[key] === parsed.activityType,
      ) || parsed.activityType.toLowerCase();
    interpretation += `${activityName} activities `;
  } else {
    interpretation += "activities ";
  }

  if (parsed.dateRange) {
    // Helper function to safely format ISO date strings without timezone issues
    const formatDateSafe = (isoString: string) => {
      const [year, month, day] = isoString.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    };

    if (parsed.dateRange.after && parsed.dateRange.before) {
      interpretation += `from ${formatDateSafe(parsed.dateRange.after)} to ${formatDateSafe(parsed.dateRange.before)}`;
    } else if (parsed.dateRange.after) {
      interpretation += `since ${formatDateSafe(parsed.dateRange.after)}`;
    } else if (parsed.dateRange.before) {
      interpretation += `before ${formatDateSafe(parsed.dateRange.before)}`;
    }
  }

  if (parsed.textSearch) {
    interpretation += ` containing "${parsed.textSearch}"`;
  }

  return interpretation.trim();
}
