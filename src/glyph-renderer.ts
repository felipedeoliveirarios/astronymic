import { DEFAULT_TRANSLATOR, type Translator } from './i18n.ts';
import type { Glyph, GlyphEdge } from './glyphs.ts';
import { distance, pointOnEdge } from './geometry.ts';
import type { Point } from './generator.ts';

import {
  ATLAS_EDGE_MASK_ID,
  INTERNAL_HALO_RADIUS,
  ORIGIN_RING_RADIUS,
  LINE_HALO_GAP,
  STAR_SCALE,
  MARK_HALO_SCALE,
  vertexKeepout,
  visibleEdgeSpan,
  vertexBaseRadius,
} from './appearance.ts';
export {
  ATLAS_EDGE_MASK_ID,
  VERTEX_HALO_RADIUS,
  ORIGIN_RING_RADIUS,
  ORIGIN_STAR_RADIUS,
} from './appearance.ts';

import { svgElement as svg } from './svg.ts';
const xy = (p: { x: number; y: number }) => `${p.x} ${p.y}`;

/** Four inward-curving sides; enlarge the core while keeping it inside its halo. */
export function sparkle(
  point: Point,
  radius: number,
  className = 'star',
  attrs: Record<string, string | number> = {},
): SVGPathElement {
  const { x, y } = point;
  radius *= STAR_SCALE;
  const inset = radius * 0.18;
  const d = `M ${x} ${y - radius} Q ${x + inset} ${y - inset} ${x + radius} ${y} Q ${x + inset} ${y + inset} ${x} ${y + radius} Q ${x - inset} ${y + inset} ${x - radius} ${y} Q ${x - inset} ${y - inset} ${x} ${y - radius} Z`;
  return svg('path', { d, class: className, ...attrs });
}

/** Clip strokes outside endpoint halos; graph coordinates and double traces stay intact. */
function starGapMask(
  parent: SVGElement,
  glyphs: Glyph[],
  reference: boolean,
): string {
  const id = reference
    ? `reference-star-gaps-${glyphs[0].segmentId}`
    : ATLAS_EDGE_MASK_ID;
  const vertices = [
    ...new Map(
      glyphs.flatMap((g) => g.vertices).map((v) => [v.id, v]),
    ).values(),
  ];
  const margin = ORIGIN_RING_RADIUS + LINE_HALO_GAP + 2;
  const minX = Math.min(...vertices.map((v) => v.point.x)) - margin;
  const minY = Math.min(...vertices.map((v) => v.point.y)) - margin;
  const width = Math.max(...vertices.map((v) => v.point.x)) - minX + margin;
  const height = Math.max(...vertices.map((v) => v.point.y)) - minY + margin;
  const defs = svg('defs');
  const mask = svg('mask', {
    id,
    maskUnits: 'userSpaceOnUse',
    maskContentUnits: 'userSpaceOnUse',
    x: minX,
    y: minY,
    width,
    height,
    style: 'mask-type: luminance',
  });
  mask.append(svg('rect', { x: minX, y: minY, width, height, fill: 'white' }));
  for (const vertex of vertices) {
    mask.append(
      svg('circle', {
        cx: vertex.point.x,
        cy: vertex.point.y,
        r: vertexKeepout(vertex, reference),
        fill: 'black',
        'data-vertex-id': vertex.id,
      }),
    );
  }
  defs.append(mask);
  parent.append(defs);
  return id;
}

function appendEdge(group: SVGGElement, edge: GlyphEdge, reference: boolean) {
  const start = edge.from.point,
    end = edge.to.point;
  const length = distance(start, end);
  const ux = (end.x - start.x) / length,
    uy = (end.y - start.y) / length;
  const line = (d: string, className = '') =>
    group.append(
      svg('path', { d, class: `segment glyph-stroke ${className}` }),
    );
  // End actual strokes before the mask boundary, leaving room for their round caps.
  const span = visibleEdgeSpan(edge, reference);
  const fromClearance = span.start;
  const toClearance = length - span.end;
  if (length <= fromClearance + toClearance) return;
  if (edge.style === 'double') {
    for (const side of [-1, 1]) {
      const perpendicular = side * 2.1;
      const fromInset =
        Math.sqrt(fromClearance ** 2 - perpendicular ** 2) / length;
      const toInset = Math.sqrt(toClearance ** 2 - perpendicular ** 2) / length;
      const offset = (t: number) => {
        const p = pointOnEdge(start, end, t);
        return { x: p.x - uy * perpendicular, y: p.y + ux * perpendicular };
      };
      line(
        `M ${xy(offset(fromInset))} L ${xy(offset(1 - toInset))}`,
        'double-trace',
      );
    }
  } else {
    line(
      `M ${xy(pointOnEdge(start, end, fromClearance / length))} L ${xy(pointOnEdge(start, end, 1 - toClearance / length))}`,
    );
    if (edge.style === 'cuts') {
      for (const shift of [-3.4, 3.4]) {
        const center = pointOnEdge(start, end, 0.5 + shift / length);
        const dx = ux * 1.8 - uy * 3.5,
          dy = uy * 1.8 + ux * 3.5;
        const d = `M ${center.x - dx} ${center.y - dy} L ${center.x + dx} ${center.y + dy}`;
        group.append(
          svg('path', { d, class: 'cut-underlay' }),
          svg('path', { d, class: 'glyph-cut' }),
        );
      }
    }
  }
}

/** Render graph edges once; attributes never create graph vertices or extra glyphs. */
export function appendGlyphs(
  parent: SVGElement,
  glyphs: Glyph[],
  includeBoundaries = false,
  text: Translator = DEFAULT_TRANSLATOR,
) {
  if (!glyphs.length) return;
  const maskId = starGapMask(parent, glyphs, includeBoundaries);
  const drawn = new Set<string>();
  for (const glyph of glyphs) {
    const group = svg('g', {
      class: 'glyph',
      'data-letter': glyph.letter,
      'data-segment-id': glyph.segmentId,
    });
    const title = svg('title');
    title.textContent = text.text('glyphName', { letter: glyph.letter });
    group.append(title);
    for (const edge of glyph.edges) {
      const edgeGroup = svg('g', {
        class: 'glyph-edge',
        'data-edge-id': edge.id,
        'data-style': edge.style,
        mask: `url(#${maskId})`,
      });
      appendEdge(edgeGroup, edge, includeBoundaries);
      group.append(edgeGroup);
    }
    for (const mark of glyph.marks)
      group.append(
        svg('circle', {
          cx: mark.point.x,
          cy: mark.point.y,
          r: mark.radius * MARK_HALO_SCALE,
          class: 'halo glyph-mark-halo',
        }),
        sparkle(mark.point, mark.radius, 'star glyph-mark', {
          'data-side': mark.side === -1 ? 'above' : 'below',
          'data-edge-id': mark.edgeId,
        }),
      );
    for (const vertex of glyph.vertices) {
      if ((vertex.boundary && !includeBoundaries) || drawn.has(vertex.id))
        continue;
      drawn.add(vertex.id);
      group.append(
        svg('circle', {
          cx: vertex.point.x,
          cy: vertex.point.y,
          r: INTERNAL_HALO_RADIUS,
          class: 'halo',
        }),
        sparkle(
          vertex.point,
          vertexBaseRadius(vertex, includeBoundaries),
          `star ${vertex.boundary ? 'boundary-star' : 'internal-star'}`,
        ),
      );
    }
    parent.append(group);
  }
}
