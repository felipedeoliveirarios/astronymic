import '@fontsource/playfair-display/800.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './style.css';
import { normalizeText, MAX_LETTERS } from './generator.ts';
import { createSceneCache } from './scene.ts';
import { renderAtlas } from './atlas-renderer.ts';
import { renderAlphabet } from './alphabet.ts';
import { mountAtlas } from './ui.ts';

const {
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
} = mountAtlas();
const titleText = () => (title.textContent ?? '').replace(/[\r\n]+/g, ' ');
const cache = createSceneCache();
const context = document.createElement('canvas').getContext('2d')!;
let fontRevision = 0;

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
  const scene = cache.getScene(titleText(), seed.value);
  const { constellation: result, injection } = scene;
  context.font = `400 8px ${getComputedStyle(drawing).getPropertyValue('--label-font-family')}`;
  const placements = labels.checked
    ? cache.getLabels(scene, `${context.font}:${fontRevision}`, (text) => {
        const metrics = context.measureText(text);
        return (
          Math.max(
            metrics.width,
            metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
          ) +
          (text.length - 1)
        );
      })
    : [];
  count.textContent = `${String(result.segments.length).padStart(2, '0')} LETRAS`;
  seedCaption.textContent = `SEED / ${result.seed}`;
  version.textContent =
    `${result.version} · ${injection.version}`.toUpperCase();
  debugHelp.hidden = !debug.checked;
  feedback.hidden = injection.issues.length === 0;
  feedback.textContent = injection.issues.length
    ? `${injection.issues.length} conflitos entre glifos, vértices ou marcas persistem. Experimente outra seed em Ajustes.`
    : '';
  drawing.replaceChildren(
    renderAtlas(result, injection, placements, debug.checked),
  );
  status.textContent = !result.normalized
    ? 'Digite ao menos uma letra de A a Z para começar.'
    : injection.issues.length === 0
      ? `${injection.glyphs.length} glifos em ordem DFS · nenhuma colisão geométrica detectada · seed ${result.seed}`
      : `${injection.issues.length} conflitos geométricos persistem após ${injection.attempts} tentativas de injeção. Experimente outra seed. Este layout ainda precisa de ajuste.`;
}
let timer: ReturnType<typeof setTimeout>;
window.addEventListener('beforeprint', () => {
  clearTimeout(timer);
  update();
});
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(update, 500);
}
let composing = false;
title.addEventListener('compositionstart', () => {
  composing = true;
  clearTimeout(timer);
});
title.addEventListener('compositionend', () => {
  composing = false;
  schedule();
});
title.addEventListener('input', () => {
  if (!composing) schedule();
});
title.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    title.blur();
  }
});
title.addEventListener('paste', (event) => {
  event.preventDefault();
  const text =
    event.clipboardData?.getData('text/plain').replace(/[\r\n]+/g, ' ') ?? '';
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
for (const menu of menus) {
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menu.open = false;
      menu.querySelector('summary')!.focus();
    }
  });
  menu.addEventListener('toggle', () => {
    if (menu.open)
      for (const other of menus) if (other !== menu) other.open = false;
  });
}
document.addEventListener('pointerdown', (event) => {
  for (const menu of menus)
    if (
      menu.open &&
      event.target instanceof Node &&
      !menu.contains(event.target)
    )
      menu.open = false;
});
seed.addEventListener('input', schedule);
labels.addEventListener('change', update);
debug.addEventListener('change', update);
document.querySelector('#random')!.addEventListener('click', () => {
  seed.value = Array.from(crypto.getRandomValues(new Uint32Array(2)), (n) =>
    n.toString(16).padStart(8, '0'),
  ).join('');
  clearTimeout(timer);
  update();
});
document.querySelector('#reset')!.addEventListener('click', () => {
  seed.value = '';
  clearTimeout(timer);
  update();
});
update();
// Re-measure labels once the self-hosted font has replaced its initial fallback.
void document.fonts.ready.then(() => {
  fontRevision++;
  update();
});
let alphabetMounted = false;
alphabet.addEventListener('toggle', () => {
  if (alphabet.open && !alphabetMounted) {
    renderAlphabet(reference);
    alphabetMounted = true;
  }
});
