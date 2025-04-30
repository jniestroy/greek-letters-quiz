import React from "react";

function AnswerInput({
  itemType,
  userNameInput,
  setUserNameInput,
  userSoundInput,
  setUserSoundInput,
  userPronunciationInput,
  setUserPronunciationInput,
  userMeaningInput,
  setUserMeaningInput,
  showAnswer,
}) {
  if (itemType === "letter") {
    return (
      <>
        <div className="input-group">
          <label htmlFor="nameInput">Name:</label>
          <input
            id="nameInput"
            type="text"
            value={userNameInput}
            onChange={(e) => setUserNameInput(e.target.value)}
            className="quiz-input"
            placeholder="Enter the name"
            disabled={showAnswer}
            aria-label="Enter the letter name"
            autoFocus={!showAnswer}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
        <div className="input-group">
          <label htmlFor="soundInput">Sound:</label>
          <input
            id="soundInput"
            type="text"
            value={userSoundInput}
            onChange={(e) => setUserSoundInput(e.target.value)}
            className="quiz-input"
            placeholder="Enter the sound"
            disabled={showAnswer}
            aria-label="Enter the letter sound"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </>
    );
  } else {
    // itemType === 'word'
    return (
      <>
        <div className="input-group">
          <label htmlFor="pronunciationInput">Pronun.:</label>
          <input
            id="pronunciationInput"
            type="text"
            value={userPronunciationInput}
            onChange={(e) => setUserPronunciationInput(e.target.value)}
            className="quiz-input"
            placeholder="e.g., logos"
            disabled={showAnswer}
            aria-label="Enter the pronunciation"
            autoFocus={!showAnswer}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
        <div className="input-group">
          <label htmlFor="meaningInput">Meaning:</label>
          <input
            id="meaningInput"
            type="text"
            value={userMeaningInput}
            onChange={(e) => setUserMeaningInput(e.target.value)}
            className="quiz-input"
            placeholder="Enter the English meaning"
            disabled={showAnswer}
            aria-label="Enter the English meaning"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </>
    );
  }
}

export default AnswerInput;
