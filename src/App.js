import React, { useState, useEffect, useCallback, useRef } from "react";

// API Utility functions
import {
  fetchStatsOverview,
  fetchProgressHistory,
  fetchNextItem, // For quiz/vocabFocus modes
  fetchNextReviewItem, // For dedicated review mode
  submitAnswer,
  resetAllProgress,
  fetchDetailedStats,
} from "./utils/statsUtils"; // Adjust path as needed

// Components
import QuizHeader from "./components/QuizHeader";
import QuestionDisplay from "./components/QuestionDisplay";
import AnswerInput from "./components/AnswerInput";
import Feedback from "./components/Feedback";
import PerformanceTables from "./components/PerformanceTables";
import ProgressPlot from "./components/ProgressPlot";
import WordEditor from "./components/WordEditor"; // Import the word editor component
// Optional: import an icon if you use one for the settings button
// import SettingsIcon from './components/SettingsIcon';

// CSS
import "./greek-quiz.css"; // Main CSS file
import "./App.css"; // Specific styles for App layout if needed

function App() {
  // --- State Variables ---
  const [appMode, setAppMode] = useState("quiz"); // 'quiz', 'vocabFocus', or 'review'
  const [currentItemData, setCurrentItemData] = useState(null); // Holds { item, itemType, questionText, ... }
  const [isLoading, setIsLoading] = useState(true); // For loading indicators
  const [error, setError] = useState(null); // For displaying errors

  // Input fields state
  const [userNameInput, setUserNameInput] = useState("");
  const [userSoundInput, setUserSoundInput] = useState("");
  const [userPronunciationInput, setUserPronunciationInput] = useState("");
  const [userMeaningInput, setUserMeaningInput] = useState("");

  // Feedback and answer display state
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null); // Holds { isCorrect, feedbackMessage, correctAnswer, ... }

  // Stats and History State
  const [overviewStats, setOverviewStats] = useState({
    totalLetterScore: 0,
    totalLetterQuestions: 0,
    totalWordScore: 0,
    totalWordQuestions: 0,
    learnedWordsCount: 0,
    learnedGroupsCount: 0,
    currentFocusGroup: null,
  });
  const [learnedWordHistory, setLearnedWordHistory] = useState([]); // For the plot [[ts, count], ...]
  const [detailedLetterStats, setDetailedLetterStats] = useState({}); // For performance table
  const [detailedWordStats, setDetailedWordStats] = useState({}); // For performance table

  // *Automatic* Review Mode State (triggered after focus group completion)
  const [isReviewMode, setIsReviewMode] = useState(false); // Is an *automatic* review session active?
  const [reviewQuestionsRemaining, setReviewQuestionsRemaining] = useState(0); // How many left in *automatic* session?

  // State for Word Editor Visibility
  const [showWordEditor, setShowWordEditor] = useState(false); // State to toggle editor visibility

  // --- Ref for Auto-Focus ---
  const firstInputRef = useRef(null); // Create the ref for the first input

  // --- Core Data Fetching Functions ---

  const getNextQuestion = useCallback(
    async (currentAppMode) => {
      console.log(
        `Requesting next item for mode: ${currentAppMode}. (Automatic review session state: ${isReviewMode}, ${reviewQuestionsRemaining})`
      );
      setIsLoading(true);
      setError(null); // Clear previous errors
      setShowAnswer(false);
      setFeedbackData(null);
      setUserNameInput("");
      setUserSoundInput("");
      setUserPronunciationInput("");
      setUserMeaningInput("");

      try {
        let nextItemData;
        // Conditional fetch based on appMode
        if (currentAppMode === "review") {
          console.log("Fetching from /api/next_review_item");
          nextItemData = await fetchNextReviewItem();
        } else {
          // Use existing endpoint for 'quiz' and 'vocabFocus'
          console.log(
            `Fetching from /api/next_item (Auto Review State: ${isReviewMode}, Remaining: ${reviewQuestionsRemaining})`
          );
          nextItemData = await fetchNextItem(
            currentAppMode,
            isReviewMode,
            reviewQuestionsRemaining
          );
        }

        setCurrentItemData(nextItemData);

        // Update automatic review session state ONLY if NOT in dedicated review mode
        if (currentAppMode !== "review") {
          setIsReviewMode(nextItemData.isReviewMode);
          setReviewQuestionsRemaining(nextItemData.reviewQuestionsRemaining);
          console.log(
            `Automatic review session state updated: ${nextItemData.isReviewMode}, ${nextItemData.reviewQuestionsRemaining}`
          );
        } else {
          // Ensure automatic review state is off when in dedicated review mode
          setIsReviewMode(false);
          setReviewQuestionsRemaining(0);
        }

        console.log("Received next item:", nextItemData);
      } catch (err) {
        console.error("Failed to fetch next item:", err);
        // Handle specific "no learned words" error for review mode
        if (
          currentAppMode === "review" &&
          err.message &&
          err.message.includes("No learned words")
        ) {
          setError(
            "No learned words available for review yet. Learn some words in 'Vocab Focus' mode first!"
          );
          setCurrentItemData(null); // Prevent rendering question area
        } else {
          setError(
            `Failed to load next question: ${
              err.message || "Server communication error"
            }. Please check the backend and refresh.`
          );
          setCurrentItemData(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isReviewMode, reviewQuestionsRemaining] // Dependencies for using these states in fetchNextItem
  );

  // --- Initial Data Load (useEffect) ---
  useEffect(() => {
    async function loadInitialData() {
      console.log("Loading initial application data...");
      setIsLoading(true);
      setError(null);
      try {
        const [overview, history, detailedStatsData] = await Promise.all([
          fetchStatsOverview(),
          fetchProgressHistory(),
          fetchDetailedStats(),
        ]);
        setOverviewStats(overview);
        setLearnedWordHistory(history);
        setDetailedLetterStats(detailedStatsData.letterStats || {});
        setDetailedWordStats(detailedStatsData.wordStats || {});
        console.log("Initial data loaded.");
        // Fetch first question for default 'quiz' mode
        await getNextQuestion("quiz");
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError(
          `Failed to load initial data: ${
            err.message || "Server unavailable"
          }. Please ensure the backend is running and refresh.`
        );
        // Set default empty states on error
        setOverviewStats({
          totalLetterScore: 0,
          totalLetterQuestions: 0,
          totalWordScore: 0,
          totalWordQuestions: 0,
          learnedWordsCount: 0,
          learnedGroupsCount: 0,
          currentFocusGroup: null,
        });
        setLearnedWordHistory([]);
        setDetailedLetterStats({});
        setDetailedWordStats({});
        setCurrentItemData(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load depends only on component mount

  // --- Event Handlers ---

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentItemData || showAnswer || isLoading) return;

      setIsLoading(true);
      setError(null);

      const { item, itemType } = currentItemData;
      const itemKey = itemType === "letter" ? item?.letter : item?.greek;
      if (!itemKey) {
        console.error("Cannot submit, item key missing.");
        setError("Internal error: Missing item key.");
        setIsLoading(false);
        return;
      }

      // Pass the *current* appMode to the backend
      const payload = {
        itemKey,
        itemType,
        userNameInput,
        userSoundInput,
        userPronunciationInput,
        userMeaningInput,
        appMode, // Send the current mode
        // Send the state of the *automatic* review session before submit
        isReviewMode,
        reviewQuestionsRemaining,
      };
      console.log("Submitting answer:", payload);

      try {
        const result = await submitAnswer(payload);
        console.log("Submit Answer Response:", result);
        setFeedbackData(result);
        setShowAnswer(true);
        setOverviewStats(result.updatedOverview);

        // Update automatic review state based on response from backend
        setIsReviewMode(result.nextReviewStatus.isReviewMode);
        setReviewQuestionsRemaining(
          result.nextReviewStatus.reviewQuestionsRemaining
        );
        console.log(
          `Next *automatic* review state set: Mode=${result.nextReviewStatus.isReviewMode}, Remaining=${result.nextReviewStatus.reviewQuestionsRemaining}`
        );

        // Refresh stats/history in background
        fetchDetailedStats()
          .then((data) => {
            setDetailedLetterStats(data.letterStats || {});
            setDetailedWordStats(data.wordStats || {});
          })
          .catch((err) =>
            console.error("Failed to refresh detailed stats:", err)
          );
        fetchProgressHistory()
          .then(setLearnedWordHistory)
          .catch((err) => console.error("Failed to refresh history:", err));
      } catch (err) {
        console.error("Failed to submit answer:", err);
        setError(
          `Failed to submit answer: ${
            err.message || "Server communication error"
          }. Please try again.`
        );
        setShowAnswer(false);
        setFeedbackData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [
      // Dependencies for submit
      currentItemData,
      showAnswer,
      isLoading,
      userNameInput,
      userSoundInput,
      userPronunciationInput,
      userMeaningInput,
      appMode,
      isReviewMode,
      reviewQuestionsRemaining,
    ]
  );

  const handleNextQuestion = useCallback(() => {
    // Fetch the next question based on the CURRENT appMode
    getNextQuestion(appMode);
  }, [getNextQuestion, appMode]); // Depends on the fetching function and current mode

  const resetStatsHandler = useCallback(async () => {
    if (
      window.confirm(
        "WARNING: Reset ALL server progress? This cannot be undone."
      )
    ) {
      setIsLoading(true);
      setError(null);
      try {
        await resetAllProgress();
        console.log("Reset successful. Reloading...");
        setFeedbackData(null);
        setShowAnswer(false);
        // Reset automatic review state as well
        setIsReviewMode(false);
        setReviewQuestionsRemaining(0);
        const [overview, history, detailedStatsData] = await Promise.all([
          fetchStatsOverview(),
          fetchProgressHistory(),
          fetchDetailedStats(),
        ]);
        setOverviewStats(overview);
        setLearnedWordHistory(history);
        setDetailedLetterStats(detailedStatsData.letterStats || {});
        setDetailedWordStats(detailedStatsData.wordStats || {});
        // Reset to default 'quiz' mode after full reset
        setAppMode("quiz");
        await getNextQuestion("quiz"); // Start fresh in quiz mode
      } catch (err) {
        console.error("Failed to reset progress:", err);
        setError(`Failed to reset progress: ${err.message || "Server error"}.`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [getNextQuestion]); // Depends on getNextQuestion for reload

  // Handles mode changes from the QuizHeader
  const changeMode = useCallback(
    (newMode) => {
      if (appMode !== newMode) {
        console.log(`Changing mode from ${appMode} to ${newMode}`);
        setAppMode(newMode);
        // Reset automatic review session state when changing mode manually
        setIsReviewMode(false);
        setReviewQuestionsRemaining(0);
        // Fetch item for the newly selected mode
        getNextQuestion(newMode);
      }
    },
    [appMode, getNextQuestion] // Depends on current mode and fetching function
  );

  // Callback from WordEditor when stats for a single word are reset
  const handleStatsResetUpdate = useCallback((updatedOverview) => {
    console.log(
      "Updating overview stats after reset from WordEditor:",
      updatedOverview
    );
    setOverviewStats(updatedOverview);
    // Refresh history as learned count might change
    fetchProgressHistory()
      .then(setLearnedWordHistory)
      .catch((err) =>
        console.error("Failed to refresh history after stats reset:", err)
      );
    // Also refresh detailed stats table
    fetchDetailedStats()
      .then((data) => {
        setDetailedLetterStats(data.letterStats || {});
        setDetailedWordStats(data.wordStats || {});
      })
      .catch((err) =>
        console.error("Failed to refresh detailed stats after reset:", err)
      );
  }, []); // No dependencies needed if fetch functions are stable

  // Callback from WordEditor when a word is renamed
  const handleWordRenamed = useCallback(
    (oldKey, newKey) => {
      console.log(`Word renamed in editor: ${oldKey} -> ${newKey}`);
      // Refresh detailed stats to reflect the rename in the performance tables
      fetchDetailedStats()
        .then((data) => {
          setDetailedLetterStats(data.letterStats || {});
          setDetailedWordStats(data.wordStats || {});
        })
        .catch((err) =>
          console.error("Failed to refresh detailed stats after rename:", err)
        );

      // If the currently displayed quiz item was the one renamed, fetch a new one
      if (
        currentItemData?.itemType === "word" &&
        currentItemData?.item?.greek === oldKey
      ) {
        console.warn(
          "The current quiz item was just renamed. Fetching a new item for the current mode."
        );
        handleNextQuestion(); // Fetch a new question for the current mode
      }
    },
    [currentItemData, handleNextQuestion]
  ); // Add dependencies

  // --- Auto-Focus Effect ---
  useEffect(() => {
    if (currentItemData && !showAnswer && firstInputRef.current) {
      const timerId = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timerId);
    }
  }, [currentItemData, showAnswer]); // Re-run when item changes or answer visibility changes

  // --- Derived values for rendering ---
  const displayItemKey = currentItemData?.item
    ? currentItemData.itemType === "letter"
      ? currentItemData.item.letter
      : currentItemData.item.greek
    : "";
  // Adjust question text display based on mode or error
  const questionText = error // Show error prominently if it prevents loading
    ? ""
    : currentItemData?.questionText ||
      (isLoading ? "Loading..." : "Select a mode.");

  const itemType = currentItemData?.itemType || null;
  const groupNumber = itemType === "word" ? currentItemData?.item?.group : null;
  const isOverallCorrect = feedbackData ? feedbackData.isCorrect : null;

  // --- Render Logic ---
  if (
    isLoading &&
    !currentItemData &&
    !error &&
    learnedWordHistory.length === 0
  ) {
    return (
      <div className="quiz-container loading">
        <h2>Loading Greek Quiz...</h2>
      </div>
    );
  }
  // Show general error if it occurred during initial load
  if (error && learnedWordHistory.length === 0 && !currentItemData) {
    return (
      <div className="quiz-container error">
        <h2>Application Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Refresh</button>{" "}
        <button onClick={resetStatsHandler}>Reset Progress</button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* Settings Button/Icon to trigger WordEditor */}
      <div className="settings-trigger">
        <button
          onClick={() => setShowWordEditor(true)}
          title="Open Word Editor & Settings"
        >
          {/* Use text or an icon component */}
          ⚙️ Settings
        </button>
      </div>

      <QuizHeader
        appMode={appMode}
        changeMode={changeMode}
        displayFocusGroup={overviewStats.currentFocusGroup}
        totalLetterScore={overviewStats.totalLetterScore}
        totalLetterQuestions={overviewStats.totalLetterQuestions}
        totalWordScore={overviewStats.totalWordScore}
        totalWordQuestions={overviewStats.totalWordQuestions}
        learnedWordsCount={overviewStats.learnedWordsCount}
        learnedGroupsCount={overviewStats.learnedGroupsCount}
        // Pass the *automatic* review session state for display
        isReviewMode={isReviewMode}
        reviewQuestionsRemaining={reviewQuestionsRemaining}
      />

      {/* Display loading overlay */}
      {isLoading &&
        !error && ( // Don't show loading if error message is shown
          <div className="loading-overlay">
            <span>Loading...</span>
          </div>
        )}

      {/* Display errors that occur *after* initial load */}
      {error && (
        <div className="error-inline">
          <p>
            <strong>Warning:</strong> {error}
          </p>
          {/* Provide context-specific action for errors */}
          {error.includes("No learned words") && appMode === "review" ? (
            <button onClick={() => changeMode("vocabFocus")}>
              Go to Vocab Focus
            </button>
          ) : (
            <button onClick={handleNextQuestion}>Try Loading Next</button>
          )}
        </div>
      )}

      {/* Only show question/answer area if not loading AND no critical error preventing item display */}
      {!isLoading && !error && currentItemData && (
        <div className="quiz-interaction-area">
          <QuestionDisplay
            displayItem={displayItemKey}
            questionText={questionText}
            groupNumber={groupNumber}
          />

          <form onSubmit={handleSubmit} className="input-form">
            <AnswerInput
              itemType={itemType}
              userNameInput={userNameInput}
              setUserNameInput={setUserNameInput}
              userSoundInput={userSoundInput}
              setUserSoundInput={setUserSoundInput}
              userPronunciationInput={userPronunciationInput}
              setUserPronunciationInput={setUserPronunciationInput}
              userMeaningInput={userMeaningInput}
              setUserMeaningInput={setUserMeaningInput}
              showAnswer={showAnswer}
              firstInputRef={firstInputRef}
            />
            {!showAnswer && (
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading} // Disable while loading next question/submitting
              >
                {/* Adjust button text for automatic review sessions */}
                {isReviewMode &&
                reviewQuestionsRemaining > 0 &&
                appMode !== "review"
                  ? `Submit (${reviewQuestionsRemaining} Auto Review Left)`
                  : "Submit Answer"}
              </button>
            )}
          </form>

          <Feedback
            showAnswer={showAnswer}
            itemType={itemType}
            isOverallCorrect={isOverallCorrect}
            feedbackMessage={feedbackData?.feedbackMessage || ""}
            currentItem={feedbackData?.correctAnswer || null}
            onNextQuestion={handleNextQuestion}
          />
        </div> // End quiz-interaction-area
      )}
      {/* Show this message if no item could be loaded, e.g., after "no learned words" error */}
      {!isLoading && !currentItemData && !error && (
        <div className="info-message">
          <p>Select a mode above to start, or check the error message.</p>
        </div>
      )}

      {/* Conditionally render the WordEditor overlay */}
      {showWordEditor && (
        <WordEditor
          onClose={() => setShowWordEditor(false)}
          onStatsResetUpdate={handleStatsResetUpdate} // Pass the callback for stat reset
          onWordRenamed={handleWordRenamed} // Pass the callback for word rename
        />
      )}

      {/* Stats/History always visible unless critical initial load error */}
      {(learnedWordHistory.length > 0 ||
        Object.keys(detailedLetterStats).length > 0 ||
        Object.keys(detailedWordStats).length > 0) && (
        <div className="stats-history-section">
          <ProgressPlot learnedWordHistory={learnedWordHistory} />
          <PerformanceTables
            appMode={appMode}
            letterStats={detailedLetterStats}
            wordStats={detailedWordStats}
          />
        </div>
      )}

      <div className="controls footer-controls">
        <button
          onClick={resetStatsHandler} // This resets ALL server progress
          className="reset-button"
          disabled={isLoading}
        >
          Reset All Server Progress
        </button>
      </div>
    </div> // End quiz-container
  );
}

export default App;
