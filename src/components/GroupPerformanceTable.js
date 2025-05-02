import React, { useMemo } from "react";

// Removed the import of static vocabularyList and allGroups

function GroupPerformanceTable({ wordStats }) {
  // Ensure wordStats is usable, provide empty object as fallback
  const safeWordStats = wordStats || {};

  // Calculate group data dynamically from the wordStats prop
  const groupData = useMemo(() => {
    // 1. Group words by their group number from the stats object
    const wordsByGroup = {};
    Object.entries(safeWordStats).forEach(([greekWord, stats]) => {
      // Use 0 or a placeholder if group is missing, though it shouldn't be
      const groupNum = stats.group !== undefined ? stats.group : "Unknown";
      if (!wordsByGroup[groupNum]) {
        wordsByGroup[groupNum] = [];
      }
      // Store the full stats object for each word within its group
      wordsByGroup[groupNum].push(stats);
    });

    // 2. Get sorted group numbers present in the data
    const sortedGroupNumbers = Object.keys(wordsByGroup)
      .map(Number) // Convert keys to numbers for proper sorting
      .sort((a, b) => a - b);

    // 3. Calculate stats for each group
    return sortedGroupNumbers.map((groupNum) => {
      const wordsInThisGroup = wordsByGroup[groupNum] || []; // Should always exist here

      let totalCorrect = 0;
      let totalAttempts = 0;
      let allWordsInGroupLearned = wordsInThisGroup.length > 0; // Start assuming true only if group has words

      wordsInThisGroup.forEach((stats) => {
        totalCorrect += stats.correctAttempts || 0; // Add safety checks
        totalAttempts += stats.totalAttempts || 0;

        // Check the isLearned flag directly from the stats object
        if (!stats.isLearned) {
          allWordsInGroupLearned = false;
        }
      });

      const accuracy =
        totalAttempts > 0
          ? ((totalCorrect / totalAttempts) * 100).toFixed(1) + "%"
          : "N/A";

      return {
        groupNum,
        totalAttempts,
        totalCorrect,
        accuracy,
        wordCount: wordsInThisGroup.length,
        isGroupLearned: allWordsInGroupLearned,
      };
    });
    // Recalculate only when wordStats changes
  }, [safeWordStats]); // Dependency is correct

  return (
    <div className="performance-table-container">
      <h2>Group Performance Summary</h2>
      <table className="performance-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Learned?</th>
            <th>Words</th>
            <th>Total Correct</th>
            <th>Total Attempts</th>
            <th>Overall Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {/* Render the calculated group data */}
          {groupData.map((data) => (
            <tr
              key={data.groupNum}
              className={data.isGroupLearned ? "learned-row" : ""}
            >
              <td style={{ textAlign: "center" }}>{data.groupNum}</td>
              <td style={{ textAlign: "center" }}>
                {/* Display Learned Status based on calculation */}
                {data.isGroupLearned ? "🏆 Yes" : "No"}
              </td>
              <td style={{ textAlign: "center" }}>{data.wordCount}</td>
              <td style={{ textAlign: "center" }}>{data.totalCorrect}</td>
              <td style={{ textAlign: "center" }}>{data.totalAttempts}</td>
              <td style={{ textAlign: "center" }}>{data.accuracy}</td>
            </tr>
          ))}
          {/* Optional: Add a message if there are no groups/stats */}
          {groupData.length === 0 && (
            <tr>
              <td colSpan="6">No group statistics available yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GroupPerformanceTable;
