import { vocabularyList, allGroups, maxGroup } from "../data/vocabulary"; // Import necessary data

// --- Constants for Learned Criteria ---
// *** EXPORT THESE CONSTANTS ***
export const LEARNED_MIN_SEEN = 4;
export const LEARNED_RECENT_THRESHOLD = 0.75; // 75% correct in last 4
// *** Keep history key internal or export if needed elsewhere (currently not needed)
const LEARNED_HISTORY_KEY = "greekLearnedWordHistory_v1";

// --- Existing Functions (Modified where needed) ---

export const initializeStats = (items, keyField) => {
  if (!Array.isArray(items)) {
    console.error("initializeStats expected an array, received:", items);
    return {};
  }
  return items.reduce((acc, item) => {
    const key = item?.[keyField];
    if (key === undefined || key === null) {
      // console.warn("Skipping item with invalid key:", item);
      return acc; // Skip invalid items
    }
    acc[key] = {
      consecutiveCorrect: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      recentPerformance: [], // Track last 4 attempts (true/false)
      lastSeen: 0,
      // learned: false, // We calculate learned status dynamically now
    };
    return acc;
  }, {});
};

export const saveStats = (storageKey, stats) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(stats));
  } catch (error) {
    console.error(
      `Failed to save stats to localStorage key "${storageKey}":`,
      error
    );
  }
};

export const loadStats = (storageKey, defaultInitializer) => {
  const savedStats = localStorage.getItem(storageKey);
  let needsSave = false;
  try {
    const parsed = savedStats ? JSON.parse(savedStats) : null;
    if (
      parsed &&
      typeof parsed === "object" &&
      Object.keys(parsed).length > 0
    ) {
      const initialized = defaultInitializer();
      const initializedKeys = Object.keys(initialized);
      const loadedKeys = Object.keys(parsed);

      // Ensure all expected keys and properties exist
      initializedKeys.forEach((key) => {
        if (!parsed[key]) {
          // console.log(`Adding missing item ${key} to loaded stats for ${storageKey}`);
          parsed[key] = initialized[key];
          needsSave = true;
        } else {
          // Ensure all properties within the item exist
          Object.keys(initialized[key]).forEach((propKey) => {
            if (parsed[key][propKey] === undefined) {
              // console.log(`Adding missing property ${propKey} to ${key} in loaded stats for ${storageKey}`);
              parsed[key][propKey] = initialized[key][propKey];
              needsSave = true;
            }
          });
          // Ensure recentPerformance is an array
          if (!Array.isArray(parsed[key]?.recentPerformance)) {
            // console.log(`Fixing recentPerformance for ${key} in ${storageKey}`);
            parsed[key].recentPerformance = [];
            needsSave = true;
          }
        }
      });

      // Remove obsolete keys
      loadedKeys.forEach((key) => {
        if (!initialized[key]) {
          // console.log(`Removing obsolete item ${key} from loaded stats for ${storageKey}`);
          delete parsed[key];
          needsSave = true;
        }
      });

      if (needsSave) {
        // console.log(`Resaving stats for ${storageKey} after merging/fixing.`);
        saveStats(storageKey, parsed);
      }

      return parsed;
    }
  } catch (error) {
    console.error(
      `Failed to parse/merge stats from localStorage key "${storageKey}":`,
      error
    );
    localStorage.removeItem(storageKey);
  }
  // console.log(`Initializing default stats for ${storageKey}`);
  const defaultStats = defaultInitializer();
  saveStats(storageKey, defaultStats);
  return defaultStats;
};

// --- Learned Status Functions ---

/**
 * Checks if a specific word is considered "learned".
 * Criteria: Seen >= LEARNED_MIN_SEEN times AND Correct >= LEARNED_RECENT_THRESHOLD in the last 4 showings.
 */
