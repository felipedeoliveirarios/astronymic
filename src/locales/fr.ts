export default {
  pageTitle: 'Astronymic · Des mots en constellations',
  pageDescription: 'Transformez les mots en constellations avec Astronymic.',
  atlas: 'Atlas de la constellation',
  menus: 'Menus de l’atlas',
  settings: 'Réglages de la constellation',
  info: 'Informations et alphabet',
  language: 'Langue',
  seed: 'Graine',
  seedPlaceholder: 'Automatique, à partir du texte',
  seedHelp: 'Le même mot et la même graine reproduisent le même dessin.',
  randomSky: 'Explorer un autre ciel',
  resetSeed: 'Revenir à la graine du texte',
  showLabels: 'Afficher l’ordre et les lettres',
  showDebug: 'Debug : secteurs et ramification',
  debugHelp:
    'Les éventails montrent les secteurs locaux. Les pourcentages indiquent les essais de ramification : ✓ branche créée, × arrêt. « Aucun essai » signifie qu’il ne reste pas assez de lettres pour une autre branche ; « fin » indique une feuille. Survolez les secteurs et les pourcentages pour voir les détails. Les éventails ne délimitent pas tout le sous-arbre.',
  credits: 'Code Astronymic créé par',
  infoHeading: 'Informations',
  readHeading: 'Comment lire',
  readHelp:
    'Partez de l’origine et suivez les segments en profondeur. À chaque jonction, parcourez les branches dans le sens horaire à partir de la direction de retour. Chaque lettre est un glyphe : ses branches internes et ses marques préservent son identité. Les marques supérieures et inférieures suivent la verticale globale de la page.',
  alphabetHeading: 'Alphabet A–Z',
  alphabetHelp:
    'Les grandes étoiles sont des sommets ; les petites sont des marques. Chaque exemple commence à gauche et se termine à droite. B/C et P/Q préservent l’ordre des chemins. J utilise un double trait et une marque inférieure pour se distinguer de I.',
  alphabetDirections:
    'Les marques occupent des bandes latérales dans la longueur visible de la ligne. Sur les arêtes exactement verticales, les marques supérieures se trouvent légèrement au-dessus et à droite ; les inférieures, en dessous et à gauche.',
  titleLabel: 'Titre de la constellation',
  titlePlaceholder: 'Écrivez votre univers',
  titleHelp:
    'Ce titre est modifiable. Changez le texte pour générer une nouvelle constellation.',
  letterOne: 'lettre',
  letterMany: 'lettres',
  seedCaption: 'GRAINE / {seed}',
  tooLong:
    'Le texte contient {count} lettres. Limitez-vous à {max} ; l’atlas conserve le dernier résultat valide.',
  warningOne:
    'Il reste {count} conflit entre les glyphes, les sommets ou les marques. Essayez une autre graine dans les réglages.',
  warningMany:
    'Il reste {count} conflits entre les glyphes, les sommets ou les marques. Essayez une autre graine dans les réglages.',
  emptyStatus: 'Saisissez au moins une lettre de A à Z pour commencer.',
  readyOne:
    '{count} glyphe dans l’ordre DFS · aucune collision géométrique détectée · graine {seed}',
  readyMany:
    '{count} glyphes dans l’ordre DFS · aucune collision géométrique détectée · graine {seed}',
  conflictsOne:
    'Il reste {count} conflit géométrique après {attempts}. Essayez une autre graine. Cette disposition nécessite encore des ajustements.',
  conflictsMany:
    'Il reste {count} conflits géométriques après {attempts}. Essayez une autre graine. Cette disposition nécessite encore des ajustements.',
  attemptOne: '{count} tentative d’insertion',
  attemptMany: '{count} tentatives d’insertion',
  svgTitle: 'Constellation de glyphes pour {text}',
  emptyText: 'texte vide',
  svgDescription:
    'Glyphes : {count}. Ordre : {text}. Conflits géométriques détectés : {issues}. Graine : {seed}. Versions : {versions}.',
  glyphName: 'Glyphe {letter}',
  referenceGlyph: 'Glyphe {letter} ; entrée à gauche, sortie à droite',
  origin: 'Origine',
  junction: 'Jonction {index} ({letter})',
  branchEnd: 'fin',
  branchNoTest: '{probability} · aucun essai',
  branchEmpty: 'Il ne reste plus de lettres.',
  branchBudget: 'Toutes les lettres disponibles ont été utilisées.',
  branchFailure:
    'Le premier essai infructueux a arrêté la création de branches supplémentaires.',
  branchInheritance:
    'Probabilité transmise aux descendants : {probability}. {reason}',
  branchTooltip:
    '{name} : probabilité initiale {probability}. {tests}. {detail}',
  sectorTooltip:
    'Segment {index} ({letter}) : secteur {width}°, début {start}°, décalage {offset}°.',
};
