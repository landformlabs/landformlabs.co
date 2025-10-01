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
  distanceRange?: {
    min?: number; // in meters
    max?: number; // in meters
  };
  durationRange?: {
    min?: number; // in seconds
    max?: number; // in seconds
  };
  location?: string;
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
  bikes: "Ride",
  biking: "Ride",
  cycling: "Ride",
  cycle: "Ride",
  cycles: "Ride",
  ride: "Ride",
  rides: "Ride",
  riding: "Ride",
  running: "Run",
  run: "Run",
  runs: "Run",
  jog: "Run",
  jogs: "Run",
  jogging: "Run",
  hike: "Hike",
  hikes: "Hike",
  hiking: "Hike",
  walk: "Walk",
  walks: "Walk",
  walking: "Walk",
  swim: "Swim",
  swims: "Swim",
  swimming: "Swim",
  workout: "Workout",
  workouts: "Workout",
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

// Distance patterns with conversions to meters
// IMPORTANT: Order matters! Longer patterns first to avoid partial matches
const DISTANCE_PATTERNS: Record<string, { min: number; max?: number; description: string }> = {
  "metric century": { min: 95000, max: 110000, description: "metric century (100 km)" }, // 95-110 km tolerance
  "half century": { min: 75000, max: 90000, description: "half century (50 miles)" }, // 75-90 km tolerance
  "half marathon": { min: 19000, max: 23000, description: "half marathon (13.1 miles)" }, // ~19-23 km tolerance
  "half-marathon": { min: 19000, max: 23000, description: "half marathon (13.1 miles)" }, // ~19-23 km tolerance
  century: { min: 155000, max: 170000, description: "century (100 miles)" }, // 155-170 km tolerance
  marathon: { min: 40000, max: 44000, description: "marathon (26.2 miles)" }, // 40-44 km tolerance
  ultra: { min: 80000, max: undefined, description: "ultra (50+ miles)" }, // 50+ miles (no max)
  "10k": { min: 9000, max: 11000, description: "10K" }, // ~10 km with tolerance
  "5k": { min: 4500, max: 5500, description: "5K" }, // ~5 km with tolerance
};

