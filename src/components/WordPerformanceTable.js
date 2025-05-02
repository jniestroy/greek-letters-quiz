import React from "react";

// Removed the import of the static vocabularyList

// Shows stats using the data fetched from the backend
function WordPerformanceTable({ wordStats }) {
  // Ensure wordStats is usable, provide empty object as fallback
  const safeWordStats = wordStats || {};

  // Get the keys (Greek words) and sort them, perhaps alphabetically or by group
  // Sorting by group then alphabetically is often useful
  const sortedWordKeys = Object.keys(safeWordStats).sort((a, b) => {
    const statsA = safeWordStats[a];
    const statsB = safeWordStats[b];
    // Sort primarily by group number
    if (statsA.group !== statsB.group) {
      return (statsA.group || 0) - (statsB.group || 0); // Handle potential missing group
    }
    // Then sort alphabetically by Greek word
    return a.localeCompare(b);
  });

  return (
    <div className="performance-table-container">
      <h2>Word Performance</h2>
      <table className="performance-table">
        <thead>
          <tr>
            <th>Word</th>
            <th>Group</th>
            <th>Learned?</th>
            <th>Correct</th>
            <th>Attempts</th>
            <th>Accuracy</th>
            <th>Consecutive</th>
            <th>
              Recent (Last{" "}
              {(wordStats &&
                Object.values(wordStats)[0]?.recentPerformance?.length) ||
                "N"}
              )
            </th>{" "}
            {/* Dynamic recent length */}
          </tr>
        </thead>
        <tbody>
          {/* Iterate over the keys of the wordStats object */}
          {sortedWordKeys.map((greekWord) => {
            // Get the stats object for the current Greek word
            // No need for defaultStat here, as we only iterate over existing keys
            const stats = safeWordStats[greekWord];

            // Skip rendering if stats object is somehow missing (shouldn't happen with Object.keys)
            if (!stats) return null;

            const accuracy =
              stats.totalAttempts > 0
                ? ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(
                    1
                  ) + "%"
                : "N/A";

            // Ensure recentPerformance is an array before mapping
            const recentPerfArray = Array.isArray(stats.recentPerformance)
              ? stats.recentPerformance
              : [];
            const recent =
              recentPerfArray.map((r) => (r ? "✓" : "✗")).join(" ") || "-";

            // Use the isLearned flag directly from the stats object
            const learned = stats.isLearned;

            // Get group number directly from stats object (fetched from backend)
            const group = stats.group !== undefined ? stats.group : "N/A";

            return (
              // Add learned-row class for styling consistency
              <tr key={greekWord} className={learned ? "learned-row" : ""}>
                {/* Display the Greek word (the key) */}
                <td className="letter-symbol">{greekWord}</td>
                {/* Display group from stats */}
                <td>{group}</td>
                {/* Display Learned Status */}
                <td style={{ textAlign: "center" }}>
                  {learned ? "🏆 Yes" : "No"}
                </td>
                <td>{stats.correctAttempts}</td>
                <td>{stats.totalAttempts}</td>
                <td>{accuracy}</td>
                <td>{stats.consecutiveCorrect}</td>
                {/* Display recent performance */}
                <td>{recent}</td>
              </tr>
            );
          })}
          {/* Optional: Add a message if there are no word stats */}
          {sortedWordKeys.length === 0 && (
            <tr>
              <td colSpan="8">No word statistics available yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default WordPerformanceTable;
