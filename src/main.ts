import './style.css';
import { generate, normalizeText, MAX_LETTERS, type Constellation, type Branching } from './generator.ts';

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
        <label class="check debug-toggle"><input id="debug" type="checkbox" aria-describedby="debug-help" /><span>Debug: setores e branching</span></label>
        <p id="debug-help" class="help" hidden>Leques mostram a direção e abertura dos setores locais reservados. Percentuais mostram os testes de ramificação em cada junção: ✓ criou ramo, × encerrou. “Sem teste” indica falta de letras para um ramo extra; “fim” é uma folha. Passe o mouse nos setores e percentuais para mais detalhes. Os leques não são limites espaciais garantidos de toda a subárvore.</p>
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
      overlay.append(wedge);
    }
    svg.append(overlay);
  }
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
debug.addEventListener('change', update);
document.querySelector('#random')!.addEventListener('click', () => {
  seed.value = Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(16).padStart(8, '0')).join('');
  clearTimeout(timer);
  update();
});
document.querySelector('#reset')!.addEventListener('click', () => { seed.value = ''; clearTimeout(timer); update(); });
update();
