import './style.css';
import { generate, normalizeText, MAX_LETTERS, type Constellation } from './generator.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header><a class="brand" href="./"><svg class="brand-mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M16 2v28M2 16h28M6 6l20 20M6 26L26 6" stroke="currentColor" stroke-width="1.2"/><circle cx="16" cy="16" r="3" fill="currentColor"/></svg> ASTRONYMIC</a><span class="edition">ESTUDO Nº 001 / A ÁRVORE</span></header>
  <main>
    <section class="intro"><span class="eyebrow">UM ALFABETO ENTRE AS ESTRELAS</span><h1>Cada palavra,<br>um pequeno universo.</h1><p>Escreva algo que mereça uma constelação.</p></section>
    <div class="workspace">
      <aside class="controls" aria-label="Controles da constelação">
        <label for="title">01 <span>SUA PALAVRA OU FRASE</span></label>
        <input id="title" value="Astronymic" maxlength="240" autocomplete="off" spellcheck="false" aria-describedby="text-help" />
        <p id="text-help" class="help">Acentos são normalizados. Espaços, números e pontuação não formam segmentos. Até 120 letras.</p>
        <div class="rule"></div>
        <label for="seed">02 <span>A SEMENTE DO SEU CÉU</span></label>
        <input id="seed" placeholder="Automática, a partir do texto" maxlength="100" autocomplete="off" aria-describedby="seed-help" />
        <p id="seed-help" class="help">A mesma palavra e seed recriam o mesmo desenho.</p>
        <button id="random" class="primary" type="button"><span>Explorar outro céu</span><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
        <button id="reset" class="secondary" type="button">Voltar à seed do texto</button>
        <div class="rule"></div>
        <label class="check"><input id="labels" type="checkbox" checked /><span>Mostrar ordem e letras</span></label>
        <details><summary>Como ler este estudo <span aria-hidden="true">+</span></summary><p>Comece no círculo de origem. Siga os segmentos em profundidade; em cada junção, percorra os ramos no sentido horário a partir da direção de retorno. Os números mostram essa ordem.</p><p>Cada segmento reserva o lugar de uma letra. Os 26 glifos e suas marcações serão acrescentados na próxima etapa.</p></details>
        <div class="prototype"><span class="status-dot"></span> PROTÓTIPO DE MACROGEOMETRIA</div>
      </aside>
      <section class="poster" aria-label="Pôster da constelação">
        <div class="poster-top"><span>ATLAS DE PALAVRAS</span><span id="count"></span></div>
        <h2 id="poster-title"></h2>
        <p class="poster-subtitle">UMA CONSTELAÇÃO PARTICULAR</p>
        <div id="drawing"></div>
        <div class="poster-bottom"><span id="seed-caption"></span><span id="version"></span></div>
      </section>
    </div>
    <p id="status" role="status" aria-live="polite"></p>
    <footer><span>PALAVRAS CONECTADAS. SENTIDOS INFINITOS.</span><span>PRIMEIRO, A ESTRUTURA. DEPOIS, O ALFABETO.</span></footer>
  </main>`;
const title = document.querySelector<HTMLInputElement>('#title')!;
const seed = document.querySelector<HTMLInputElement>('#seed')!;
const labels = document.querySelector<HTMLInputElement>('#labels')!;
const drawing = document.querySelector<HTMLDivElement>('#drawing')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const ns = 'http://www.w3.org/2000/svg';
function element<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number>) {
  const node = document.createElementNS(ns, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}
function render(result: Constellation) {
  document.querySelector('#poster-title')!.textContent = title.value.trim() || 'Seu universo';
  document.querySelector('#count')!.textContent = `${String(result.segments.length).padStart(2, '0')} LETRAS`;
  document.querySelector('#seed-caption')!.textContent = `SEED / ${result.seed}`;
  document.querySelector('#version')!.textContent = result.version.toUpperCase();
  const points = [{ x: 0, y: 0 }, ...result.segments.map(s => s.end)];
  const minX = Math.min(...points.map(p => p.x)) - 60;
  const minY = Math.min(...points.map(p => p.y)) - 60;
  const width = Math.max(250, Math.max(...points.map(p => p.x)) - minX + 60);
  const height = Math.max(250, Math.max(...points.map(p => p.y)) - minY + 60);
  const svg = element('svg', { viewBox: `${minX} ${minY} ${width} ${height}`, role: 'img', 'aria-labelledby': 'svg-title svg-desc' });
  const svgTitle = element('title', { id: 'svg-title' });
  svgTitle.textContent = `Árvore de segmentos para ${result.normalized || 'texto vazio'}`;
  const desc = element('desc', { id: 'svg-desc' });
  desc.textContent = `${result.segments.length} segmentos na ordem ${result.normalized}. ${result.crossings} cruzamentos detectados. Seed ${result.seed}.`;
  svg.append(svgTitle, desc);
  for (const s of result.segments) {
    const line = element('line', { x1: s.start.x, y1: s.start.y, x2: s.end.x, y2: s.end.y, class: 'segment' });
    svg.append(line);
  }
  svg.append(element('circle', { cx: 0, cy: 0, r: 9, class: 'origin-ring' }), element('circle', { cx: 0, cy: 0, r: 2.6, class: 'star' }));
  for (const s of result.segments) {
    svg.append(element('circle', { cx: s.end.x, cy: s.end.y, r: 7, class: 'halo' }), element('circle', { cx: s.end.x, cy: s.end.y, r: 2.7, class: 'star' }));
    if (labels.checked) {
      const text = element('text', { x: (s.start.x + s.end.x) / 2 + 8, y: (s.start.y + s.end.y) / 2 - 8, class: 'glyph-label' });
      text.textContent = `${s.id + 1} · ${s.letter}`;
      svg.append(text);
    }
  }
  drawing.replaceChildren(svg);
  if (!result.normalized) {
    status.textContent = 'Digite ao menos uma letra de A a Z para começar.';
  } else {
    status.textContent = result.crossings === 0
      ? `${result.segments.length} letras em ordem DFS · sem cruzamentos entre segmentos · seed ${result.seed}`
      : `${result.crossings} cruzamentos persistem após ${result.attempts} tentativas. Experimente outra seed. Este layout ainda precisa de ajuste.`;
  }
}
function update() {
  const normalized = normalizeText(title.value);
  const invalid = normalized.length > MAX_LETTERS;
  title.setCustomValidity(invalid ? `Use até ${MAX_LETTERS} letras.` : '');
  title.setAttribute('aria-invalid', String(invalid));
  if (invalid) {
    status.textContent = `O texto contém ${normalized.length} letras. Use até ${MAX_LETTERS}; o pôster mantém o último resultado válido.`;
    return;
  }
  render(generate(title.value, seed.value));
}
let timer: ReturnType<typeof setTimeout>;
function schedule() { clearTimeout(timer); timer = setTimeout(update, 500); }
title.addEventListener('input', schedule);
seed.addEventListener('input', schedule);
labels.addEventListener('change', update);
document.querySelector('#random')!.addEventListener('click', () => {
  seed.value = Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(16).padStart(8, '0')).join('');
  clearTimeout(timer);
  update();
});
document.querySelector('#reset')!.addEventListener('click', () => { seed.value = ''; clearTimeout(timer); update(); });
update();
