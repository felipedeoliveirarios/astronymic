import type { Glyph, GlyphEdge } from './glyphs.ts';
import { distance, pointOnEdge } from './geometry.ts';

const NS = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}
const xy = (p: { x: number; y: number }) => `${p.x} ${p.y}`;
function appendEdge(group: SVGGElement, edge: GlyphEdge) {
  const start = edge.from.point, end = edge.to.point;
  const length = distance(start, end);
  const ux = (end.x - start.x) / length, uy = (end.y - start.y) / length;
  const line = (d: string, className = '') => group.append(svg('path', { d, class: `segment glyph-stroke ${className}` }));
  if (edge.style === 'double') {
    for (const side of [-1, 1]) {
      const inset = Math.min(0.12, 4 / length);
      const offset = (t: number) => {
        const p = pointOnEdge(start, end, t);
        return { x: p.x - uy * side * 2.1, y: p.y + ux * side * 2.1 };
      };
      line(`M ${xy(start)} L ${xy(offset(inset))} L ${xy(offset(1 - inset))} L ${xy(end)}`, 'double-trace');
    }
  } else {
    line(`M ${xy(start)} L ${xy(end)}`);
    if (edge.style === 'cuts') {
      for (const shift of [-3.4, 3.4]) {
        const center = pointOnEdge(start, end, 0.5 + shift / length);
        const dx = ux * 1.8 - uy * 3.5, dy = uy * 1.8 + ux * 3.5;
        const d = `M ${center.x - dx} ${center.y - dy} L ${center.x + dx} ${center.y + dy}`;
        group.append(svg('path', { d, class: 'cut-underlay' }), svg('path', { d, class: 'glyph-cut' }));
      }
    }
  }
}

/** Render graph edges once; attributes never create graph vertices or extra glyphs. */
export function appendGlyphs(parent: SVGElement, glyphs: Glyph[], includeBoundaries = false) {
  const drawn = new Set<string>();
  for (const glyph of glyphs) {
    const group = svg('g', { class: 'glyph', 'data-letter': glyph.letter, 'data-segment-id': glyph.segmentId });
    const title = svg('title'); title.textContent = `${glyph.letter} · ${glyph.notation}`; group.append(title);
    for (const edge of glyph.edges) {
      const edgeGroup = svg('g', { class: 'glyph-edge', 'data-edge-id': edge.id, 'data-style': edge.style });
      appendEdge(edgeGroup, edge); group.append(edgeGroup);
    }
    for (const mark of glyph.marks) group.append(svg('circle', {
      cx: mark.point.x, cy: mark.point.y, r: mark.radius, class: 'glyph-mark',
      'data-side': mark.side === -1 ? 'above' : 'below', 'data-edge-id': mark.edgeId,
    }));
    for (const vertex of glyph.vertices) {
      if ((vertex.boundary && !includeBoundaries) || drawn.has(vertex.id)) continue;
      drawn.add(vertex.id);
      group.append(svg('circle', { cx: vertex.point.x, cy: vertex.point.y, r: 5, class: 'halo' }),
        svg('circle', { cx: vertex.point.x, cy: vertex.point.y, r: 2.5, class: `star ${vertex.boundary ? 'boundary-star' : 'internal-star'}` }));
    }
    parent.append(group);
  }
}
