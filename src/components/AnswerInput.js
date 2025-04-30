import React from "react";

// Accept firstInputRef as a prop
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
  firstInputRef, // Destructure the ref from props
}) {
  // Common input properties (can be spread onto the input elements)
  const commonInputProps = {
    type: "text",
    className: "quiz-input", // Use a consistent class
    disabled: showAnswer,
    autoCapitalize: "none",
    autoCorrect: "off",
    spellCheck: "false",
    autoComplete: "off", // Often good to disable autocomplete for quizzes
  };

  if (itemType === "letter") {
    return (
      <>
        <div className="input-group">
          <label htmlFor="nameInput">Name:</label>
          <input
            id="nameInput"
            {...commonInputProps} // Spread common props
            value={userNameInput}
            onChange={(e) => setUserNameInput(e.target.value)}
            placeholder="Enter the name"
            aria-label="Enter the letter name"
            // Attach the ref to the *first* input for letters
            ref={firstInputRef}
            // Removed autoFocus - will be handled by useEffect in App.jsx
          />
        </div>
        <div className="input-group">
          <label htmlFor="soundInput">Sound:</label>
          <input
            id="soundInput"
            {...commonInputProps} // Spread common props
            value={userSoundInput}
            onChange={(e) => setUserSoundInput(e.target.value)}
            placeholder="Enter the sound"
            aria-label="Enter the letter sound"
            // No ref needed here, only the first input gets focus
          />
        </div>
      </>
    );
  } else if (itemType === "word") {
    // Added explicit check for 'word' for clarity
    return (
      <>
        <div className="input-group">
          <label htmlFor="pronunciationInput">Pronun.:</label>
          <input
            id="pronunciationInput"
            {...commonInputProps} // Spread common props
            value={userPronunciationInput}
            onChange={(e) => setUserPronunciationInput(e.target.value)}
            placeholder="e.g., logos"
            aria-label="Enter the pronunciation"
            // Attach the ref to the *first* input for words
            ref={firstInputRef}
            // Removed autoFocus - will be handled by useEffect in App.jsx
          />
        </div>
        <div className="input-group">
          <label htmlFor="meaningInput">Meaning:</label>
          <input
            id="meaningInput"
            {...commonInputProps} // Spread common props
            value={userMeaningInput}
            onChange={(e) => setUserMeaningInput(e.target.value)}
            placeholder="Enter the English meaning"
            aria-label="Enter the English meaning"
            // No ref needed here
          />
        </div>
      </>
    );
  } else {
    // Optional: Render nothing or a placeholder if itemType is unexpected
    return null;
  }
}

export default AnswerInput;