export const isWordLearned = (wordKey, wordStats) => {
  const stats = wordStats?.[wordKey];
  if (!stats) return false;

  const seenCount = stats.totalAttempts;
  if (seenCount < LEARNED_MIN_SEEN) return false;

  // Take the last results up to LEARNED_MIN_SEEN count
  const recent = stats.recentPerformance.slice(-LEARNED_MIN_SEEN);
  if (recent.length === 0) return false; // Need some recent data

  const correctRecentCount = recent.filter((r) => r === true).length;
  const recentAccuracy = correctRecentCount / recent.length;

  // Check if accuracy meets the threshold based on the available recent attempts
  // (It needs to be >= threshold even if fewer than 4 attempts were considered)
  return recentAccuracy >= LEARNED_RECENT_THRESHOLD;
};

/**
 * Returns an array of word keys (Greek words) that are considered learned.
 */
export const getLearnedWords = (wordStats) => {
  // Ensure wordStats is an object before trying to get keys
  if (!wordStats || typeof wordStats !== "object") {
    return [];
  }
  return Object.keys(wordStats).filter((wordKey) =>
    isWordLearned(wordKey, wordStats)
  );
};

/**
 * Returns an array of group numbers where ALL words in that group are learned.
 */
export const getLearnedGroups = (wordStats) => {
  const learnedGroups = [];
  for (const groupNum of allGroups) {
    const wordsInGroup = vocabularyList.filter((w) => w.group === groupNum);
    if (wordsInGroup.length === 0) continue; // Skip empty groups

    const allLearned = wordsInGroup.every((word) =>
      isWordLearned(word.greek, wordStats)
    );
    if (allLearned) {
      learnedGroups.push(groupNum);
    }
  }
  return learnedGroups;
};

/**
 * Determines the current focus group (the first group not fully learned).
 */
export const getCurrentFocusGroup = (wordStats) => {
  const learnedGroups = getLearnedGroups(wordStats);
  const learnedGroupSet = new Set(learnedGroups);

  for (const groupNum of allGroups) {
    if (!learnedGroupSet.has(groupNum)) {
      // Ensure the group exists in vocabularyList before returning
      if (vocabularyList.some((w) => w.group === groupNum)) {
        return groupNum;
      }
    }
  }
  // If all groups are learned or no groups exist, return the max group number or 1
  return maxGroup > 0 ? maxGroup : 1;
};

// --- History Tracking ---

/**
 * Loads the learned word history from localStorage.
 * Returns an array of [timestamp, count] pairs, sorted by timestamp.
 */