// Location keywords
const LOCATION_KEYWORDS = [
  "in",
  "near",
  "at",
  "around",
  "from",
  "to",
];

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

  // Parse numeric distance patterns (e.g., "over 100 miles", "longer than 50km", "between 10 and 20 miles")
  const numericDistancePatterns = [
    // "X+ miles/km" (e.g., "25+ miles")
    /(\d+(?:\.\d+)?)\+\s*(miles?|mi|km|kilometers?|k)/i,
    // "over X miles/km" or "more than X miles/km" or "> X miles/km"
    /(?:over|more\s+than|greater\s+than|>)\s+(\d+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?|k)/i,
    // "under X miles/km" or "less than X miles/km" or "< X miles/km"
    /(?:under|less\s+than|shorter\s+than|<)\s+(\d+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?|k)/i,
    // "between X and Y miles/km"
    /between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?|k)/i,
    // "X-Y miles/km" (but not matching "X+ miles")
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?|k)/i,
    // "at least X miles/km"
    /at\s+least\s+(\d+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?|k)/i,
  ];

  for (const pattern of numericDistancePatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      const isMiles = match[match.length - 1].toLowerCase().startsWith('mi');
      const isKm = match[match.length - 1].toLowerCase().startsWith('k');

      if (pattern.source.includes('\\+')) {
        // "X+" pattern (e.g., "25+ miles")
        const num = parseFloat(match[1]);
        result.distanceRange = {
          min: isMiles ? num * 1609.34 : (isKm ? num * 1000 : num),
        };
        interpretationParts.push(`${num}+ ${isMiles ? 'miles' : 'km'}`);
      } else if (pattern.source.includes('between') || (pattern.source.includes('-') && !pattern.source.includes('\\+'))) {
        // Range query
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);
        const min = Math.min(num1, num2);
        const max = Math.max(num1, num2);

        result.distanceRange = {
          min: isMiles ? min * 1609.34 : (isKm ? min * 1000 : min),
          max: isMiles ? max * 1609.34 : (isKm ? max * 1000 : max),
        };
        interpretationParts.push(`${min}-${max} ${isMiles ? 'miles' : 'km'}`);
      } else if (pattern.source.includes('under') || pattern.source.includes('less') || pattern.source.includes('shorter') || pattern.source.includes('<')) {
        // Maximum distance
        const num = parseFloat(match[1]);
        result.distanceRange = {
          max: isMiles ? num * 1609.34 : (isKm ? num * 1000 : num),
        };
        interpretationParts.push(`under ${num} ${isMiles ? 'miles' : 'km'}`);
      } else {
        // Minimum distance (over, more than, at least, >)
        const num = parseFloat(match[1]);
        result.distanceRange = {
          min: isMiles ? num * 1609.34 : (isKm ? num * 1000 : num),
        };
        interpretationParts.push(`over ${num} ${isMiles ? 'miles' : 'km'}`);
      }
      break;
    }
  }

  // Parse numeric duration patterns FIRST (before distance and activity type)
  // This prevents "longer than" from interfering with activity type detection
  const numericDurationPatterns = [
    // "over/longer than/more than X hours/minutes"
    /(?:over|longer\s+than|more\s+than|greater\s+than|>)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)/i,
    // "under/shorter than/less than X hours/minutes"
    /(?:under|shorter\s+than|less\s+than|<)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)/i,
    // "between X and Y hours/minutes"
    /between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)/i,
    // "X-Y hours/minutes"
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)/i,
    // "at least X hours/minutes"
    /at\s+least\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)/i,
  ];

  for (const pattern of numericDurationPatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      const unit = match[match.length - 1].toLowerCase();
      const isHours = unit.startsWith('h');
      const isMinutes = unit.startsWith('m');

      if (pattern.source.includes('between') || pattern.source.includes('-')) {
        // Range query
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);
        const min = Math.min(num1, num2);
        const max = Math.max(num1, num2);

        result.durationRange = {
          min: isHours ? min * 3600 : (isMinutes ? min * 60 : min),
          max: isHours ? max * 3600 : (isMinutes ? max * 60 : max),
        };
        interpretationParts.push(`${min}-${max} ${isHours ? 'hours' : 'minutes'}`);
      } else if (pattern.source.includes('under') || pattern.source.includes('less') || pattern.source.includes('shorter') || pattern.source.includes('<')) {
        // Maximum duration
        const num = parseFloat(match[1]);
        result.durationRange = {
          max: isHours ? num * 3600 : (isMinutes ? num * 60 : num),
        };
        interpretationParts.push(`under ${num} ${isHours ? 'hours' : 'minutes'}`);
      } else {
        // Minimum duration (over, more than, at least, >)
        const num = parseFloat(match[1]);
        result.durationRange = {
          min: isHours ? num * 3600 : (isMinutes ? num * 60 : num),
        };
        interpretationParts.push(`over ${num} ${isHours ? 'hours' : 'minutes'}`);
      }
      break;
    }
  }

  // Parse named distance patterns (century, marathon, etc.)
  if (!result.distanceRange) {
    for (const [pattern, config] of Object.entries(DISTANCE_PATTERNS)) {
      if (normalizedQuery.includes(pattern)) {
        result.distanceRange = {
          min: config.min,
          max: config.max,
        };
        interpretationParts.push(config.description);

        // Infer activity type from distance pattern if not already specified
        if (!result.activityType) {
          // Marathon/half-marathon typically means running
          if (pattern.includes("marathon") || pattern === "5k" || pattern === "10k") {
            result.activityType = "Run";
            interpretationParts.push("run activities");
          }
          // Century typically means cycling
          else if (pattern.includes("century")) {
            result.activityType = "Ride";
            interpretationParts.push("ride activities");
          }
        }

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

  // Parse location (but avoid matching dates)
  const dateWords = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "last", "this", "next", "week", "month", "year", "day", "today", "yesterday", "tomorrow"];

  for (const keyword of LOCATION_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\s+([a-zA-Z\\s]+?)(?:\\s+(?:on|from|in|during|with|activities|activity|last|this|next)|$)`, "i");
    const match = normalizedQuery.match(regex);
    if (match && match[1]) {
      const potentialLocation = match[1].trim().toLowerCase();
      // Skip if it looks like a date reference
      const isDateReference = dateWords.some(dateWord => potentialLocation.includes(dateWord));
      if (!isDateReference) {
        result.location = match[1].trim();
        interpretationParts.push(`in/near ${result.location}`);
        break;
      }
    }
  }

  // Extract remaining text for name searching (remove parsed parts)
  let remainingText = normalizedQuery;

  // Remove duration pattern words FIRST (they contain words like "longer" that might confuse other parsing)
  if (result.durationRange) {
    const numericDurationRemovalPatterns = [
      /(?:over|longer\s+than|more\s+than|greater\s+than|>)\s+\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)/gi,
      /(?:under|shorter\s+than|less\s+than|<)\s+\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)/gi,
      /between\s+\d+(?:\.\d+)?\s+and\s+\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)/gi,
      /\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)/gi,
      /at\s+least\s+\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)/gi,
    ];

    for (const pattern of numericDurationRemovalPatterns) {
      remainingText = remainingText.replace(pattern, "").trim();
    }
  }

  // Remove distance pattern words
  if (result.distanceRange) {
    // Remove named patterns
    for (const pattern of Object.keys(DISTANCE_PATTERNS)) {
      remainingText = remainingText.replace(pattern, "").trim();
    }

    // Remove numeric distance patterns
    const numericDistanceRemovalPatterns = [
      /\d+(?:\.\d+)?\+\s*(?:miles?|mi|km|kilometers?|k)/gi,
      /(?:over|more\s+than|greater\s+than|>)\s+\d+(?:\.\d+)?\s*(?:miles?|mi|km|kilometers?|k)/gi,
      /(?:under|less\s+than|shorter\s+than|<)\s+\d+(?:\.\d+)?\s*(?:miles?|mi|km|kilometers?|k)/gi,
      /between\s+\d+(?:\.\d+)?\s+and\s+\d+(?:\.\d+)?\s*(?:miles?|mi|km|kilometers?|k)/gi,
      /\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*(?:miles?|mi|km|kilometers?|k)/gi,
      /at\s+least\s+\d+(?:\.\d+)?\s*(?:miles?|mi|km|kilometers?|k)/gi,
    ];

    for (const pattern of numericDistanceRemovalPatterns) {
      remainingText = remainingText.replace(pattern, "").trim();
    }
  }

  // Remove activity type words EARLY (before date removal which might leave fragments)
  if (result.activityType) {
    for (const [alias, sportType] of Object.entries(SPORT_ALIASES)) {
      if (sportType === result.activityType) {
        // Use word boundary regex to avoid partial matches
        const aliasRegex = new RegExp(`\\b${alias}\\b`, "gi");
        remainingText = remainingText.replace(aliasRegex, "").trim();
      }
    }
  }

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

  // Remove location words
  if (result.location) {
    for (const keyword of LOCATION_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\s+${result.location}\\b`, "gi");
      remainingText = remainingText.replace(regex, "").trim();
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
    "near",
    "at",
    "around",
    "to",
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

  // Apply distance range filter
  if (filter.distanceRange) {
    filtered = filtered.filter((activity) => {
      if (filter.distanceRange!.min && activity.distance < filter.distanceRange!.min) {
        return false;
      }
      if (filter.distanceRange!.max && activity.distance > filter.distanceRange!.max) {
        return false;
      }
      return true;
    });
  }

  // Apply duration range filter
  if (filter.durationRange) {
    filtered = filtered.filter((activity) => {
      if (filter.durationRange!.min && activity.moving_time < filter.durationRange!.min) {
        return false;
      }
      if (filter.durationRange!.max && activity.moving_time > filter.durationRange!.max) {
        return false;
      }
      return true;
    });
  }

  // Apply location filter (search in activity name)
  if (filter.location) {
    const locationTerm = filter.location.toLowerCase();
    filtered = filtered.filter((activity) =>
      activity.name.toLowerCase().includes(locationTerm),
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
    "Fastest century ride",
    "Rides from December 2021",
    "Marathon runs",
    "Running activities last month",
    "Fastest cycling this year",
    "Recent hikes",
    "Longest run last week",
    "Runs in Saint George",
    "Century rides in October",
    "My fastest marathon",
    "Half marathon races",
    "Mountain bike rides",
    "Virtual rides",
    "Bike commute",
    "Weekend rides",
    "Morning runs",
    "Metric century",
    "Ultra runs",
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

  if (parsed.distanceRange) {
    const distanceDesc = Object.values(DISTANCE_PATTERNS).find(
      (p) => p.min === parsed.distanceRange?.min
    )?.description;
    if (distanceDesc) {
      interpretation += `${distanceDesc} `;
    }
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

  if (parsed.location) {
    interpretation += ` in/near ${parsed.location}`;
  }

  if (parsed.textSearch) {
    interpretation += ` containing "${parsed.textSearch}"`;
  }

  return interpretation.trim();
}
