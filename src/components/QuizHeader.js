import React from "react";

function QuizHeader({
  appMode,
  changeMode,
  displayFocusGroup,
  totalLetterScore,
  totalLetterQuestions,
  totalWordScore,
  totalWordQuestions,
  learnedWordsCount, // New
  learnedGroupsCount, // New
  isReviewMode, // New
  reviewQuestionsRemaining, // New
}) {
  const letterAccuracy =
    totalLetterQuestions > 0
      ? ((totalLetterScore / totalLetterQuestions) * 100).toFixed(1)
      : "N/A";
  const wordAccuracy =
    totalWordQuestions > 0
      ? ((totalWordScore / totalWordQuestions) * 100).toFixed(1)
      : "N/A";

  return (
    <>
      <div className="mode-selector">
        <button
          onClick={() => changeMode("quiz")}
          className={appMode === "quiz" ? "active" : ""}
          disabled={appMode === "quiz"}
        >
          Letters & Basics
        </button>
        <button
          onClick={() => changeMode("vocabFocus")}
          className={appMode === "vocabFocus" ? "active" : ""}
          disabled={appMode === "vocabFocus"}
        >
          Vocabulary Focus
        </button>
      </div>

      {isReviewMode && (
        <div className="review-mode-indicator">
          ✨ Review Session Active ({reviewQuestionsRemaining} questions
          remaining) ✨
        </div>
      )}

      <h1 className="quiz-title">Greek Learning Quiz</h1>

      <div className="quiz-scores">
        {appMode === "quiz" && (
          <span>
            Letters: {totalLetterScore}/{totalLetterQuestions} ({letterAccuracy}
            %)
          </span>
        )}
        {/* Always show word stats, maybe emphasize in vocab mode */}
        <span>
          Words: {totalWordScore}/{totalWordQuestions} ({wordAccuracy}%)
        </span>
        {/* Show learned stats only in vocab mode */}
        {appMode === "vocabFocus" && (
          <>
            <span>Learned Words: {learnedWordsCount}</span>
            <span>Learned Groups: {learnedGroupsCount}</span>
            {displayFocusGroup &&
              !isReviewMode && ( // Don't show focus group during review
                <span>Focus Group: {displayFocusGroup}</span>
              )}
          </>
        )}
      </div>
    </>
  );
}

export default QuizHeader;