export const loadLearnedWordHistory = () => {
  try {
    const historyJson = localStorage.getItem(LEARNED_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    if (Array.isArray(history)) {
      // Validate and sort
      return history
        .filter(
          (entry) =>
            Array.isArray(entry) &&
            entry.length === 2 &&
            typeof entry[0] === "number" &&
            typeof entry[1] === "number"
        )
        .sort((a, b) => a[0] - b[0]);
    }
  } catch (error) {
    console.error("Failed to load learned word history:", error);
    localStorage.removeItem(LEARNED_HISTORY_KEY); // Clear corrupted data
  }
  return []; // Return empty array on error or no data
};

/**
 * Saves a new entry to the learned word history if the count has changed.
 */
export const saveLearnedWordHistory = (learnedCount) => {
  try {
    const history = loadLearnedWordHistory();
    const lastEntry = history[history.length - 1];

    // Add new entry only if count changed or history is empty
    if (!lastEntry || lastEntry[1] !== learnedCount) {
      const newHistory = [...history, [Date.now(), learnedCount]];
      localStorage.setItem(LEARNED_HISTORY_KEY, JSON.stringify(newHistory));
    }
  } catch (error) {
    console.error("Failed to save learned word history:", error);
  }
};

/**
 * Resets the learned word history.
 */
export const resetLearnedWordHistory = () => {
  localStorage.removeItem(LEARNED_HISTORY_KEY);
};

// --- Weighted Selection (Modified) ---

export const calculateWeight = (
  item,
  statsObj,
  keyField,
  isWord,
  isLearnedStruggled = false
) => {
  const itemKey = item?.[keyField];
  if (!itemKey && itemKey !== 0) return 0.01; // Handle null/undefined/empty keys, allow 0

  const defaultStat = {
    correctAttempts: 0,
    totalAttempts: 0,
    recentPerformance: [],
    lastSeen: 0,
    consecutiveCorrect: 0,
  };
  const itemStats = statsObj[itemKey] || defaultStat;

  // Base accuracy calculation
  const accuracy =
    itemStats.totalAttempts > 0
      ? itemStats.correctAttempts / itemStats.totalAttempts
      : 0.5; // Default to 0.5 if never seen

  // Factor in recent performance (more misses = higher weight)
  // Ensure recentPerformance is an array
  const recentPerf = Array.isArray(itemStats.recentPerformance)
    ? itemStats.recentPerformance
    : [];
  const recentMisses = recentPerf.filter((r) => !r).length;
  const recentFactor = 1 + recentMisses * 0.6; // Increase weight for recent misses

  // Factor in time since last seen (longer ago = higher weight)
  const timeSinceSeenFactor = Math.max(
    1,
    (Date.now() - (itemStats.lastSeen || 0)) / (1000 * 60 * (isWord ? 15 : 5))
  );

  // Factor in consecutive correct answers (more consecutive = lower weight)
  const consecutiveBonus = Math.max(
    0.1,
    1 - (itemStats.consecutiveCorrect || 0) * (isWord ? 0.15 : 0.1)
  ); // Slightly reduced penalty for words

  // Calculate base weight
  let weight =
    (1 - accuracy + 0.5) *
    recentFactor *
    timeSinceSeenFactor *
    consecutiveBonus;

  // Apply boost if it's a struggled learned word being selected for review
  if (isLearnedStruggled) {
    weight *= 1.5; // Increase weight for struggled learned words
  }

  // Prevent zero weight
  return Math.max(0.01, weight);
};

export const selectWeightedRandom = (
  items,
  statsObj,
  keyField,
  isWord,
  // focusGroupNum = null, // Focus group handled in App.js logic now
  prioritizeStruggledLearned = false // New flag
) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  const weights = items
    .map((item) => {
      // Determine if this is a struggled learned word (if flag is set)
      const itemKey = item?.[keyField];
      // Check if stats exist and totalAttempts > 0 before calculating struggle %
      const statsExist = itemKey !== undefined && statsObj[itemKey];
      const hasAttempts = statsExist && statsObj[itemKey].totalAttempts > 0;

      const isStruggled =
        prioritizeStruggledLearned &&
        statsExist &&
        isWordLearned(itemKey, statsObj) && // Must be learned first
        hasAttempts && // Must have attempts to calc accuracy
        statsObj[itemKey].correctAttempts / statsObj[itemKey].totalAttempts <
          0.85; // Example struggle threshold

      const weight = calculateWeight(
        item,
        statsObj,
        keyField,
        isWord,
        isStruggled
      );
      return { item, weight };
    })
    .filter((w) => w.item && w.weight > 0); // Ensure item is valid and weight > 0

  if (weights.length === 0) {
    // Fallback: return random item from original list if all weights end up zero/filtered
    console.warn(
      "All item weights were zero or filtered out. Selecting random item from pool."
    );
    return items[Math.floor(Math.random() * items.length)];
  }

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight <= 0) {
    // Fallback: return random item if totalWeight is zero
    console.warn("Total weight is zero. Selecting random item from pool.");
    return items[Math.floor(Math.random() * items.length)];
  }

  const randomVal = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  for (const w of weights) {
    cumulativeWeight += w.weight;
    if (randomVal <= cumulativeWeight) {
      return w.item;
    }
  }
  // Final fallback (should rarely be reached)
  console.warn(
    "Weighted random selection fell through. Returning last weighted item."
  );
  return (
    weights[weights.length - 1]?.item ||
    items[Math.floor(Math.random() * items.length)]
  );
};

// --- Helper to reset all stats and history ---
export const resetAllProgress = () => {
  localStorage.removeItem("greekLetterStats_v2");
  localStorage.removeItem("greekWordStats_v3");
  resetLearnedWordHistory();
  console.log("All stats and learned history reset.");
};

// *** Ensure all exported functions/constants are listed correctly here if using specific exports somewhere else ***
// (Although the current `export const ...` syntax handles this fine)
