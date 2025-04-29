import React from "react";

// Add groupNumber prop
function QuestionDisplay({ displayItem, questionText, groupNumber }) {
  return (
    <div className="question-area">
      <p className="question-text">{questionText}</p>
      {/* Optionally display group number */}
      {groupNumber && (
        <span className="item-group-number">Group {groupNumber}</span>
      )}
      <div className="item-display">{displayItem}</div>
    </div>
  );
}

export default QuestionDisplay;
