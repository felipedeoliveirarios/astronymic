export function mountAtlas() {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `
  <main class="poster" aria-label="Atlas da constelação">
    <header class="poster-top">
      <a class="brand" href="./">ASTRONYMIC</a>
      <nav class="atlas-menus" aria-label="Menus do atlas">
      <details id="controls-menu" class="controls-menu" name="atlas-menu">
        <summary aria-label="Abrir controles da constelação" title="Controles da constelação">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></svg>
        </summary>
        <div class="controls">
          <label for="seed">SEED</label>
          <input id="seed" placeholder="Automática, a partir do texto" maxlength="100" autocomplete="off" aria-describedby="seed-help" />
          <p id="seed-help" class="help">A mesma palavra e seed recriam o mesmo desenho.</p>
          <button id="random" class="primary" type="button">Explorar outro céu <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
          <button id="reset" class="secondary" type="button">Voltar à seed do texto</button>
          <div class="rule"></div>
          <label class="check"><input id="labels" type="checkbox" checked /><span>Mostrar ordem e letras</span></label>
          <label class="check"><input id="debug" type="checkbox" aria-describedby="debug-help" /><span>Debug: setores e branching</span></label>
          <p id="debug-help" class="help" hidden>Leques mostram os setores locais. Percentuais indicam os testes de ramificação: ✓ criou ramo, × encerrou. “Sem teste” indica falta de letras para outro ramo; “fim” é uma folha. Passe o mouse nos setores e percentuais para mais detalhes. Os leques não delimitam toda a subárvore.</p>
        </div>
      </details>
      <details id="info-menu" class="controls-menu" name="atlas-menu">
        <summary aria-label="Informações e alfabeto" title="Informações e alfabeto">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1" stroke-linecap="round"/></svg>
        </summary>
        <div class="controls info-panel">
          <h2 class="panel-title">Informações</h2>
          <details class="reading-help"><summary>Como ler</summary><p>Comece na origem e siga os segmentos em profundidade. Em cada junção, percorra os ramos no sentido horário a partir da direção de retorno. Cada letra é um glifo: os ramos internos e as marcas preservam sua identidade. Marcas acima/abaixo seguem a vertical da página.</p></details>
          <details class="reading-help alphabet-help"><summary>Alfabeto A–Z</summary><div id="glyph-reference"></div><p>As estrelas maiores são vértices; as menores são marcas. A entrada está à esquerda e a saída à direita em cada exemplo. B/C e P/Q preservam a ordem dos caminhos. J usa traço duplo e marca inferior para se distinguir de I.</p><p>Marcas ficam nas faixas laterais da linha, dentro de seu comprimento visível. Em arestas exatamente verticais, superiores ficam um pouco acima e à direita; inferiores, abaixo e à esquerda.</p></details>
          <div class="metadata"><span id="count"></span><span id="version"></span><span id="seed-caption"></span></div>
        </div>
      </details>
      </nav>
    </header>
    <div class="title-area">
      <h1 id="title" contenteditable="plaintext-only" role="textbox" aria-label="Título da constelação" aria-multiline="false" aria-describedby="text-help input-feedback" spellcheck="false" data-placeholder="Escreva seu universo">Astronymic</h1>
      <p id="text-help" class="title-help">Este título é editável. Altere o texto para gerar uma nova constelação.</p>
    </div>
    <div id="drawing"></div>
    <p id="input-feedback" class="feedback" role="status" aria-live="polite" hidden></p>
    <p id="status" class="sr-only" role="status" aria-live="polite"></p>
  </main>`;
  const title = document.querySelector<HTMLHeadingElement>('#title')!;
  const feedback =
    document.querySelector<HTMLParagraphElement>('#input-feedback')!;
  const menus = [
    ...document.querySelectorAll<HTMLDetailsElement>('.controls-menu'),
  ];
  const seed = document.querySelector<HTMLInputElement>('#seed')!;
  const labels = document.querySelector<HTMLInputElement>('#labels')!;
  const debug = document.querySelector<HTMLInputElement>('#debug')!;
  const drawing = document.querySelector<HTMLDivElement>('#drawing')!;
  const status = document.querySelector<HTMLParagraphElement>('#status')!;
  const count = document.querySelector<HTMLElement>('#count')!;
  const seedCaption = document.querySelector<HTMLElement>('#seed-caption')!;
  const version = document.querySelector<HTMLElement>('#version')!;
  const debugHelp = document.querySelector<HTMLElement>('#debug-help')!;
  const alphabet =
    document.querySelector<HTMLDetailsElement>('.alphabet-help')!;
  const reference = document.querySelector<HTMLDivElement>('#glyph-reference')!;
  return {
    title,
    feedback,
    menus,
    seed,
    labels,
    debug,
    drawing,
    status,
    count,
    seedCaption,
    version,
    debugHelp,
    alphabet,
    reference,
  };
}
