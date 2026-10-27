export default {
  pageTitle: 'Astronymic · Palavras em constelações',
  pageDescription: 'Transforme palavras em constelações com o Astronymic.',
  atlas: 'Atlas da constelação',
  menus: 'Menus do atlas',
  settings: 'Controles da constelação',
  info: 'Informações e alfabeto',
  language: 'Idioma',
  seed: 'Semente',
  seedPlaceholder: 'Automática, a partir do texto',
  seedHelp: 'A mesma palavra e semente recriam o mesmo desenho.',
  randomSky: 'Explorar outro céu',
  resetSeed: 'Voltar à semente do texto',
  showLabels: 'Mostrar ordem e letras',
  showDebug: 'Debug: setores e ramificação',
  debugHelp:
    'Leques mostram os setores locais. Percentuais indicam os testes de ramificação: ✓ criou ramo, × encerrou. “Sem teste” indica falta de letras para outro ramo; “fim” é uma folha. Passe o mouse nos setores e percentuais para mais detalhes. Os leques não delimitam toda a subárvore.',
  credits: 'Código Astronymic criado por',
  infoHeading: 'Informações',
  readHeading: 'Como ler',
  readHelp:
    'Comece na origem e siga os segmentos em profundidade. Em cada junção, percorra os ramos no sentido horário a partir da direção de retorno. Cada letra é um glifo: os ramos internos e as marcas preservam sua identidade. Marcas acima/abaixo seguem a vertical da página.',
  alphabetHeading: 'Alfabeto A–Z',
  alphabetHelp:
    'As estrelas maiores são vértices; as menores são marcas. A entrada está à esquerda e a saída à direita em cada exemplo. B/C e P/Q preservam a ordem dos caminhos. J usa traço duplo e marca inferior para se distinguir de I.',
  alphabetDirections:
    'Marcas ficam nas faixas laterais da linha, dentro de seu comprimento visível. Em arestas exatamente verticais, superiores ficam um pouco acima e à direita; inferiores, abaixo e à esquerda.',
  titleLabel: 'Título da constelação',
  titlePlaceholder: 'Escreva seu universo',
  titleHelp:
    'Este título é editável. Altere o texto para gerar uma nova constelação.',
  letterOne: 'letra',
  letterMany: 'letras',
  seedCaption: 'SEMENTE / {seed}',
  tooLong:
    'O texto contém {count} letras. Use até {max}; o atlas mantém o último resultado válido.',
  warningOne:
    'Persiste {count} conflito entre glifos, vértices ou marcas. Experimente outra semente nos ajustes.',
  warningMany:
    'Persistem {count} conflitos entre glifos, vértices ou marcas. Experimente outra semente nos ajustes.',
  emptyStatus: 'Digite ao menos uma letra de A a Z para começar.',
  readyOne:
    '{count} glifo em ordem DFS · nenhuma colisão geométrica detectada · semente {seed}',
  readyMany:
    '{count} glifos em ordem DFS · nenhuma colisão geométrica detectada · semente {seed}',
  conflictsOne:
    'Persiste {count} conflito geométrico após {attempts}. Experimente outra semente. Este layout ainda precisa de ajuste.',
  conflictsMany:
    'Persistem {count} conflitos geométricos após {attempts}. Experimente outra semente. Este layout ainda precisa de ajuste.',
  attemptOne: '{count} tentativa de injeção',
  attemptMany: '{count} tentativas de injeção',
  svgTitle: 'Constelação de glifos para {text}',
  emptyText: 'texto vazio',
  svgDescription:
    'Glifos: {count}. Ordem: {text}. Conflitos geométricos detectados: {issues}. Semente: {seed}. Versões: {versions}.',
  glyphName: 'Glifo {letter}',
  referenceGlyph: 'Glifo {letter}; entrada à esquerda, saída à direita',
  origin: 'Origem',
  junction: 'Junção {index} ({letter})',
  branchEnd: 'fim',
  branchNoTest: '{probability} · sem teste',
  branchEmpty: 'Sem letras restantes.',
  branchBudget: 'Orçamento de letras esgotado.',
  branchFailure:
    'O primeiro teste sem sucesso encerrou as ramificações adicionais.',
  branchInheritance:
    'Probabilidade herdada pelos descendentes: {probability}. {reason}',
  branchTooltip:
    '{name}: probabilidade inicial {probability}. {tests}. {detail}',
  sectorTooltip:
    'Segmento {index} ({letter}): setor {width}°, início {start}°, desvio {offset}°.',
};
