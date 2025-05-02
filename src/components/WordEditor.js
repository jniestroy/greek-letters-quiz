import React, { useState, useEffect, useCallback } from "react";
import {
  fetchAllEditableWords,
  fetchWordDetails,
  updateWordDetails, // For English/Pronunciation
  resetWordStats,
  renameGreekWord, // *** For changing the Greek word itself ***
} from "../utils/statsUtils"; // Adjust path if needed
import "./WordEditor.css"; // Make sure this CSS file exists

// Ensure props are passed from App.js: onClose, onStatsResetUpdate, onWordRenamed
function WordEditor({ onClose, onStatsResetUpdate, onWordRenamed }) {
  const [allWords, setAllWords] = useState([]);
  const [selectedWordKey, setSelectedWordKey] = useState("");
  const [selectedWordData, setSelectedWordData] = useState(null);

  // State for the editable fields
  const [editGreek, setEditGreek] = useState(""); // *** State for the Greek word input ***
  const [editEnglish, setEditEnglish] = useState("");
  const [editPronunciation, setEditPronunciation] = useState("");

  // Component status state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(""); // For success/status messages

  // Fetch list of words
  const loadWordList = useCallback(() => {
    console.log("WordEditor: Attempting to load word list...");
    setIsLoading(true);
    setError(null);
    setMessage("");
    fetchAllEditableWords()
      .then((data) => {
        console.log("WordEditor: Received data for word list:", data);
        if (Array.isArray(data)) {
          setAllWords(data);
          console.log(
            "WordEditor: Successfully set allWords state with",
            data.length,
            "items."
          );
        } else {
          console.error("WordEditor: Received data is not an array!", data);
          setError(
            "Failed to load word list: Invalid data format received from server."
          );
          setAllWords([]);
        }
      })
      .catch((err) => {
        console.error("WordEditor: Failed to fetch editable words:", err);
        setError(`Failed to load word list: ${err.message}. Please try again.`);
        setAllWords([]);
      })
      .finally(() => {
        console.log("WordEditor: Finished loading word list.");
        setIsLoading(false);
      });
  }, []); // No dependencies needed here

  // Fetch list on mount
  useEffect(() => {
    console.log("WordEditor: Component mounted. Calling loadWordList.");
    loadWordList();
  }, [loadWordList]);

  // Fetch details when a word is selected from the dropdown
  useEffect(() => {
    if (!selectedWordKey) {
      setSelectedWordData(null);
      setEditGreek(""); // Clear edit greek field
      setEditEnglish("");
      setEditPronunciation("");
      setMessage("");
      setError(null);
      return;
    }

    console.log(
      `WordEditor: Selected key changed to "${selectedWordKey}". Fetching details...`
    );
    setIsLoading(true);
    setMessage("");
    setError(null);
    fetchWordDetails(selectedWordKey)
      .then((data) => {
        console.log("WordEditor: Received details:", data);
        setSelectedWordData(data);
        // *** Populate all edit fields from fetched data ***
        setEditGreek(data.greek || "");
        setEditEnglish(data.english || "");
        setEditPronunciation(data.pronunciation || "");
        setError(null);
      })
      .catch((err) => {
        console.error(
          `WordEditor: Failed to fetch details for ${selectedWordKey}:`,
          err
        );
        setError(`Failed to load details: ${err.message}.`);
        setSelectedWordData(null);
        setEditGreek(""); // Clear on error too
      })
      .finally(() => {
        console.log("WordEditor: Finished fetching details.");
        setIsLoading(false);
      });
  }, [selectedWordKey]); // Re-run only when selectedWordKey changes

  // Handler for the dropdown selection
  const handleWordSelection = (event) => {
    console.log("WordEditor: Word selected via dropdown:", event.target.value);
    setSelectedWordKey(event.target.value);
  };

  // --- Handlers for Buttons ---

  /** Handler specifically for RENAMING the Greek word */
  const handleRenameWord = useCallback(
    async (event) => {
      event.preventDefault(); // Prevent default form submission
      if (!selectedWordKey || !selectedWordData) {
        console.warn("Rename attempt without selected word.");
        return;
      }

      const originalGreek = selectedWordData.greek; // Get original name for confirmation/comparison
      const newGreek = editGreek.trim(); // Get the value from the Greek input field

      if (!newGreek) {
        setError("The Greek word field cannot be empty to rename.");
        return;
      }
      if (newGreek === originalGreek) {
        setMessage("No change detected in the Greek word.");
        return; // Don't proceed if the name hasn't changed
      }

      // Confirmation dialog
      if (
        !window.confirm(
          `Are you sure you want to rename "${originalGreek}" to "${newGreek}"? This will update the word and transfer its statistics.`
        )
      ) {
        return; // User cancelled
      }

      console.log(
        `WordEditor: Attempting to rename "${originalGreek}" to "${newGreek}"`
      );
      setIsLoading(true);
      setMessage(""); // Clear previous messages
      setError(null); // Clear previous errors

      try {
        // Call the specific API function for renaming
        const result = await renameGreekWord(originalGreek, newGreek);
        setMessage(result.message || "Word renamed successfully!");
        console.log("WordEditor: Rename successful:", result);

        // --- Update UI after successful rename ---
        const renamedKey = result.new_key; // Get the actual new key from the backend response

        // 1. Update the selected key state to the new name
        setSelectedWordKey(renamedKey);

        // 2. Refresh the word list in the dropdown to reflect the change
        loadWordList(); // Re-fetches the list with the updated name

        // 3. Notify the parent component (App.js) about the rename
        if (onWordRenamed) {
          onWordRenamed(originalGreek, renamedKey);
        }

        // Note: We don't need to manually set selectedWordData or edit fields here.
        // The useEffect hook that depends on `selectedWordKey` will automatically trigger
        // when `setSelectedWordKey(renamedKey)` runs, causing a fetch for the *new* details.
      } catch (err) {
        console.error("WordEditor: Failed to rename word:", err);
        setError(`Rename failed: ${err.message}. Please check the console.`);
        // Optional: Reset editGreek field back to original on failure?
        // setEditGreek(originalGreek);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedWordKey, selectedWordData, editGreek, loadWordList, onWordRenamed]
  ); // Dependencies for the rename handler

  /** Handler for saving changes to English/Pronunciation ONLY */
  const handleSaveChanges = useCallback(
    async (event) => {
      event.preventDefault(); // Prevent default form submission
      if (!selectedWordKey || !selectedWordData) {
        console.warn("Save details attempt without selected word.");
        return;
      }

      const updatedEnglish = editEnglish.trim();
      const updatedPronunciation = editPronunciation.trim();

      // Check if only English/Pronunciation changed compared to the fetched data
      if (
        updatedEnglish === selectedWordData.english &&
        updatedPronunciation === selectedWordData.pronunciation
      ) {
        setMessage("No changes detected in English or Pronunciation fields.");
        return; // Don't call API if nothing changed
      }

      if (!updatedEnglish || !updatedPronunciation) {
        setError(
          "English and Pronunciation fields cannot be empty when saving details."
        );
        return;
      }

      console.log(
        `WordEditor: Saving English/Pronunciation changes for "${selectedWordKey}"`
      );
      setIsLoading(true);
      setMessage("");
      setError(null);
      const updatedData = {
        english: updatedEnglish,
        pronunciation: updatedPronunciation,
      };

      try {
        // Call the API function to update English/Pronunciation
        const result = await updateWordDetails(selectedWordKey, updatedData);
        setMessage(result.message || "Word details updated successfully!");
        console.log("WordEditor: Save details successful:", result);

        // Optimistically update local state for immediate feedback
        setSelectedWordData((prevData) => ({
          ...prevData,
          english: updatedData.english,
          pronunciation: updatedData.pronunciation,
        }));
        // Update the word list display (English part)
        setAllWords((prevWords) =>
          prevWords.map((word) =>
            word.greek === selectedWordKey
              ? { ...word, english: updatedData.english }
              : word
          )
        );
      } catch (err) {
        console.error("WordEditor: Failed to save detail changes:", err);
        setError(`Update failed: ${err.message}. Please check the console.`);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedWordKey, selectedWordData, editEnglish, editPronunciation]
  ); // Dependencies

  /** Handler for resetting the statistics of the selected word */
  const handleResetStats = useCallback(async () => {
    if (!selectedWordKey || !selectedWordData) {
      console.warn("Reset stats attempt without selected word.");
      return;
    }

    // Confirmation dialog
    if (
      !window.confirm(
        `Are you sure you want to reset all statistics (attempts, learned status) for "${selectedWordKey}"? This cannot be undone.`
      )
    ) {
      return; // User cancelled
    }

    console.log(`WordEditor: Resetting stats for "${selectedWordKey}"`);
    setIsLoading(true);
    setMessage(""); // Clear previous messages
    setError(null); // Clear previous errors

    try {
      // Call the API function to reset stats
      const result = await resetWordStats(selectedWordKey);
      setMessage(result.message || "Stats reset successfully!");
      console.log("WordEditor: Reset stats successful:", result);

      // Re-fetch details to show the newly reset stats in the UI
      const updatedDetails = await fetchWordDetails(selectedWordKey);
      setSelectedWordData(updatedDetails);
      // Also reset the edit fields to match the (potentially unchanged) word data
      setEditGreek(updatedDetails.greek || "");
      setEditEnglish(updatedDetails.english || "");
      setEditPronunciation(updatedDetails.pronunciation || "");

      // Notify the parent component (App.js) to update overview stats if needed
      if (onStatsResetUpdate && result.updatedOverview) {
        onStatsResetUpdate(result.updatedOverview);
      }
    } catch (err) {
      console.error("WordEditor: Failed to reset stats:", err);
      setError(`Reset failed: ${err.message}. Please check the console.`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWordKey, selectedWordData, onStatsResetUpdate]); // Dependencies

  // --- Helper functions ---
  const calculateAccuracy = (data) => {
    /* ... as before ... */
  };
  const formatTimestamp = (ts) => {
    /* ... as before ... */
  };

  // --- Render Logic ---
  console.log(
    "WordEditor: Rendering. isLoading:",
    isLoading,
    "Selected Key:",
    selectedWordKey,
    "Selected Data:",
    !!selectedWordData
  );

  return (
    <div className="word-editor-overlay">
      <div className="word-editor-content">
        <button className="close-button" onClick={onClose} title="Close Editor">
          X
        </button>
        <h2>Edit Word Details & Stats</h2>

        {/* Word Selection Dropdown */}
        <div className="form-group">
          <label htmlFor="word-select">Select Word:</label>
          <select
            id="word-select"
            value={selectedWordKey}
            onChange={handleWordSelection}
            disabled={
              isLoading || !Array.isArray(allWords) || allWords.length === 0
            }
          >
            <option value="">
              {isLoading && !selectedWordKey
                ? "Loading words..."
                : `-- Select a Word (${
                    Array.isArray(allWords) ? allWords.length : 0
                  } loaded) --`}
            </option>
            {Array.isArray(allWords) &&
              allWords.map((word) =>
                // Basic check for valid word object structure
                word &&
                typeof word.greek === "string" &&
                typeof word.english === "string" ? (
                  <option key={word.greek} value={word.greek}>
                    {word.greek} ({word.english.substring(0, 30)}
                    {word.english.length > 30 ? "..." : ""})
                  </option>
                ) : null // Skip rendering invalid items
              )}
          </select>
        </div>

        {/* Loading/Error/Success Messages */}
        {isLoading && <p className="editor-loading">Loading...</p>}
        {error && <p className="editor-error">Error: {error}</p>}
        {message && <p className="editor-success">{message}</p>}

        {/* == Details and Edit Forms Area == */}
        {/* Only show this section if a word is selected AND details have loaded */}
        {selectedWordData && !isLoading && (
          <div className="editor-details">
            <h3>
              Editing:{" "}
              <span className="greek-word">{selectedWordData.greek}</span>{" "}
              (Group: {selectedWordData.group})
            </h3>

            {/* Container for the two edit forms */}
            <div className="edit-forms-container">
              {/* === Form 1: Renaming the Greek Word === */}
              <form
                onSubmit={handleRenameWord}
                className="edit-form rename-form"
              >
                <h4>Rename Greek Word</h4>
                <p className="form-note">
                  Change the primary Greek spelling here. This updates the word
                  and transfers stats.
                </p>
                <div className="form-group">
                  <label htmlFor="edit-greek">Greek Word:</label>
                  <input
                    type="text"
                    id="edit-greek"
                    value={editGreek} // Bound to editGreek state
                    onChange={(e) => setEditGreek(e.target.value)} // Update state on change
                    required
                    aria-describedby="greek-rename-help"
                  />
                  <small id="greek-rename-help">
                    The main identifier for the word.
                  </small>
                </div>
                <button
                  type="submit"
                  className="rename-button"
                  // Disable if loading OR if the input hasn't changed from the original
                  disabled={
                    isLoading || editGreek.trim() === selectedWordData.greek
                  }
                >
                  Rename "{selectedWordData.greek}"
                </button>
                {/* Show note if no change is detected */}
                {editGreek.trim() === selectedWordData.greek && (
                  <span className="no-change-note"> (No change)</span>
                )}
              </form>

              {/* === Form 2: Editing English Meaning and Pronunciation === */}
              <form
                onSubmit={handleSaveChanges}
                className="edit-form details-form"
              >
                <h4>Edit Details</h4>
                <p className="form-note">
                  Update the English translation(s) and pronunciation help.
                </p>
                <div className="form-group">
                  <label htmlFor="edit-english">English Meaning(s):</label>
                  <input
                    type="text"
                    id="edit-english"
                    value={editEnglish} // Bound to editEnglish state
                    onChange={(e) => setEditEnglish(e.target.value)} // Update state on change
                    required
                    aria-describedby="english-help"
                  />
                  <small id="english-help">
                    Separate multiple meanings with /
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-pronunciation">Pronunciation:</label>
                  <input
                    type="text"
                    id="edit-pronunciation"
                    value={editPronunciation} // Bound to editPronunciation state
                    onChange={(e) => setEditPronunciation(e.target.value)} // Update state on change
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="save-button"
                  // Disable if loading OR if neither English nor Pronunciation has changed
                  disabled={
                    isLoading ||
                    (editEnglish.trim() === selectedWordData.english &&
                      editPronunciation.trim() ===
                        selectedWordData.pronunciation)
                  }
                >
                  Save Detail Changes
                </button>
                {/* Show note if no change is detected */}
                {editEnglish.trim() === selectedWordData.english &&
                  editPronunciation.trim() ===
                    selectedWordData.pronunciation && (
                    <span className="no-change-note"> (No change)</span>
                  )}
              </form>
            </div>

            {/* === Statistics Section === */}
            <div className="stats-section">
              <h4>Statistics</h4>
              <p>
                Attempts: {selectedWordData.total_attempts} | Correct:{" "}
                {selectedWordData.correct_attempts} (
                {calculateAccuracy(selectedWordData)})
              </p>
              <p>Consecutive Correct: {selectedWordData.consecutive_correct}</p>
              <p>
                Recent Performance:{" "}
                {JSON.stringify(selectedWordData.recent_performance)}
              </p>
              <p>Last Seen: {formatTimestamp(selectedWordData.last_seen)}</p>
              <p>
                Learned Timestamp:{" "}
                {selectedWordData.learned_timestamp
                  ? formatTimestamp(selectedWordData.learned_timestamp)
                  : "Not Learned Permanently"}
              </p>
              <button
                onClick={handleResetStats}
                className="reset-stats-button"
                disabled={isLoading}
              >
                Reset Statistics for "{selectedWordData.greek}"
              </button>
            </div>
          </div> // End editor-details
        )}

        {/* Placeholder message if no word is selected yet */}
        {!selectedWordKey && !isLoading && (
          <p className="editor-info">
            Select a word from the list above to view/edit details and
            statistics.
          </p>
        )}
      </div>
    </div>
  );
}

export default WordEditor;
