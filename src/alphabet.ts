import type { Translator } from './i18n.ts';
import { ALPHABET, injectGlyph } from './glyphs.ts';
import { appendGlyphs } from './glyph-renderer.ts';
import { svgElement as element } from './svg.ts';

export function renderAlphabet(reference: HTMLElement, text: Translator): void {
  const rows = document.createDocumentFragment();
  // Canonical, undeformed reference previews share the exact production definitions/renderer.
  for (const [index, letter] of Object.keys(ALPHABET).entries()) {
    const row = document.createElement('div');
    row.className = 'reference-row';
    const label = document.createElement('span');
    label.className = 'reference-letter';
    label.textContent = letter;
    const preview = element('svg', {
      viewBox: '-10 -38 120 76',
      role: 'img',
      'aria-label': text.text('referenceGlyph', { letter }),
    });
    const glyph = injectGlyph(
      {
        id: index,
        parentId: null,
        letter,
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      },
      'reference',
      0,
      0,
      true,
    );
    appendGlyphs(preview, [glyph], true, text);
    row.append(label, preview);
    rows.append(row);
  }

  reference.replaceChildren(rows);
}

export function translateAlphabet(
  reference: HTMLElement,
  text: Translator,
): void {
  for (const row of reference.querySelectorAll('.reference-row')) {
    const letter = row.querySelector('.reference-letter')!.textContent!;
    row
      .querySelector('svg')!
      .setAttribute('aria-label', text.text('referenceGlyph', { letter }));
    row.querySelector('.glyph > title')!.textContent = text.text('glyphName', {
      letter,
    });
  }
}
