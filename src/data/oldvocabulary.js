export const vocabularyList = [
  // Group 1: Core Nouns
  { group: 1, greek: "θεός", english: "God", pronunciation: "theos" },
  { group: 1, greek: "λόγος", english: "word", pronunciation: "logos" },
  {
    group: 1,
    greek: "κύριος",
    english: "Lord/master",
    pronunciation: "kyrios",
  },
  {
    group: 1,
    greek: "οὐρανός",
    english: "heaven/sky",
    pronunciation: "ouranos",
  },
  {
    group: 1,
    greek: "ἄνθρωπος",
    english: "man/human",
    pronunciation: "anthropos",
  },
  // Group 2: Core Verbs
  { group: 2, greek: "εἰμί", english: "I am", pronunciation: "eimi" },
  { group: 2, greek: "λέγω", english: "I say/speak", pronunciation: "lego" },
  {
    group: 2,
    greek: "ἀκούω",
    english: "I hear/listen",
    pronunciation: "akouo",
  },
  {
    group: 2,
    greek: "πιστεύω",
    english: "I believe/trust",
    pronunciation: "pisteuo",
  },
  { group: 2, greek: "γινώσκω", english: "I know", pronunciation: "ginosko" },
  // Group 3: Common Adjectives/Pronouns
  { group: 3, greek: "ἀγαθός", english: "good", pronunciation: "agathos" },
  {
    group: 3,
    greek: "καλός",
    english: "good/beautiful",
    pronunciation: "kalos",
  },
  {
    group: 3,
    greek: "αὐτός",
    english: "he/she/it/self",
    pronunciation: "autos",
  },
  { group: 3, greek: "ἐγώ", english: "I", pronunciation: "ego" },
  { group: 3, greek: "σύ", english: "you (sg)", pronunciation: "su" },
  // Group 4: Conjunctions/Prepositions
  { group: 4, greek: "καί", english: "and/also/even", pronunciation: "kai" },
  { group: 4, greek: "δέ", english: "but/and", pronunciation: "de" },
  { group: 4, greek: "ἐν", english: "in/on/at", pronunciation: "en" },
  { group: 4, greek: "εἰς", english: "into/to/for", pronunciation: "eis" },
  { group: 4, greek: "ἐκ", english: "from/out of", pronunciation: "ek" },
  // Group 5: More Nouns/Concepts
  { group: 5, greek: "ἀγάπη", english: "love", pronunciation: "agape" },
  {
    group: 5,
    greek: "πνεῦμα",
    english: "spirit/wind/breath",
    pronunciation: "pneuma",
  },
  { group: 5, greek: "πατήρ", english: "father", pronunciation: "pater" },
  { group: 5, greek: "υἱός", english: "son", pronunciation: "huios" },
  { group: 5, greek: "ἀλήθεια", english: "truth", pronunciation: "aletheia" },
  // Group 6: Useful Verbs
  { group: 6, greek: "ἔχω", english: "I have/hold", pronunciation: "echo" },
  { group: 6, greek: "ποιέω", english: "I do/make", pronunciation: "poieo" },
  {
    group: 6,
    greek: "βλέπω",
    english: "I see/look at",
    pronunciation: "blepo",
  },
  {
    group: 6,
    greek: "λαμβάνω",
    english: "I take/receive",
    pronunciation: "lambano",
  },
  {
    group: 6,
    greek: "ἔρχομαι",
    english: "I come/go",
    pronunciation: "erchomai",
  },
  // Group 7: Time/Place
  { group: 7, greek: "νῦν", english: "now", pronunciation: "nun" },
  {
    group: 7,
    greek: "τότε",
    english: "then/at that time",
    pronunciation: "tote",
  },
  { group: 7, greek: "ὧδε", english: "here", pronunciation: "hode" },
  { group: 7, greek: "ἐκεῖ", english: "there", pronunciation: "ekei" },
  { group: 7, greek: "ἡμέρα", english: "day", pronunciation: "hemera" },
  // Add many more...
];

// Basic words for the simpler quiz mode
export const basicGreekWords = vocabularyList.filter((w) => w.group === 1); // Use all of group 1

// Helpers for groups
export const allGroups = [
  ...new Set(vocabularyList.map((word) => word.group)),
].sort((a, b) => a - b);
export const maxGroup = allGroups.length > 0 ? Math.max(...allGroups) : 0;
