import React from "react";
// Assuming you have some CSS for QuizHeader, like QuizHeader.css
import "./QuizHeader.css";

function QuizHeader({
  appMode,
  changeMode,
  displayFocusGroup,
  totalLetterScore,
  totalLetterQuestions,
  totalWordScore,
  totalWordQuestions,
  learnedWordsCount,
  learnedGroupsCount,
  isReviewMode, // For the *automatic* review session triggered by vocabFocus
  reviewQuestionsRemaining, // For the *automatic* review session
}) {
  const letterAccuracy =
    totalLetterQuestions > 0
      ? ((totalLetterScore / totalLetterQuestions) * 100).toFixed(1)
      : "N/A";
  const wordAccuracy =
    totalWordQuestions > 0
      ? ((totalWordScore / totalWordQuestions) * 100).toFixed(1)
      : "N/A";

  // Determine if the "Review Learned" tab should be enabled
  const canReview = learnedWordsCount > 0;

  return (
    <>
      {/* Mode Selection Tabs */}
      <div className="mode-selector">
        <button
          onClick={() => changeMode("quiz")}
          className={`mode-button ${appMode === "quiz" ? "active" : ""}`}
          // Removed disabling based on active state for standard tab behavior
        >
          Letters & Basics
        </button>
        <button
          onClick={() => changeMode("vocabFocus")}
          className={`mode-button ${appMode === "vocabFocus" ? "active" : ""}`}
        >
          Vocabulary Focus
        </button>
        {/* New Review Learned Tab */}
        <button
          onClick={() => {
            if (canReview) {
              changeMode("review");
            } else {
              alert(
                "You need to learn some words in 'Vocab Focus' mode before you can review!"
              );
            }
          }}
          className={`mode-button ${appMode === "review" ? "active" : ""} ${
            !canReview ? "disabled" : ""
          }`}
          disabled={!canReview} // Disable button if no words are learned
          title={
            canReview
              ? "Review words you have already learned."
              : "Learn some words first!"
          }
        >
          Review Learned ({learnedWordsCount})
        </button>
      </div>

      {/* Indicator for AUTOMATIC review sessions (only when not in dedicated review mode) */}
      {isReviewMode && appMode !== "review" && (
        <div className="review-mode-indicator">
          ✨ Auto Review Session Active ({reviewQuestionsRemaining} questions
          remaining) ✨
        </div>
      )}

      <h1 className="quiz-title">Greek Learning Quiz</h1>

      {/* Consolidated Scores/Stats Display */}
      <div className="quiz-scores">
        <span>
          Letters: {totalLetterScore}/{totalLetterQuestions} ({letterAccuracy}%)
        </span>
        <span>|</span>
        <span>
          Words: {totalWordScore}/{totalWordQuestions} ({wordAccuracy}%)
        </span>
        <span>|</span>
        {/* Always show learned count if > 0, makes Review tab count less redundant */}
        {learnedWordsCount > 0 && (
          <span>Learned Words: {learnedWordsCount}</span>
        )}
        {/* Show learned groups only when relevant (e.g., vocab focus or review?) */}
        {(appMode === "vocabFocus" || appMode === "review") &&
          learnedGroupsCount > 0 && (
            <>
              <span>|</span>
              <span>Learned Groups: {learnedGroupsCount}</span>
            </>
          )}
        {/* Show Focus Group only in VocabFocus and when not in an *automatic* review */}
        {appMode === "vocabFocus" &&
          displayFocusGroup !== null &&
          !isReviewMode && (
            <>
              <span>|</span>
              <span>Focus Group: {displayFocusGroup}</span>
            </>
          )}
      </div>
    </>
  );
}

export default QuizHeader;
