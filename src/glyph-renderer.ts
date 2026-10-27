import type { Glyph, GlyphEdge } from './glyphs.ts';
import { distance, pointOnEdge } from './geometry.ts';
import type { Point } from './generator.ts';

export const ATLAS_EDGE_MASK_ID = 'atlas-star-gaps';
export const VERTEX_HALO_RADIUS = 7;
export const INTERNAL_HALO_RADIUS = 5;
export const ORIGIN_RING_RADIUS = 9;
const LINE_HALO_GAP = 2;

const NS = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}
const xy = (p: { x: number; y: number }) => `${p.x} ${p.y}`;

/** Four tips with inward-curving sides, inside the original circular footprint. */
export function sparkle(point: Point, radius: number, className = 'star', attrs: Record<string, string | number> = {}): SVGPathElement {
  const { x, y } = point;
  const inset = radius * 0.18;
  const d = `M ${x} ${y - radius} Q ${x + inset} ${y - inset} ${x + radius} ${y} Q ${x + inset} ${y + inset} ${x} ${y + radius} Q ${x - inset} ${y + inset} ${x - radius} ${y} Q ${x - inset} ${y - inset} ${x} ${y - radius} Z`;
  return svg('path', { d, class: className, ...attrs });
}

/** Clip strokes outside endpoint halos; graph coordinates and double traces stay intact. */
function starGapMask(parent: SVGElement, glyphs: Glyph[], reference: boolean): string {
  const id = reference ? `reference-star-gaps-${glyphs[0].segmentId}` : ATLAS_EDGE_MASK_ID;
  const vertices = [...new Map(glyphs.flatMap(g => g.vertices).map(v => [v.id, v])).values()];
  const minX = Math.min(...vertices.map(v => v.point.x)) - 20;
  const minY = Math.min(...vertices.map(v => v.point.y)) - 20;
  const width = Math.max(...vertices.map(v => v.point.x)) - minX + 20;
  const height = Math.max(...vertices.map(v => v.point.y)) - minY + 20;
  const defs = svg('defs');
  const mask = svg('mask', { id, maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', x: minX, y: minY, width, height, style: 'mask-type: luminance' });
  mask.append(svg('rect', { x: minX, y: minY, width, height, fill: 'white' }));
  for (const vertex of vertices) {
    const halo = reference || !vertex.boundary ? INTERNAL_HALO_RADIUS : vertex.id === 'origin' ? ORIGIN_RING_RADIUS + 0.5 : VERTEX_HALO_RADIUS;
    mask.append(svg('circle', { cx: vertex.point.x, cy: vertex.point.y, r: halo + LINE_HALO_GAP, fill: 'black', 'data-vertex-id': vertex.id }));
  }
  defs.append(mask); parent.append(defs);
  return id;
}

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
  if (!glyphs.length) return;
  const maskId = starGapMask(parent, glyphs, includeBoundaries);
  const drawn = new Set<string>();
  for (const glyph of glyphs) {
    const group = svg('g', { class: 'glyph', 'data-letter': glyph.letter, 'data-segment-id': glyph.segmentId });
    const title = svg('title'); title.textContent = `${glyph.letter} · ${glyph.notation}`; group.append(title);
    for (const edge of glyph.edges) {
      const edgeGroup = svg('g', { class: 'glyph-edge', 'data-edge-id': edge.id, 'data-style': edge.style, mask: `url(#${maskId})` });
      appendEdge(edgeGroup, edge); group.append(edgeGroup);
    }
    for (const mark of glyph.marks) group.append(svg('circle', {
      cx: mark.point.x, cy: mark.point.y, r: mark.radius * 2.6, class: 'halo glyph-mark-halo',
    }), sparkle(mark.point, mark.radius, 'star glyph-mark', {
      'data-side': mark.side === -1 ? 'above' : 'below', 'data-edge-id': mark.edgeId,
    }));
    for (const vertex of glyph.vertices) {
      if ((vertex.boundary && !includeBoundaries) || drawn.has(vertex.id)) continue;
      drawn.add(vertex.id);
      group.append(svg('circle', { cx: vertex.point.x, cy: vertex.point.y, r: INTERNAL_HALO_RADIUS, class: 'halo' }),
        sparkle(vertex.point, 2.5, `star ${vertex.boundary ? 'boundary-star' : 'internal-star'}`));
    }
    parent.append(group);
  }
}
