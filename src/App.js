import React, { useState, useEffect, useCallback, useMemo } from "react";

// Data and Utils
import { greekLetters } from "./data/letters";
import { vocabularyList, basicGreekWords, allGroups } from "./data/vocabulary"; // Added allGroups
import {
  initializeStats,
  loadStats,
  saveStats,
  selectWeightedRandom,
  getCurrentFocusGroup,
  isWordLearned,
  getLearnedWords,
  getLearnedGroups,
  saveLearnedWordHistory,
  loadLearnedWordHistory,
  resetAllProgress,
  LEARNED_MIN_SEEN, // *** ADD THIS IMPORT ***
} from "./utils/statsUtils";

// UI Components
import QuizHeader from "./components/QuizHeader";
import QuestionDisplay from "./components/QuestionDisplay";
import AnswerInput from "./components/AnswerInput";
import Feedback from "./components/Feedback";
import PerformanceTables from "./components/PerformanceTables";
import ProgressPlot from "./components/ProgressPlot"; // Added

// Styles
import "./greek-quiz.css";

// Constants
const REVIEW_QUESTIONS_COUNT = 15; // Number of questions in a review session

function App() {
  // --- State ---
  const [letterStats, setLetterStats] = useState(() =>
    loadStats("greekLetterStats_v2", () =>
      initializeStats(greekLetters, "letter")
    )
  );
  const [wordStats, setWordStats] = useState(() =>
    loadStats("greekWordStats_v3", () =>
      initializeStats(vocabularyList, "greek")
    )
  );
  // New State for Learned Status and Review
  const [learnedWordHistory, setLearnedWordHistory] = useState(() =>
    loadLearnedWordHistory()
  );
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewQuestionsRemaining, setReviewQuestionsRemaining] = useState(0);

  const [appMode, setAppMode] = useState("quiz"); // 'quiz' or 'vocabFocus'
  const [currentItem, setCurrentItem] = useState(null);
  const [itemType, setItemType] = useState("letter"); // 'letter' or 'word'

  // Input State
  const [userNameInput, setUserNameInput] = useState("");
  const [userSoundInput, setUserSoundInput] = useState("");
  const [userPronunciationInput, setUserPronunciationInput] = useState("");
  const [userMeaningInput, setUserMeaningInput] = useState("");

  // Feedback/Display State
  const [showAnswer, setShowAnswer] = useState(false);
  const [isNameCorrect, setIsNameCorrect] = useState(false);
  const [isSoundCorrect, setIsSoundCorrect] = useState(false);
  const [isPronunciationCorrect, setIsPronunciationCorrect] = useState(false);
  const [isMeaningCorrect, setIsMeaningCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // --- Derived State (using useMemo for efficiency) ---
  const [totalLetterScore, totalLetterQuestions] = useMemo(
    () =>
      Object.values(letterStats).reduce(
        (acc, stats) => [
          acc[0] + stats.correctAttempts,
          acc[1] + stats.totalAttempts,
        ],
        [0, 0]
      ),
    [letterStats]
  );

  const [totalWordScore, totalWordQuestions] = useMemo(
    () =>
      Object.values(wordStats).reduce(
        (acc, stats) => [
          acc[0] + stats.correctAttempts,
          acc[1] + stats.totalAttempts,
        ],
        [0, 0]
      ),
    [wordStats]
  );

  // Learned Status Calculations
  const learnedWordKeys = useMemo(
    () => getLearnedWords(wordStats),
    [wordStats]
  );
  const learnedGroups = useMemo(() => getLearnedGroups(wordStats), [wordStats]);
  const learnedWordsCount = learnedWordKeys.length;
  const learnedGroupsCount = learnedGroups.length;

  // Focus Group Calculation (only relevant in vocab mode)
  const currentFocusGroup = useMemo(
    () => (appMode === "vocabFocus" ? getCurrentFocusGroup(wordStats) : null),
    [appMode, wordStats] // Depends on wordStats now
  );

  // --- Effects ---
  // Auto-save stats when they change
  useEffect(() => {
    saveStats("greekLetterStats_v2", letterStats);
  }, [letterStats]);

  useEffect(() => {
    saveStats("greekWordStats_v3", wordStats);
    // Track learned word history whenever word stats change
    const currentCount = getLearnedWords(wordStats).length; // Recalculate needed
    saveLearnedWordHistory(currentCount);
    setLearnedWordHistory(loadLearnedWordHistory()); // Update state for plot
  }, [wordStats]);

  // Check for newly learned groups to trigger review mode
  // Store previous count using a ref or by comparing inside useEffect
  const [prevLearnedGroupCount, setPrevLearnedGroupCount] = useState(
    learnedGroups.length
  );
  useEffect(() => {
    const currentLearnedGroupCount = learnedGroups.length;
    if (
      currentLearnedGroupCount > prevLearnedGroupCount &&
      appMode === "vocabFocus" &&
      !isReviewMode
    ) {
      // Check !isReviewMode to prevent re-triggering during a review
      console.log(
        `Group ${
          learnedGroups[learnedGroups.length - 1]
        } learned! Starting review.`
      );
      setIsReviewMode(true);
      setReviewQuestionsRemaining(REVIEW_QUESTIONS_COUNT);
    }
    // Update the stored previous count for the next comparison
    setPrevLearnedGroupCount(currentLearnedGroupCount);
  }, [learnedGroups, appMode, isReviewMode, prevLearnedGroupCount]); // Add dependencies

  // --- Core Logic ---

  const selectNextItem = useCallback(() => {
    let selectedItem = null;
    let nextItemType = "letter"; // Default assumption
    let selectionPool = [];
    let prioritizeStruggled = false; // Flag for weighted selection

    // --- Determine Mode and Pool ---
    if (isReviewMode && appMode === "vocabFocus") {
      nextItemType = "word";
      // Pool: All currently learned words
      selectionPool = vocabularyList.filter((w) =>
        learnedWordKeys.includes(w.greek)
      );

      if (selectionPool.length === 0) {
        // Fallback if no words learned yet
        console.warn(
          "Review mode active, but no learned words found. Exiting review."
        );
        setIsReviewMode(false);
        setReviewQuestionsRemaining(0);
        // Fall through to normal vocabFocus logic below
      } else {
        // Select from the pool of *all* learned words,
        // but prioritize the ones needing practice using the flag.
        prioritizeStruggled = true; // Prioritize struggled within the learned pool
      }
    }

    // Separate block for non-review modes OR if review mode exited above
    if (!isReviewMode) {
      if (appMode === "quiz") {
        // Original Quiz Mode Logic (Letters + Basic Words)
        const letterAccuracy =
          totalLetterQuestions > 0
            ? totalLetterScore / totalLetterQuestions
            : 0;
        const seenLettersCount = Object.values(letterStats).filter(
          (s) => s.totalAttempts > 0
        ).length;
        const canShowBasicWords =
          totalLetterQuestions >= 10 &&
          letterAccuracy >= 0.7 &&
          seenLettersCount >= greekLetters.length / 3 &&
          basicGreekWords.length > 0;
        const showBasicWordProbability = canShowBasicWords ? 0.2 : 0;

        if (
          Math.random() < showBasicWordProbability &&
          basicGreekWords.length > 0
        ) {
          nextItemType = "word";
          selectionPool = basicGreekWords;
        } else if (greekLetters.length > 0) {
          nextItemType = "letter";
          selectionPool = greekLetters;
        } else if (basicGreekWords.length > 0) {
          // Fallback to basic words if no letters
          nextItemType = "word";
          selectionPool = basicGreekWords;
        } else {
          selectionPool = []; // No items available
        }
      } else {
        // appMode === 'vocabFocus' (and not in review)
        nextItemType = "word";
        if (vocabularyList.length === 0) {
          selectionPool = [];
        } else {
          const focusGroupNum = currentFocusGroup; // Use derived state
          const learnedGroupNums = learnedGroups; // Use derived state
          const FOCUS_RATIO = 2 / 3; // 2/3 focus group, 1/3 learned

          const focusWords = vocabularyList.filter(
            (w) => w.group === focusGroupNum
          );
          const learnedWordsPool = vocabularyList.filter((w) =>
            learnedGroupNums.includes(w.group)
          );

          let poolToUse = [];
          prioritizeStruggled = false; // Reset flag

          if (focusWords.length === 0 && learnedWordsPool.length === 0) {
            poolToUse = vocabularyList; // Fallback to all words
          } else if (focusWords.length === 0) {
            poolToUse = learnedWordsPool; // Only learned words left
            prioritizeStruggled = true; // Prioritize struggled in this case
          } else if (learnedWordsPool.length === 0) {
            poolToUse = focusWords; // Only focus words left
          } else {
            // Apply ratio logic: Choose pool first, then select from it
            if (Math.random() < FOCUS_RATIO) {
              poolToUse = focusWords;
            } else {
              poolToUse = learnedWordsPool;
              prioritizeStruggled = true; // Prioritize struggling within learned pool
            }
          }
          selectionPool = poolToUse; // Set the pool for selection
        }
      }
    } // end if(!isReviewMode)

    // --- Perform Selection ---
    if (selectionPool.length > 0) {
      selectedItem = selectWeightedRandom(
        selectionPool,
        nextItemType === "letter" ? letterStats : wordStats,
        nextItemType === "letter" ? "letter" : "greek",
        nextItemType === "word", // isWord flag
        prioritizeStruggled // Pass the flag
      );
    } else {
      selectedItem = null; // No pool to select from
    }

    // --- Common Logic: Ensure no repeats, update state ---
    let attempts = 0;
    const maxAttempts = 10;
    let finalSelectedItem = selectedItem;
    const sourceList =
      nextItemType === "letter" ? greekLetters : vocabularyList; // Base list for checks

    // Prevent immediate repeats if possible
    while (
      currentItem &&
      finalSelectedItem &&
      sourceList.length > 1 && // Check if there are alternatives overall
      selectionPool.length > 1 && // Check if alternatives exist in current pool
      JSON.stringify(finalSelectedItem) === JSON.stringify(currentItem) &&
      attempts < maxAttempts
    ) {
      attempts++;
      // Try to select a *different* item from the *same pool* determined above
      const currentPoolFiltered = selectionPool.filter(
        (item) => JSON.stringify(item) !== JSON.stringify(currentItem)
      );

      const tempSelectedItem = selectWeightedRandom(
        currentPoolFiltered.length > 0 ? currentPoolFiltered : selectionPool, // Use filtered pool if possible
        nextItemType === "letter" ? letterStats : wordStats,
        nextItemType === "letter" ? "letter" : "greek",
        nextItemType === "word",
        prioritizeStruggled // Use the same flag as the initial selection
      );

      // If re-selection failed or still resulted in the same item, break
      if (
        !tempSelectedItem ||
        JSON.stringify(tempSelectedItem) === JSON.stringify(currentItem)
      ) {
        break;
      }
      finalSelectedItem = tempSelectedItem; // Found a different item
    }

    // Handle selection failure or empty lists
    if (!finalSelectedItem) {
      console.error(
        "Failed to select a valid next item. Check data availability and selection logic."
      );
      // Try a very basic fallback (outside the determined pool if needed)
      if (nextItemType === "letter" && greekLetters.length > 0) {
        finalSelectedItem =
          greekLetters[Math.floor(Math.random() * greekLetters.length)];
      } else if (vocabularyList.length > 0) {
        // Fallback to any word if original type was word or failed
        finalSelectedItem =
          vocabularyList[Math.floor(Math.random() * vocabularyList.length)];
        nextItemType = "word"; // Ensure type matches fallback
      } else {
        setCurrentItem(null); // No items available at all
        setFeedbackMessage("Error: No items available to select."); // Inform user
        return;
      }
    }

    setCurrentItem(finalSelectedItem);
    setItemType(nextItemType);

    // Clear inputs and feedback
    setUserNameInput("");
    setUserSoundInput("");
    setUserPronunciationInput("");
    setUserMeaningInput("");
    setShowAnswer(false);
    setFeedbackMessage("");
    setIsNameCorrect(false);
    setIsSoundCorrect(false);
    setIsPronunciationCorrect(false);
    setIsMeaningCorrect(false);
  }, [
    appMode,
    letterStats,
    wordStats,
    currentItem,
    totalLetterScore,
    totalLetterQuestions,
    isReviewMode,
    learnedWordKeys, // Add learned status dependencies
    learnedGroups,
    currentFocusGroup,
  ]); // Dependencies

  // Initial Load / Mode Change Trigger
  useEffect(() => {
    if (
      !currentItem &&
      (greekLetters.length > 0 || vocabularyList.length > 0)
    ) {
      selectNextItem();
    }
    // Reset review mode if switching away from vocabFocus
    if (appMode !== "vocabFocus" && isReviewMode) {
      setIsReviewMode(false);
      setReviewQuestionsRemaining(0);
    }
    // Safety check if lists become empty
    if (currentItem && itemType === "letter" && greekLetters.length === 0)
      setCurrentItem(null);
    if (currentItem && itemType === "word" && vocabularyList.length === 0)
      setCurrentItem(null);
  }, [currentItem, selectNextItem, itemType, appMode, isReviewMode]); // Add dependencies

  // --- Event Handlers ---

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!currentItem || showAnswer) return;

      let feedback = "";
      let overallCorrect = false;
      let itemKey = null;
      let statsUpdater = null;
      let currentStats = null;
      let keyField = "";

      if (itemType === "letter") {
        itemKey = currentItem.letter;
        statsUpdater = setLetterStats;
        currentStats = letterStats;
        keyField = "letter";
        if (!itemKey && itemKey !== 0) {
          // Handle potential key issues (e.g., empty string or null)
          console.error("Submit Error: Invalid letter key:", currentItem);
          setFeedbackMessage("Error: Cannot process this letter item.");
          setShowAnswer(true); // Show feedback area even on error
          return;
        }

        const correctName = currentItem.name.toLowerCase();
        const correctSound = currentItem.sound.toLowerCase();
        const processedNameInput = userNameInput.trim().toLowerCase();
        const processedSoundInput = userSoundInput.trim().toLowerCase();
        const nameCorrect = processedNameInput === correctName;
        const soundCorrect = processedSoundInput === correctSound;
        setIsNameCorrect(nameCorrect);
        setIsSoundCorrect(soundCorrect);
        overallCorrect = nameCorrect && soundCorrect;

        if (overallCorrect) feedback = "Correct! Well done.";
        else {
          feedback = "Incorrect: ";
          if (!nameCorrect) feedback += `Name: ${currentItem.name}. `;
          if (!soundCorrect) feedback += `Sound: ${currentItem.sound}.`;
        }
      } else {
        // itemType === 'word'
        itemKey = currentItem.greek;
        statsUpdater = setWordStats;
        currentStats = wordStats;
        keyField = "greek";
        if (!itemKey && itemKey !== 0) {
          console.error("Submit Error: Invalid word key:", currentItem);
          setFeedbackMessage("Error: Cannot process this word item.");
          setShowAnswer(true); // Show feedback area even on error
          return;
        }

        const correctPronunciation = currentItem.pronunciation.toLowerCase();
        // Handle multiple possible meanings separated by '/'
        const correctMeanings = currentItem.english
          .toLowerCase()
          .split("/")
          .map((s) => s.trim())
          .filter((s) => s); // Get individual meanings
        const processedPronunciationInput = userPronunciationInput
          .trim()
          .toLowerCase();
        const processedMeaningInput = userMeaningInput.trim().toLowerCase();

        const pronunciationCorrect =
          processedPronunciationInput === correctPronunciation;
        // Check if user input matches ANY of the correct meanings
        const meaningCorrect =
          correctMeanings.length > 0
            ? correctMeanings.some((ans) => processedMeaningInput === ans)
            : false; // Handle empty meanings

        setIsPronunciationCorrect(pronunciationCorrect);
        setIsMeaningCorrect(meaningCorrect);
        overallCorrect = pronunciationCorrect && meaningCorrect;

        if (overallCorrect) feedback = "Correct! Well done.";
        else {
          feedback = "Incorrect: ";
          if (!pronunciationCorrect)
            feedback += `Pronun.: ${currentItem.pronunciation}. `;
          // Only show meaning feedback if meanings exist to compare against
          if (correctMeanings.length > 0 && !meaningCorrect) {
            feedback += `Meaning: ${currentItem.english}.`; // Show all possibilities
          } else if (correctMeanings.length === 0) {
            feedback += `(No official meaning provided for comparison).`;
          }
        }
      }

      // Update Stats using the determined updater and key
      statsUpdater((prev) => {
        // Ensure the key exists in prev, otherwise initialize it
        const oldStats =
          prev[itemKey] || initializeStats([currentItem], keyField)[itemKey];
        // Handle potential undefined oldStats if initialization failed somehow
        if (!oldStats) {
          console.error(`Failed to get/initialize stats for key: ${itemKey}`);
          return prev; // Return previous state without changes
        }

        // Ensure recentPerformance is an array before slicing
        const recentPerf = Array.isArray(oldStats.recentPerformance)
          ? oldStats.recentPerformance
          : [];
        // ** USE LEARNED_MIN_SEEN here **
        const newRecentPerformance = [
          ...recentPerf.slice(-(LEARNED_MIN_SEEN - 1)),
          overallCorrect,
        ];

        return {
          ...prev,
          [itemKey]: {
            ...oldStats,
            totalAttempts: (oldStats.totalAttempts || 0) + 1,
            correctAttempts: overallCorrect
              ? (oldStats.correctAttempts || 0) + 1
              : oldStats.correctAttempts || 0,
            consecutiveCorrect: overallCorrect
              ? (oldStats.consecutiveCorrect || 0) + 1
              : 0,
            recentPerformance: newRecentPerformance,
            lastSeen: Date.now(),
          },
        };
      });

      setFeedbackMessage(feedback.trim());
      setShowAnswer(true);

      // Handle review mode decrement after showing answer
      if (isReviewMode) {
        // Decrement happens *after* stats are updated for the current question
        setReviewQuestionsRemaining((prev) => Math.max(0, prev - 1)); // Ensure it doesn't go below 0
      }
    },
    [
      currentItem,
      showAnswer,
      itemType,
      userNameInput,
      userSoundInput,
      userPronunciationInput,
      userMeaningInput,
      letterStats,
      wordStats,
      isReviewMode,
      // LEARNED_MIN_SEEN is used implicitly via import now
    ]
  ); // Dependencies

  const handleNextQuestion = useCallback(() => {
    // Check if review mode should end (check current state value)
    if (isReviewMode && reviewQuestionsRemaining <= 1) {
      console.log("Review session finished.");
      setIsReviewMode(false);
      setReviewQuestionsRemaining(0);
      // selectNextItem will be called by the useEffect triggered by state change
    }
    // Always select next item, whether ending review or continuing
    selectNextItem();
  }, [selectNextItem, isReviewMode, reviewQuestionsRemaining]);

  const resetStatsHandler = useCallback(() => {
    if (
      window.confirm(
        "Reset ALL progress (stats and history)? This cannot be undone."
      )
    ) {
      resetAllProgress(); // Use the combined reset function
      // Re-initialize state correctly
      setLetterStats(initializeStats(greekLetters, "letter"));
      setWordStats(initializeStats(vocabularyList, "greek"));
      setLearnedWordHistory([]); // Reset history state
      setCurrentItem(null); // Trigger re-selection via useEffect
      setAppMode("quiz"); // Reset mode
      setIsReviewMode(false); // Reset review state
      setReviewQuestionsRemaining(0);
      setPrevLearnedGroupCount(0); // Reset previous group count tracker
      setShowAnswer(false);
      setFeedbackMessage("");
      // selectNextItem will be called by useEffect due to currentItem becoming null
    }
  }, []); // No dependencies needed

  const changeMode = useCallback(
    (newMode) => {
      if (appMode !== newMode) {
        setAppMode(newMode);
        setIsReviewMode(false); // Exit review mode when changing app mode
        setReviewQuestionsRemaining(0);
        setCurrentItem(null); // Force re-selection for the new mode via useEffect
      }
    },
    [appMode]
  );

  // --- Render ---

  // Loading/Error States
  if (!currentItem && (greekLetters.length > 0 || vocabularyList.length > 0)) {
    return <div className="quiz-container loading">Loading Quiz...</div>;
  } else if (greekLetters.length === 0 && vocabularyList.length === 0) {
    return (
      <div className="quiz-container error">Error: No quiz data available.</div>
    );
  } else if (!currentItem) {
    // This state means selection failed or lists became empty after load
    return (
      <div className="quiz-container error">
        {feedbackMessage ||
          "Cannot display question. Check data or reset stats."}
      </div>
    );
  }

  // Determine overall correctness for feedback styling
  const isOverallCorrect =
    showAnswer &&
    ((itemType === "letter" && isNameCorrect && isSoundCorrect) ||
      (itemType === "word" && isPronunciationCorrect && isMeaningCorrect));

  // Determine question text based on itemType
  const questionText =
    itemType === "letter"
      ? "Provide the name and sound for this letter:"
      : "Provide the pronunciation (transliteration) and meaning:";

  return (
    <div className="quiz-container">
      <QuizHeader
        appMode={appMode}
        changeMode={changeMode}
        displayFocusGroup={currentFocusGroup} // Use calculated focus group
        totalLetterScore={totalLetterScore}
        totalLetterQuestions={totalLetterQuestions}
        totalWordScore={totalWordScore}
        totalWordQuestions={totalWordQuestions}
        learnedWordsCount={learnedWordsCount} // Pass learned counts
        learnedGroupsCount={learnedGroupsCount}
        isReviewMode={isReviewMode} // Pass review status
        reviewQuestionsRemaining={reviewQuestionsRemaining}
      />

      <QuestionDisplay
        displayItem={
          itemType === "letter" ? currentItem.letter : currentItem.greek
        }
        questionText={questionText}
        // Optionally show group number for words
        groupNumber={itemType === "word" ? currentItem.group : null}
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
        />
        {!showAnswer && (
          <button type="submit" className="submit-button">
            {isReviewMode
              ? `Submit (${reviewQuestionsRemaining} left)`
              : "Submit"}
          </button>
        )}
      </form>

      <Feedback
        showAnswer={showAnswer}
        itemType={itemType}
        isOverallCorrect={isOverallCorrect}
        feedbackMessage={feedbackMessage}
        currentItem={currentItem}
        onNextQuestion={handleNextQuestion}
      />

      {/* Render Progress Plot only in vocab focus mode */}
      {appMode === "vocabFocus" && (
        <ProgressPlot learnedWordHistory={learnedWordHistory} />
      )}

      <div className="controls">
        <button onClick={resetStatsHandler} className="reset-button">
          Reset All Stats & History
        </button>
      </div>

      <PerformanceTables
        appMode={appMode}
        letterStats={letterStats}
        wordStats={wordStats}
        // Pass learned status checker to tables if needed for display
        isWordLearned={isWordLearned}
      />
    </div>
  );
}

export default App;
