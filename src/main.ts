import { exportPng } from './export.ts';
import '@fontsource/playfair-display/800.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './style.css';
import { normalizeText, MAX_LETTERS } from './generator.ts';
import { createSceneCache, type Scene } from './scene.ts';
import { renderAtlas } from './atlas-renderer.ts';
import { renderAlphabet, translateAlphabet } from './alphabet.ts';
import { mountAtlas, applyLanguage } from './ui.ts';

import { createTranslator, loadLocale, saveLocale, isLocale } from './i18n.ts';

let text = createTranslator(loadLocale());
const {
  language,
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
} = mountAtlas(text);
const titleText = () => (title.textContent ?? '').replace(/[\r\n]+/g, ' ');
const cache = createSceneCache();
const context = document.createElement('canvas').getContext('2d')!;
let fontRevision = 0;
let currentScene: Scene | undefined;

function displayScene(scene: Scene) {
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
  count.textContent = `${text.number(result.segments.length).padStart(2, '0')} ${text.plural('letterOne', 'letterMany', result.segments.length).toLocaleUpperCase(text.locale)}`;
  seedCaption.textContent = text.text('seedCaption', { seed: result.seed });
  version.textContent =
    `${result.version} · ${injection.version}`.toUpperCase();
  debugHelp.hidden = !debug.checked;
  feedback.hidden = injection.issues.length === 0;
  feedback.textContent = injection.issues.length
    ? text.plural('warningOne', 'warningMany', injection.issues.length)
    : '';
  drawing.replaceChildren(
    renderAtlas(result, injection, placements, debug.checked, text),
  );
  status.textContent = !result.normalized
    ? text.text('emptyStatus')
    : injection.issues.length === 0
      ? text.plural('readyOne', 'readyMany', injection.glyphs.length, {
          seed: result.seed,
        })
      : text.plural('conflictsOne', 'conflictsMany', injection.issues.length, {
          attempts: text.plural(
            'attemptOne',
            'attemptMany',
            injection.attempts,
          ),
        });
}

function update() {
  const normalized = normalizeText(titleText());
  const invalid = normalized.length > MAX_LETTERS;
  title.setAttribute('aria-invalid', String(invalid));
  if (invalid) {
    if (currentScene) displayScene(currentScene);
    feedback.hidden = false;
    feedback.textContent = text.text('tooLong', {
      count: text.number(normalized.length),
      max: text.number(MAX_LETTERS),
    });
    status.textContent = feedback.textContent;
    return;
  }
  currentScene = cache.getScene(titleText(), seed.value);
  displayScene(currentScene);
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
    renderAlphabet(reference, text);
    alphabetMounted = true;
  }
});

language.addEventListener('change', () => {
  if (!isLocale(language.value)) return;
  text = createTranslator(language.value);
  saveLocale(text.locale);
  applyLanguage(text);
  if (alphabetMounted) translateAlphabet(reference, text);
  clearTimeout(timer);
  update();
});

const exportButton = document.querySelector<HTMLButtonElement>('#export-png')!;
const exportStatus = document.querySelector<HTMLElement>('#export-status')!;
exportButton.addEventListener('click', async () => {
  clearTimeout(timer);
  update();
  if (title.getAttribute('aria-invalid') === 'true') return;
  const svg = drawing.querySelector('svg');
  if (!svg) return;
  exportButton.disabled = true;
  exportStatus.hidden = false;
  exportStatus.textContent = text.text('exporting');
  try {
    await exportPng(svg, titleText());
    exportStatus.textContent = text.text('exportSuccess');
  } catch {
    exportStatus.textContent = text.text('exportError');
  } finally {
    exportButton.disabled = false;
  }
});
