import React, { useState, useEffect, useCallback, useRef } from "react";

// Assuming utils/statsUtils contains functions making API calls to your backend
import {
  fetchStatsOverview,
  fetchProgressHistory,
  fetchNextItem,
  submitAnswer,
  resetAllProgress,
  fetchDetailedStats,
} from "./utils/statsUtils"; // Adjust path as needed

// Assuming components are in a 'components' subdirectory
import QuizHeader from "./components/QuizHeader";
import QuestionDisplay from "./components/QuestionDisplay";
import AnswerInput from "./components/AnswerInput"; // Using the updated component
import Feedback from "./components/Feedback";
import PerformanceTables from "./components/PerformanceTables";
import ProgressPlot from "./components/ProgressPlot";

import "./greek-quiz.css"; // Main CSS file

function App() {
  // --- State Variables ---
  const [appMode, setAppMode] = useState("quiz"); // 'quiz' or 'vocabFocus'
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

  // Review Mode State
  const [isReviewMode, setIsReviewMode] = useState(false); // Is a review session active?
  const [reviewQuestionsRemaining, setReviewQuestionsRemaining] = useState(0); // How many left in session?

  // --- Ref for Auto-Focus ---
  const firstInputRef = useRef(null); // Create the ref for the first input

  // --- Core Data Fetching Functions ---

  const getNextQuestion = useCallback(
    async (currentAppMode, currentReviewStatus, currentReviewRemaining) => {
      console.log(
        `Requesting next item. Mode: ${currentAppMode}, Review Active: ${currentReviewStatus}, Remaining: ${currentReviewRemaining}`
      );
      setIsLoading(true);
      setError(null);
      setShowAnswer(false);
      setFeedbackData(null);
      setUserNameInput("");
      setUserSoundInput("");
      setUserPronunciationInput("");
      setUserMeaningInput("");

      try {
        const nextItemData = await fetchNextItem(
          currentAppMode,
          currentReviewStatus,
          currentReviewRemaining
        );
        setCurrentItemData(nextItemData);
        setIsReviewMode(nextItemData.isReviewMode);
        setReviewQuestionsRemaining(nextItemData.reviewQuestionsRemaining);
        console.log("Received next item:", nextItemData);
        // Focus logic is handled by useEffect below
      } catch (err) {
        console.error("Failed to fetch next item:", err);
        setError(
          `Failed to load next question: ${
            err.message || "Server communication error"
          }. Please check the backend and refresh.`
        );
        setCurrentItemData(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
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
        await getNextQuestion("quiz", false, 0); // Fetch first question
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError(
          `Failed to load initial data: ${
            err.message || "Server unavailable"
          }. Please ensure the backend is running and refresh.`
        );
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
  }, []);

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

      const payload = {
        itemKey,
        itemType,
        userNameInput,
        userSoundInput,
        userPronunciationInput,
        userMeaningInput,
        appMode,
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
        // Update review state for the *next* question based on response
        setIsReviewMode(result.nextReviewStatus.isReviewMode);
        setReviewQuestionsRemaining(
          result.nextReviewStatus.reviewQuestionsRemaining
        );
        console.log(
          `Next review state set: Mode=${result.nextReviewStatus.isReviewMode}, Remaining=${result.nextReviewStatus.reviewQuestionsRemaining}`
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
    // Use the current review state when fetching the next question
    getNextQuestion(appMode, isReviewMode, reviewQuestionsRemaining);
  }, [getNextQuestion, appMode, isReviewMode, reviewQuestionsRemaining]);

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
        setAppMode("quiz");
        await getNextQuestion("quiz", false, 0); // Start fresh
      } catch (err) {
        console.error("Failed to reset progress:", err);
        setError(`Failed to reset progress: ${err.message || "Server error"}.`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [getNextQuestion]);

  const changeMode = useCallback(
    (newMode) => {
      if (appMode !== newMode) {
        console.log(`Changing mode from ${appMode} to ${newMode}`);
        setAppMode(newMode);
        setIsReviewMode(false); // Reset review state on mode change
        setReviewQuestionsRemaining(0);
        getNextQuestion(newMode, false, 0); // Fetch item for new mode
      }
    },
    [appMode, getNextQuestion]
  );

  // --- Auto-Focus Effect ---
  useEffect(() => {
    // Focus the first input when a new question loads and answer is not shown
    if (currentItemData && !showAnswer && firstInputRef.current) {
      const timerId = setTimeout(() => {
        // Check ref again inside timeout in case component updates quickly
        if (firstInputRef.current) {
          firstInputRef.current.focus();
          // Optional: select text if you prefer
          // firstInputRef.current.select();
        }
      }, 50); // Small delay (50ms) often helps ensure element is ready
      return () => clearTimeout(timerId); // Cleanup timeout on unmount/change
    }
  }, [currentItemData, showAnswer]); // Re-run when item changes or answer visibility changes

  // --- Derived values for rendering ---
  const displayItemKey = currentItemData?.item
    ? currentItemData.itemType === "letter"
      ? currentItemData.item.letter
      : currentItemData.item.greek
    : "";
  const questionText =
    currentItemData?.questionText ||
    (isLoading ? "Loading..." : "No question loaded.");
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
  if (error && !currentItemData) {
    return (
      <div className="quiz-container error">
        <h2>Application Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Refresh</button>{" "}
        <button onClick={resetStatsHandler}>Reset Progress</button>
      </div>
    );
  }
  if (!currentItemData && !isLoading) {
    return (
      <div className="quiz-container error">
        <h2>Loading Issue</h2>
        <p>Could not load question.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>{" "}
        <button onClick={resetStatsHandler}>Reset Progress</button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
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
        isReviewMode={isReviewMode}
        reviewQuestionsRemaining={reviewQuestionsRemaining}
      />

      {isLoading && (
        <div className="loading-overlay">
          <span>Loading...</span>
        </div>
      )}
      {error && (
        <div className="error-inline">
          <p>
            <strong>Warning:</strong> {error}
          </p>
        </div>
      )}

      {currentItemData && (
        <>
          <QuestionDisplay
            displayItem={displayItemKey}
            questionText={questionText}
            groupNumber={groupNumber}
          />

          <form onSubmit={handleSubmit} className="input-form">
            {/* Pass the ref to the AnswerInput component */}
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
              firstInputRef={firstInputRef} // Pass the ref here
            />
            {!showAnswer && (
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isReviewMode && reviewQuestionsRemaining > 0
                  ? `Submit (${reviewQuestionsRemaining} Review Left)`
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
        </>
      )}

      <ProgressPlot learnedWordHistory={learnedWordHistory} />
      <PerformanceTables
        appMode={appMode}
        letterStats={detailedLetterStats}
        wordStats={detailedWordStats}
      />
      <div className="controls footer-controls">
        <button
          onClick={resetStatsHandler}
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
