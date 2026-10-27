export default {
  pageTitle: 'Astronymic · Words into constellations',
  pageDescription: 'Turn words into constellations with Astronymic.',
  atlas: 'Constellation atlas',
  menus: 'Atlas menus',
  settings: 'Constellation settings',
  info: 'Information and alphabet',
  language: 'Language',
  seed: 'Seed',
  seedPlaceholder: 'Automatic, based on the text',
  seedHelp: 'The same word and seed recreate the same drawing.',
  randomSky: 'Explore another sky',
  resetSeed: 'Use the text-based seed',
  showLabels: 'Show order and letters',
  showDebug: 'Debug: sectors and branching',
  debugHelp:
    'Fans show local sectors. Percentages indicate branching trials: ✓ created a branch, × stopped. “No trial” means there are not enough letters for another branch; “end” marks a leaf. Hover over sectors and percentages for details. Fans do not bound the entire subtree.',
  exportHeading: 'Export constellation',
  exportHelp:
    'Choose a format and download the map as a high-resolution PNG image.',
  exportFormat: 'Image format',
  formatPoster: 'Poster · 4:5',
  formatLandscape: 'Landscape · 16:9',
  formatPortrait: 'Portrait · 9:16',
  exportPng: 'Download PNG image',
  exporting: 'Exporting image…',
  exportSuccess: 'Image exported.',
  exportError: 'Could not export the image. Please try again.',
  credits: 'Astronymic code created by',
  infoHeading: 'Information',
  readHeading: 'How to read',
  readHelp:
    'Start at the origin and follow the segments depth first. At each junction, explore branches clockwise from the direction back to the previous vertex. Each letter is a glyph: its internal branches and marks preserve its identity. Above/below marks follow the page’s global vertical direction.',
  alphabetHeading: 'Alphabet A–Z',
  alphabetHelp:
    'Larger stars are vertices; smaller ones are marks. Each example starts on the left and ends on the right. B/C and P/Q preserve path order. J uses a double stroke and a lower mark to distinguish it from I.',
  alphabetDirections:
    'Marks sit in lateral bands within the visible length of the line. On exactly vertical edges, upper marks sit slightly above and to the right; lower marks, below and to the left.',
  titleLabel: 'Constellation title',
  titlePlaceholder: 'Write your universe',
  titleHelp:
    'This title is editable. Change the text to generate a new constellation.',
  letterOne: 'letter',
  letterMany: 'letters',
  seedCaption: 'SEED / {seed}',
  tooLong:
    'The text contains {count} letters. Use up to {max}; the atlas keeps the last valid result.',
  warningOne:
    '{count} conflict between glyphs, vertices or marks remains. Try another seed in settings.',
  warningMany:
    '{count} conflicts between glyphs, vertices or marks remain. Try another seed in settings.',
  emptyStatus: 'Enter at least one letter from A to Z to begin.',
  readyOne:
    '{count} glyph in DFS order · no geometric collision detected · seed {seed}',
  readyMany:
    '{count} glyphs in DFS order · no geometric collision detected · seed {seed}',
  conflictsOne:
    '{count} geometric conflict remains after {attempts}. Try another seed. This layout still needs adjustment.',
  conflictsMany:
    '{count} geometric conflicts remain after {attempts}. Try another seed. This layout still needs adjustment.',
  attemptOne: '{count} injection attempt',
  attemptMany: '{count} injection attempts',
  svgTitle: 'Glyph constellation for {text}',
  emptyText: 'empty text',
  svgDescription:
    'Glyphs: {count}. Order: {text}. Geometric conflicts detected: {issues}. Seed: {seed}. Versions: {versions}.',
  glyphName: 'Glyph {letter}',
  referenceGlyph: 'Glyph {letter}; entry on the left, exit on the right',
  origin: 'Origin',
  junction: 'Junction {index} ({letter})',
  branchEnd: 'end',
  branchNoTest: '{probability} · no trial',
  branchEmpty: 'No letters remaining.',
  branchBudget: 'Letter budget exhausted.',
  branchFailure: 'The first unsuccessful trial stopped additional branching.',
  branchInheritance:
    'Probability inherited by descendants: {probability}. {reason}',
  branchTooltip: '{name}: initial probability {probability}. {tests}. {detail}',
  sectorTooltip:
    'Segment {index} ({letter}): sector {width}°, start {start}°, offset {offset}°.',
};
