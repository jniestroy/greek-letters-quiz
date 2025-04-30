import React from "react";
import { vocabularyList } from "../data/vocabulary"; // Import full list

// Shows stats for all words, could be enhanced to filter/sort
function WordPerformanceTable({ wordStats }) {
  return (
    <div className="performance-table-container">
      <h2>Word Performance</h2>
      <table className="performance-table">
        <thead>
          <tr>
            <th>Word</th>
            <th>Group</th>
            <th>Correct (Both)</th>
            <th>Attempts</th>
            <th>Accuracy</th>
            <th>Consecutive</th>
            <th>Recent (Last 5)</th>
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
            };
            const stats = wordStats[wordInfo.greek] || defaultStat;
            const accuracy =
              stats.totalAttempts > 0
                ? ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(
                    1
                  ) + "%"
                : "N/A";
            const recent =
              stats.recentPerformance.map((r) => (r ? "✓" : "✗")).join(" ") ||
              "-";
            return (
              <tr key={wordInfo.greek}>
                <td className="letter-symbol">{wordInfo.greek}</td>
                <td>{wordInfo.group}</td>
                <td>{stats.correctAttempts}</td>
                <td>{stats.totalAttempts}</td>
                <td>{accuracy}</td>
                <td>{stats.consecutiveCorrect}</td>
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
