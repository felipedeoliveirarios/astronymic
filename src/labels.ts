import type { Glyph, GlyphEdge } from './glyphs.ts';
import type { Point } from './generator.ts';
import { intersection } from './geometry.ts';
import { LINE_HALO_GAP, MARK_HALO_SCALE, vertexKeepout } from './appearance.ts';

export type Rect = { x: number; y: number; width: number; height: number };
export type GlyphLabel = { segmentId: number; text: string; center: Point; glyphCenter: Point; box: Rect; collisions: number };
type Circle = { point: Point; radius: number };

export function glyphCenter(glyph: Glyph): Point {
  const points = glyph.vertices.map(v => v.point);
  return {
    x: (Math.min(...points.map(p => p.x)) + Math.max(...points.map(p => p.x))) / 2,
    y: (Math.min(...points.map(p => p.y)) + Math.max(...points.map(p => p.y))) / 2,
  };
}
function padded(box: Rect, margin: number): Rect {
  return { x: box.x - margin, y: box.y - margin, width: box.width + margin * 2, height: box.height + margin * 2 };
}
export function boxesOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
function circleHitsBox(circle: Circle, box: Rect): boolean {
  const x = Math.max(box.x, Math.min(circle.point.x, box.x + box.width));
  const y = Math.max(box.y, Math.min(circle.point.y, box.y + box.height));
  return Math.hypot(x - circle.point.x, y - circle.point.y) < circle.radius;
}
function edgeHitsBox(edge: GlyphEdge, box: Rect): boolean {
  const a = edge.from.point, b = edge.to.point;
  if (Math.max(a.x, b.x) < box.x || Math.min(a.x, b.x) > box.x + box.width ||
      Math.max(a.y, b.y) < box.y || Math.min(a.y, b.y) > box.y + box.height) return false;
  const inside = (p: Point) => p.x >= box.x && p.x <= box.x + box.width && p.y >= box.y && p.y <= box.y + box.height;
  if (inside(a) || inside(b)) return true;
  const corners = [{x:box.x,y:box.y},{x:box.x+box.width,y:box.y},{x:box.x+box.width,y:box.y+box.height},{x:box.x,y:box.y+box.height}];
  return corners.some((p, i) => intersection(a, b, p, corners[(i + 1) % 4]) !== 'none');
}

/** Place from the glyph's own center, trying close upper/side positions before moving out. */
export function placeGlyphLabels(glyphs: Glyph[], measureText: (text: string) => number = text => text.length * 5.5): GlyphLabel[] {
  const labels: GlyphLabel[] = [];
  const vertices = [...new Map(glyphs.flatMap(g => g.vertices).map(v => [v.id, v])).values()];
  const circles: Circle[] = [
    ...vertices.map(v => ({ point: v.point, radius: vertexKeepout(v, false) - LINE_HALO_GAP })),
    ...glyphs.flatMap(g => g.marks.map(m => ({ point: m.point, radius: m.radius * MARK_HALO_SCALE }))),
  ];
  const edges = glyphs.flatMap(g => g.edges);
  for (const glyph of glyphs) {
    const text = `${glyph.segmentId + 1} · ${glyph.letter}`;
    const width = measureText(text) + 2, height = 10;
    const base = glyphCenter(glyph);
    const entry = glyph.vertices[0].point, exit = glyph.vertices[1].point;
    const vertical = Math.abs(exit.y - entry.y) > Math.abs(exit.x - entry.x);
    const directions = vertical ? [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[-1,-1],[1,1],[-1,1]] : [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1],[1,1],[-1,1]];
    let best: GlyphLabel | undefined;
    let bestScore = Infinity;
    for (const gap of [4, 8, 12, 18, 26, 38, 56]) {
      for (const [index, [dx, dy]] of directions.entries()) {
        const center = { x: base.x + dx * (width / 2 + gap), y: base.y + dy * (height / 2 + gap) };
        const box = { x: center.x - width / 2, y: center.y - height / 2, width, height };
        const safe = padded(box, 2);
        const collisions = circles.filter(c => circleHitsBox(c, safe)).length +
          edges.filter(e => edgeHitsBox(e, padded(safe, e.style === 'double' ? 2.6 : e.style === 'cuts' ? 4 : 0.5))).length +
          labels.filter(l => boxesOverlap(safe, l.box)).length;
        const score = collisions * 10000 + gap + index * 0.1;
        if (score < bestScore) { bestScore = score; best = { segmentId: glyph.segmentId, text, center, glyphCenter: base, box, collisions }; }
        if (!collisions) break;
      }
      if (best?.collisions === 0) break;
    }
    labels.push(best!);
  }
  return labels;
}
