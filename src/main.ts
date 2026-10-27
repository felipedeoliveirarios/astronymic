import '@fontsource/playfair-display/400.css';
import './style.css';
import { placeGlyphLabels } from './labels.ts';
import { ALPHABET, injectGlyph, injectConstellation, type Injection } from './glyphs.ts';
import { appendGlyphs, sparkle, VERTEX_HALO_RADIUS, ORIGIN_RING_RADIUS, ORIGIN_STAR_RADIUS, ATLAS_EDGE_MASK_ID } from './glyph-renderer.ts';
import { generate, normalizeText, MAX_LETTERS, type Constellation, type Branching } from './generator.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main class="poster" aria-label="Atlas da constelação">
    <header class="poster-top">
      <a class="brand" href="./">ASTRONYMIC</a>
      <details id="controls-menu" class="controls-menu">
        <summary aria-label="Abrir controles da constelação" title="Controles da constelação">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></svg>
          <span>Ajustes</span>
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
          <details class="reading-help"><summary>Como ler</summary><p>Comece na origem e siga os segmentos em profundidade. Em cada junção, percorra os ramos no sentido horário a partir da direção de retorno. Cada letra é um glifo: os ramos internos e as marcas preservam sua identidade. Marcas acima/abaixo seguem a vertical da página.</p></details>
          <details class="reading-help alphabet-help"><summary>Alfabeto A–Z</summary><div id="glyph-reference"></div><p>As estrelas maiores são vértices; as menores são marcas. A entrada está à esquerda e a saída à direita em cada exemplo. B/C e P/Q preservam a ordem dos caminhos. J usa traço duplo e marca inferior para se distinguir de I.</p><p>Marcas ficam nas faixas laterais da linha, dentro de seu comprimento visível. Em arestas exatamente verticais, superiores ficam um pouco acima e à direita; inferiores, abaixo e à esquerda.</p></details>
          <div class="metadata"><span id="count"></span><span id="version"></span><span id="seed-caption"></span></div>
        </div>
      </details>
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
const titleText = () => (title.textContent ?? '').replace(/[\r\n]+/g, ' ');
const feedback = document.querySelector<HTMLParagraphElement>('#input-feedback')!;
const menu = document.querySelector<HTMLDetailsElement>('#controls-menu')!;
const seed = document.querySelector<HTMLInputElement>('#seed')!;
const labels = document.querySelector<HTMLInputElement>('#labels')!;
const debug = document.querySelector<HTMLInputElement>('#debug')!;
const drawing = document.querySelector<HTMLDivElement>('#drawing')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const ns = 'http://www.w3.org/2000/svg';
function element<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number>) {
  const node = document.createElementNS(ns, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}
function percent(value: number) { return `${Number((value * 100).toFixed(2))}%`; }
function branchingLabel(branching: Branching): string {
  if (branching.stop === 'leaf') return 'fim';
  if (!branching.trials.length) return `${percent(branching.probability)} · sem teste`;
  return branching.trials.map(t => `${percent(t.probability)}${t.success ? '✓' : '×'}`).join(' → ');
}
function render(result: Constellation, injection: Injection) {
  document.querySelector('#count')!.textContent = `${String(result.segments.length).padStart(2, '0')} LETRAS`;
  document.querySelector('#seed-caption')!.textContent = `SEED / ${result.seed}`;
  document.querySelector('#version')!.textContent = `${result.version} · ${injection.version}`.toUpperCase();
  const context = document.createElement('canvas').getContext('2d')!;
  context.font = `8px ${getComputedStyle(drawing).fontFamily}`;
  const placements = labels.checked ? placeGlyphLabels(injection.glyphs, text => context.measureText(text).width + (text.length - 1)) : [];
  const points = [{ x: 0, y: 0 }, ...injection.glyphs.flatMap(g => [...g.vertices.map(v => v.point), ...g.marks.map(m => m.point)]),
    ...placements.flatMap(l => [{x:l.box.x,y:l.box.y},{x:l.box.x+l.box.width,y:l.box.y+l.box.height}])];
  const minX = Math.min(...points.map(p => p.x)) - 60;
  const minY = Math.min(...points.map(p => p.y)) - 60;
  const width = Math.max(250, Math.max(...points.map(p => p.x)) - minX + 60);
  const height = Math.max(250, Math.max(...points.map(p => p.y)) - minY + 60);
  const svg = element('svg', { viewBox: `${minX} ${minY} ${width} ${height}`, role: 'img', 'aria-labelledby': 'svg-title svg-desc' });
  const svgTitle = element('title', { id: 'svg-title' });
  svgTitle.textContent = `Constelação de glifos para ${result.normalized || 'texto vazio'}`;
  const desc = element('desc', { id: 'svg-desc' });
  desc.textContent = `${injection.glyphs.length} glifos na ordem ${result.normalized}. ${injection.issues.length} conflitos geométricos detectados. Seed ${result.seed}. Versões ${result.version} e ${injection.version}.`;
  svg.append(svgTitle, desc);
  if (debug.checked && result.segments.length) {
    const overlay = element('g', { class: 'debug-overlay' });
    for (const s of result.segments) {
      const { sectorLow: low, sectorWidth: width } = s.debug;
      const radius = Math.min(55, s.length * 0.7);
      const point = (angle: number) => `${s.start.x + Math.cos(angle) * radius} ${s.start.y + Math.sin(angle) * radius}`;
      const wedge = element('path', {
        d: `M ${s.start.x} ${s.start.y} L ${point(low)} A ${radius} ${radius} 0 ${width > Math.PI ? 1 : 0} 1 ${point(low + width)} Z`,
        class: 'debug-sector', style: `--sector-color: hsl(${(s.id * 67 + 170) % 360} 65% 70%)`,
      });
      const tooltip = element('title', {});
      tooltip.textContent = `Segmento ${s.id + 1} (${s.letter}): setor ${(width * 180 / Math.PI).toFixed(1)}°, início ${(low * 180 / Math.PI).toFixed(1)}°, offset ${(s.debug.offset * 180 / Math.PI).toFixed(1)}°.`;
      wedge.append(tooltip);
      overlay.append(wedge, element('line', {
        x1: s.start.x, y1: s.start.y, x2: s.end.x, y2: s.end.y, class: 'macro-guide', mask: `url(#${ATLAS_EDGE_MASK_ID})`,
      }));
    }
    svg.append(overlay);
  }
  appendGlyphs(svg, injection.glyphs);
  svg.append(element('circle', { cx: 0, cy: 0, r: ORIGIN_RING_RADIUS, class: 'origin-ring' }), sparkle({ x: 0, y: 0 }, ORIGIN_STAR_RADIUS, 'star origin-star'));
  for (const s of result.segments) {
    svg.append(element('circle', { cx: s.end.x, cy: s.end.y, r: VERTEX_HALO_RADIUS, class: 'halo' }), sparkle(s.end, 2.7));
  }
  for (const placement of placements) {
    const text = element('text', { x: placement.center.x, y: placement.center.y, class: 'glyph-label', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    text.textContent = placement.text;
    svg.append(text);
  }
  if (debug.checked && result.segments.length) {
    const nodes = [
      { point: { x: 0, y: 0 }, name: 'Origem', branching: result.rootBranching },
      ...result.segments.map(s => ({ point: s.end, name: `Junção ${s.id + 1} (${s.letter})`, branching: s.debug.branching })),
    ];
    for (const { point, name, branching } of nodes) {
      const label = element('text', { x: point.x + 10, y: point.y + 17, class: 'debug-probability' });
      label.textContent = branchingLabel(branching);
      const tooltip = element('title', {});
      tooltip.textContent = `${name}: probabilidade inicial ${percent(branching.probability)}. ${branchingLabel(branching)}. ${branching.stop === 'leaf' ? 'Sem letras restantes.' : `Probabilidade herdada pelos descendentes: ${percent(branching.inheritedProbability)}. ${branching.stop === 'budget' ? 'Orçamento de letras esgotado.' : 'Primeiro teste sem sucesso encerrou as ramificações adicionais.'}`}`;
      label.append(tooltip);
      svg.append(label);
    }
  }
  document.querySelector<HTMLElement>('#debug-help')!.hidden = !debug.checked;
  drawing.replaceChildren(svg);
  if (!result.normalized) {
    status.textContent = 'Digite ao menos uma letra de A a Z para começar.';
  } else {
    status.textContent = injection.issues.length === 0
      ? `${injection.glyphs.length} glifos em ordem DFS · nenhuma colisão geométrica detectada · seed ${result.seed}`
      : `${injection.issues.length} conflitos geométricos persistem após ${injection.attempts} tentativas de injeção. Experimente outra seed. Este layout ainda precisa de ajuste.`;
  }
}
function update() {
  const normalized = normalizeText(titleText());
  const invalid = normalized.length > MAX_LETTERS;
  title.setAttribute('aria-invalid', String(invalid));
  if (invalid) {
    feedback.hidden = false;
    feedback.textContent = `O texto contém ${normalized.length} letras. Use até ${MAX_LETTERS}; o atlas mantém o último resultado válido.`;
    status.textContent = feedback.textContent;
    return;
  }
  const result = generate(titleText(), seed.value);
  const injection = injectConstellation(result);
  feedback.hidden = injection.issues.length === 0;
  feedback.textContent = injection.issues.length ? `${injection.issues.length} conflitos entre glifos, vértices ou marcas persistem. Experimente outra seed em Ajustes.` : '';
  render(result, injection);
}
let timer: ReturnType<typeof setTimeout>;
window.addEventListener('beforeprint', () => { clearTimeout(timer); update(); });
function schedule() { clearTimeout(timer); timer = setTimeout(update, 500); }
let composing = false;
title.addEventListener('compositionstart', () => { composing = true; clearTimeout(timer); });
title.addEventListener('compositionend', () => { composing = false; schedule(); });
title.addEventListener('input', () => { if (!composing) schedule(); });
title.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); title.blur(); }
});
title.addEventListener('paste', event => {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain').replace(/[\r\n]+/g, ' ') ?? '';
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  schedule();
});
menu.addEventListener('keydown', event => {
  if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary')!.focus(); }
});
document.addEventListener('pointerdown', event => {
  if (menu.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
});
seed.addEventListener('input', schedule);
labels.addEventListener('change', update);
debug.addEventListener('change', update);
document.querySelector('#random')!.addEventListener('click', () => {
  seed.value = Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(16).padStart(8, '0')).join('');
  clearTimeout(timer);
  update();
});
document.querySelector('#reset')!.addEventListener('click', () => { seed.value = ''; clearTimeout(timer); update(); });
update();

// Canonical, undeformed reference previews share the exact production definitions/renderer.
const reference = document.querySelector('#glyph-reference')!;
for (const [index, [letter, notation]] of Object.entries(ALPHABET).entries()) {
  const row = document.createElement('div'); row.className = 'reference-row';
  const label = document.createElement('span'); label.className = 'reference-letter'; label.textContent = letter;
  const preview = element('svg', { viewBox: '-10 -38 120 76', role: 'img', 'aria-label': `Glifo ${letter}: ${notation}; entrada à esquerda, saída à direita` });
  const glyph = injectGlyph({ id: index, parentId: null, letter, start: { x: 0, y: 0 }, end: { x: 100, y: 0 } }, 'reference', 0, 0, true);
  appendGlyphs(preview, [glyph], true);
  const code = document.createElement('code'); code.textContent = notation;
  row.append(label, preview, code); reference.append(row);
}
