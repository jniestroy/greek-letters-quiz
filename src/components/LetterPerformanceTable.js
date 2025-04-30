import React from "react";
import { greekLetters } from "../data/letters"; // Import data

function LetterPerformanceTable({ letterStats }) {
  return (
    <div className="performance-table-container">
      <h2>Letter Performance</h2>
      <table className="performance-table">
        <thead>
          <tr>
            <th>Letter</th>
            <th>Name</th>
            <th>Correct (Both)</th>
            <th>Attempts</th>
            <th>Accuracy</th>
            <th>Consecutive</th>
            <th>Recent (Last 5)</th>
          </tr>
        </thead>
        <tbody>
          {greekLetters.map((letterInfo) => {
            if (!letterInfo || !letterInfo.letter) return null;
            const defaultStat = {
              correctAttempts: 0,
              totalAttempts: 0,
              consecutiveCorrect: 0,
              recentPerformance: [],
            };
            const stats = letterStats[letterInfo.letter] || defaultStat;
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
              <tr key={letterInfo.letter}>
                <td className="letter-symbol">{letterInfo.letter}</td>
                <td>{letterInfo.name}</td>
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

export default LetterPerformanceTable;
