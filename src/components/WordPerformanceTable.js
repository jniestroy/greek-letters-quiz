import React from "react";
import { vocabularyList } from "../data/vocabulary"; // Import full list

// Shows stats for all words, could be enhanced to filter/sort
function WordPerformanceTable({ wordStats }) {
  // Ensure wordStats is usable, provide empty object as fallback
  const safeWordStats = wordStats || {};

  return (
    <div className="performance-table-container">
      <h2>Word Performance</h2>
      <table className="performance-table">
        <thead>
          <tr>
            <th>Word</th>
            <th>Group</th>
            <th>Learned?</th> {/* <-- ADDED Column Header */}
            <th>Correct</th> {/* Simplified Header */}
            <th>Attempts</th>
            <th>Accuracy</th>
            <th>Consecutive</th>
            <th>Recent (Last 4)</th>{" "}
            {/* Adjusted length based on LEARNED_MIN_SEEN */}
          </tr>
        </thead>
        <tbody>
          {vocabularyList.map((wordInfo) => {
            if (!wordInfo || !wordInfo.greek) return null;
            const defaultStat = {
              correctAttempts: 0,
              totalAttempts: 0,
              consecutiveCorrect: 0,
              recentPerformance: [],
              isLearned: false, // Add default for safety
              group: wordInfo.group, // Include group from wordInfo
              pronunciation: wordInfo.pronunciation, // Include details if needed
              english: wordInfo.english,
            };
            // Use safeWordStats and provide defaultStat
            const stats = safeWordStats[wordInfo.greek] || defaultStat;
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

            return (
              // Add learned-row class for styling consistency
              <tr key={wordInfo.greek} className={learned ? "learned-row" : ""}>
                <td className="letter-symbol">{wordInfo.greek}</td>
                {/* Use group from stats if available, fallback to wordInfo */}
                <td>
                  {stats.group !== undefined ? stats.group : wordInfo.group}
                </td>
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
        </tbody>
      </table>
    </div>
  );
}

export default WordPerformanceTable;
