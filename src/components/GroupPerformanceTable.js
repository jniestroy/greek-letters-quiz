import React, { useMemo } from "react";
import { vocabularyList, allGroups } from "../data/vocabulary";

// Accept isWordLearned
function GroupPerformanceTable({ wordStats, isWordLearned }) {
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
          isGroupLearned: false,
        };
      }

      let totalCorrect = 0;
      let totalAttempts = 0;
      let allWordsInGroupLearned = true; // Flag for group learned status

      wordsInGroup.forEach((word) => {
        const stats = wordStats[word.greek] || {
          correctAttempts: 0,
          totalAttempts: 0,
        };
        totalCorrect += stats.correctAttempts;
        totalAttempts += stats.totalAttempts;
        // Check if *this* word is learned
        if (!isWordLearned(word.greek, wordStats)) {
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
        isGroupLearned: allWordsInGroupLearned, // Store group learned status
      };
    });
    // Recalculate when wordStats or the learned check function changes
  }, [wordStats, isWordLearned]);

  return (
    <div className="performance-table-container">
      <h2>Group Performance Summary</h2>
      <table className="performance-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Learned?</th> {/* New Header */}
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
              {" "}
              {/* Optional styling */}
              <td style={{ textAlign: "center" }}>{data.groupNum}</td>
              <td style={{ textAlign: "center" }}>
                {data.isGroupLearned ? "🏆 Yes" : "No"}
              </td>{" "}
              {/* Display Group Learned */}
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
