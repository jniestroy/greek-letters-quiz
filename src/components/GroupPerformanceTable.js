import React, { useMemo } from "react";
import { vocabularyList, allGroups } from "../data/vocabulary";

// REMOVE isWordLearned prop
function GroupPerformanceTable({ wordStats }) {
  // Ensure wordStats is usable, provide empty object as fallback
  const safeWordStats = wordStats || {};

  const groupData = useMemo(() => {
    return allGroups.map((groupNum) => {
      const wordsInGroup = vocabularyList.filter((w) => w.group === groupNum);
      if (wordsInGroup.length === 0) {
        return {
          groupNum,
          totalAttempts: 0,
          totalCorrect: 0,
          accuracy: "N/A",
          wordCount: 0,
          isGroupLearned: false, // Default for empty groups
        };
      }

      let totalCorrect = 0;
      let totalAttempts = 0;
      let allWordsInGroupLearned = true; // Assume learned until proven otherwise

      wordsInGroup.forEach((word) => {
        // Use safeWordStats and provide default
        const stats = safeWordStats[word.greek] || {
          correctAttempts: 0,
          totalAttempts: 0,
          isLearned: false, // Add default isLearned
        };
        totalCorrect += stats.correctAttempts;
        totalAttempts += stats.totalAttempts;

        // *** USE THE isLearned FLAG from stats object ***
        if (!stats.isLearned) {
          allWordsInGroupLearned = false; // If any word isn't learned, the group isn't
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
        wordCount: wordsInGroup.length,
        isGroupLearned: allWordsInGroupLearned,
      };
    });
    // Recalculate only when wordStats changes
  }, [safeWordStats]); // REMOVE isWordLearned dependency

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
          {groupData.map((data) => (
            <tr
              key={data.groupNum}
              className={data.isGroupLearned ? "learned-row" : ""}
            >
              <td style={{ textAlign: "center" }}>{data.groupNum}</td>
              <td style={{ textAlign: "center" }}>
                {data.isGroupLearned ? "🏆 Yes" : "No"}
              </td>
              <td style={{ textAlign: "center" }}>{data.wordCount}</td>
              <td style={{ textAlign: "center" }}>{data.totalCorrect}</td>
              <td style={{ textAlign: "center" }}>{data.totalAttempts}</td>
              <td style={{ textAlign: "center" }}>{data.accuracy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GroupPerformanceTable;
