export default {
  pageTitle: 'Astronymic · Palabras en constelaciones',
  pageDescription: 'Transforma palabras en constelaciones con Astronymic.',
  atlas: 'Atlas de la constelación',
  menus: 'Menús del atlas',
  settings: 'Ajustes de la constelación',
  info: 'Información y alfabeto',
  language: 'Idioma',
  seed: 'Semilla',
  seedPlaceholder: 'Automática, a partir del texto',
  seedHelp: 'La misma palabra y semilla reproducen el mismo dibujo.',
  randomSky: 'Explorar otro cielo',
  resetSeed: 'Usar la semilla del texto',
  showLabels: 'Mostrar orden y letras',
  showDebug: 'Debug: sectores y ramificación',
  debugHelp:
    'Los abanicos muestran los sectores locales. Los porcentajes indican las pruebas de ramificación: ✓ creó una rama, × terminó. «Sin prueba» indica que no hay suficientes letras para otra rama; «fin» indica una hoja. Pasa el cursor por los sectores y porcentajes para ver detalles. Los abanicos no delimitan todo el subárbol.',
  exportFormat: 'Formato de imagen',
  formatPoster: 'Póster · 4:5',
  formatLandscape: 'Horizontal · 16:9',
  formatPortrait: 'Vertical · 9:16',
  exportPng: 'Exportar imagen (PNG)',
  exporting: 'Exportando imagen…',
  exportSuccess: 'Imagen exportada.',
  exportError: 'No se pudo exportar la imagen. Inténtalo de nuevo.',
  credits: 'Código Astronymic creado por',
  infoHeading: 'Información',
  readHeading: 'Cómo leer',
  readHelp:
    'Empieza en el origen y sigue los segmentos en profundidad. En cada unión, recorre las ramas en sentido horario desde la dirección de regreso. Cada letra es un glifo: sus ramas internas y marcas preservan su identidad. Las marcas superiores e inferiores siguen la vertical global de la página.',
  alphabetHeading: 'Alfabeto A–Z',
  alphabetHelp:
    'Las estrellas grandes son vértices; las pequeñas son marcas. Cada ejemplo empieza a la izquierda y termina a la derecha. B/C y P/Q preservan el orden de los caminos. J utiliza un trazo doble y una marca inferior para distinguirse de I.',
  alphabetDirections:
    'Las marcas ocupan franjas laterales dentro de la longitud visible de la línea. En aristas exactamente verticales, las superiores quedan un poco arriba y a la derecha; las inferiores, abajo y a la izquierda.',
  titleLabel: 'Título de la constelación',
  titlePlaceholder: 'Escribe tu universo',
  titleHelp:
    'Este título es editable. Cambia el texto para generar una nueva constelación.',
  letterOne: 'letra',
  letterMany: 'letras',
  seedCaption: 'SEMILLA / {seed}',
  tooLong:
    'El texto contiene {count} letras. Usa hasta {max}; el atlas conserva el último resultado válido.',
  warningOne:
    'Persiste {count} conflicto entre glifos, vértices o marcas. Prueba otra semilla en los ajustes.',
  warningMany:
    'Persisten {count} conflictos entre glifos, vértices o marcas. Prueba otra semilla en los ajustes.',
  emptyStatus: 'Escribe al menos una letra de la A a la Z para empezar.',
  readyOne:
    '{count} glifo en orden DFS · ninguna colisión geométrica detectada · semilla {seed}',
  readyMany:
    '{count} glifos en orden DFS · ninguna colisión geométrica detectada · semilla {seed}',
  conflictsOne:
    'Persiste {count} conflicto geométrico después de {attempts}. Prueba otra semilla. Este diseño aún necesita ajustes.',
  conflictsMany:
    'Persisten {count} conflictos geométricos después de {attempts}. Prueba otra semilla. Este diseño aún necesita ajustes.',
  attemptOne: '{count} intento de inserción',
  attemptMany: '{count} intentos de inserción',
  svgTitle: 'Constelación de glifos para {text}',
  emptyText: 'texto vacío',
  svgDescription:
    'Glifos: {count}. Orden: {text}. Conflictos geométricos detectados: {issues}. Semilla: {seed}. Versiones: {versions}.',
  glyphName: 'Glifo {letter}',
  referenceGlyph: 'Glifo {letter}; entrada a la izquierda, salida a la derecha',
  origin: 'Origen',
  junction: 'Unión {index} ({letter})',
  branchEnd: 'fin',
  branchNoTest: '{probability} · sin prueba',
  branchEmpty: 'No quedan letras.',
  branchBudget: 'Se agotó la cantidad de letras disponibles.',
  branchFailure:
    'La primera prueba fallida terminó la creación de ramas adicionales.',
  branchInheritance:
    'Probabilidad heredada por los descendientes: {probability}. {reason}',
  branchTooltip:
    '{name}: probabilidad inicial {probability}. {tests}. {detail}',
  sectorTooltip:
    'Segmento {index} ({letter}): sector {width}°, inicio {start}°, desviación {offset}°.',
};
