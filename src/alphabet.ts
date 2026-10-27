import { ALPHABET, injectGlyph } from './glyphs.ts';
import { appendGlyphs } from './glyph-renderer.ts';
import { svgElement as element } from './svg.ts';

export function renderAlphabet(reference: HTMLElement): void {
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
      'aria-label': `Glifo ${letter}; entrada à esquerda, saída à direita`,
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
    appendGlyphs(preview, [glyph], true);
    row.append(label, preview);
    rows.append(row);
  }

  reference.replaceChildren(rows);
}
