import React from "react";

function Feedback({
  showAnswer,
  itemType,
  isOverallCorrect,
  feedbackMessage,
  currentItem,
  onNextQuestion,
}) {
  if (!showAnswer) return null;

  return (
    <div className="feedback-area">
      <p className={isOverallCorrect ? "correct-answer" : "incorrect-answer"}>
        {feedbackMessage}
      </p>
      {itemType === "letter" && !isOverallCorrect && currentItem && (
        <p className="detail-feedback">
          Correct: <strong>{currentItem.name}</strong> (Sound:{" "}
          <strong>{currentItem.sound}</strong>)
        </p>
      )}
      {itemType === "word" && !isOverallCorrect && currentItem && (
        <p className="detail-feedback">
          Correct: Pronun: <strong>{currentItem.pronunciation}</strong>,
          Meaning: <strong>{currentItem.english}</strong>
        </p>
      )}
      <button onClick={onNextQuestion} className="next-button">
        Next Question
      </button>
    </div>
  );
}

export default Feedback;
