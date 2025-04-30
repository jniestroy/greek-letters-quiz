import React from "react";
import LetterPerformanceTable from "./LetterPerformanceTable";
import WordPerformanceTable from "./WordPerformanceTable";
import GroupPerformanceTable from "./GroupPerformanceTable";

// REMOVE isWordLearned from props
function PerformanceTables({ appMode, letterStats, wordStats }) {
  if (appMode === "quiz") {
    return <LetterPerformanceTable letterStats={letterStats} />;
  } else if (appMode === "vocabFocus") {
    return (
      <>
        {/* Pass only wordStats - isLearned is inside it */}
        <WordPerformanceTable wordStats={wordStats} />
        {/* Pass only wordStats - isLearned is inside it */}
        <GroupPerformanceTable wordStats={wordStats} />
      </>
    );
  } else {
    return null;
  }
}

export default PerformanceTables;
