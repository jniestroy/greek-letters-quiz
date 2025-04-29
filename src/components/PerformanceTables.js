import React from "react";
import LetterPerformanceTable from "./LetterPerformanceTable";
import WordPerformanceTable from "./WordPerformanceTable";
import GroupPerformanceTable from "./GroupPerformanceTable";

// Pass isWordLearned down
function PerformanceTables({ appMode, letterStats, wordStats, isWordLearned }) {
  if (appMode === "quiz") {
    return <LetterPerformanceTable letterStats={letterStats} />;
  } else if (appMode === "vocabFocus") {
    return (
      <>
        {/* Pass the function down */}
        <WordPerformanceTable
          wordStats={wordStats}
          isWordLearned={isWordLearned}
        />
        {/* Group table implicitly uses isWordLearned via wordStats */}
        <GroupPerformanceTable
          wordStats={wordStats}
          isWordLearned={isWordLearned}
        />
      </>
    );
  } else {
    return null; // Or some default/error view
  }
}

export default PerformanceTables;
