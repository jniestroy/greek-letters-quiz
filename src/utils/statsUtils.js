// --- Configuration ---
// !! IMPORTANT: Replace with the actual IP/hostname of the machine running the Python server !!
// Use localhost if running BOTH React dev server AND Flask server on the SAME machine.
// Use the specific IP (like 100.90.36.56) if accessing from another device (like your phone).
const FLASK_SERVER_IP = "100.90.36.56"; // Or "localhost" or "127.0.0.1"
const FLASK_SERVER_PORT = 8000;
const API_BASE_URL = `http://${FLASK_SERVER_IP}:${FLASK_SERVER_PORT}/api`;

// --- Constants needed by UI (if any - less needed now) ---
export const LEARNED_MIN_SEEN = 4; // Keep if UI needs it? Backend drives logic now.
export const LEARNED_RECENT_THRESHOLD = 0.75; // Keep if UI needs it? Backend drives logic.

// --- API Helper Functions ---

/** Generic Fetch wrapper with error handling */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API Call: ${options.method || "GET"} ${url}`);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const responseData = await response.json(); // Try to parse JSON regardless of status

    if (!response.ok) {
      // Use error message from backend response if available
      const errorMessage =
        responseData?.error ||
        `HTTP error! status: ${response.status} ${response.statusText}`;
      console.error(`API Error (${url}): ${errorMessage}`, responseData);
      throw new Error(errorMessage); // Throw error to be caught by calling function
    }

    // console.log(`API Success (${url}):`, responseData);
    return responseData; // Return successful JSON data
  } catch (error) {
    // Catch fetch errors (network issues) or errors thrown from !response.ok
    console.error(`API Exception (${url}):`, error);
    // Re-throw the error so the calling component knows something went wrong
    throw error;
  }
}

// --- Functions to Interact with Backend API ---

export async function fetchStatsOverview() {
  return fetchApi("/stats_overview");
}

export async function fetchProgressHistory() {
  return fetchApi("/progress_history");
}

export async function fetchNextItem(
  appMode,
  isReviewMode,
  reviewQuestionsRemaining
) {
  // Encode parameters safely in URL
  const params = new URLSearchParams({
    appMode,
    isReviewMode: isReviewMode.toString(),
    reviewQuestionsRemaining: reviewQuestionsRemaining.toString(),
  });
  return fetchApi(`/next_item?${params.toString()}`);
}

export async function submitAnswer(payload) {
  // payload should contain:
  // itemKey, itemType, userNameInput?, userSoundInput?,
  // userPronunciationInput?, userMeaningInput?,
  // isReviewMode, reviewQuestionsRemaining (status *before* submit)
  return fetchApi("/submit_answer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetAllProgress() {
  // No need to clear localStorage anymore
  return fetchApi("/reset", {
    method: "POST",
  });
}

export async function fetchDetailedStats() {
  return fetchApi("/detailed_stats"); // Call the new endpoint
}

export async function fetchNextReviewItem() {
  return fetchApi("/next_review_item"); // Calls the new endpoint
}

export async function renameGreekWord(oldGreekWord, newGreekWord) {
  const encodedOldWord = encodeURIComponent(oldGreekWord);
  return fetchApi(`/word_rename/${encodedOldWord}`, {
    method: "POST",
    body: JSON.stringify({ new_greek: newGreekWord }),
  });
}

export async function fetchAllEditableWords() {
  return fetchApi("/editable_words");
}

export async function fetchWordDetails(greekWord) {
  // Encode the Greek word properly for the URL path
  const encodedWord = encodeURIComponent(greekWord);
  return fetchApi(`/word_details/${encodedWord}`);
}

export async function updateWordDetails(greekWord, updatedData) {
  // updatedData should be an object like { english: "...", pronunciation: "..." }
  const encodedWord = encodeURIComponent(greekWord);
  return fetchApi(`/word_details/${encodedWord}`, {
    method: "PUT",
    body: JSON.stringify(updatedData),
  });
}

export async function resetWordStats(greekWord) {
  const encodedWord = encodeURIComponent(greekWord);
  return fetchApi(`/word_details/${encodedWord}/reset_stats`, {
    method: "POST", // No body needed for this action
  });
}

// --- Placeholder/Removed Functions ---
// These functions are no longer needed as the logic lives on the backend.
// Keep them commented or remove them entirely.

// export const initializeStats = (items, keyField) => { ... }; // Logic moved
// export const saveStats = (storageKey, stats) => { ... }; // Logic moved
// export const loadStats = (storageKey, defaultInitializer) => { ... }; // Logic moved
// export const isWordLearned = (wordKey, wordStats) => { ... }; // Logic moved
// export const getLearnedWords = (wordStats) => { ... }; // Logic moved
// export const getLearnedGroups = (wordStats) => { ... }; // Logic moved
// export const getCurrentFocusGroup = (wordStats) => { ... }; // Logic moved
// export const loadLearnedWordHistory = () => { ... }; // Logic moved
// export const saveLearnedWordHistory = (learnedCount) => { ... }; // Logic moved
// export const resetLearnedWordHistory = () => { ... }; // Logic moved
// export const calculateWeight = (...) => { ... }; // Logic moved
// export const selectWeightedRandom = (...) => { ... }; // Logic moved

console.log(`statsUtils configured for API: ${API_BASE_URL}`);
