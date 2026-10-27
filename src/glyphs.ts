import { randomSource, type Constellation, type Point, type Segment } from './generator.ts';
import { MARK_HALO_SCALE, visibleEdgeSpan } from './appearance.ts';
import { distance, intersection, pointEdgeDistance, pointOnEdge } from './geometry.ts';

export const GLYPH_VERSION = 'glyphs-v2';
export const ALPHABET = {
  A: 'oo', B: 'o(o/)o', C: 'o(/o)o', D: 'o^_^_o', E: 'o^o', F: 'o_^^o',
  G: 'o___o', H: 'o(oo/)o', I: 'o_o', J: 'o=_o', K: 'o^:o', L: 'o_:o',
  M: 'o^_^o', N: 'o_^_o', O: 'o^^o', P: 'o(o/^)o', Q: 'o(_/o)o',
  R: 'o:o', S: 'o^__o', T: 'o^_o', U: 'o__o', V: 'o=o', W: 'o|o',
  X: 'o_^_^_o', Y: 'o:_o', Z: 'o^^^o',
} as const;
export type GlyphSlot = Pick<Segment, 'id' | 'parentId' | 'letter' | 'start' | 'end'>;
export type Letter = keyof typeof ALPHABET;
export type Side = -1 | 1;
export type EdgeStyle = 'single' | 'double' | 'cuts';
export type EdgeDefinition = { style: EdgeStyle; marks: Side[][] };
export type GlyphDefinition = { letter: Letter; notation: string; paths: EdgeDefinition[][] };
export type Vertex = { id: string; point: Point; boundary: boolean };
export type GlyphEdge = { id: string; from: Vertex; to: Vertex; style: EdgeStyle; path: number };
export type GlyphMark = { id: string; edgeId: string; slot: number; side: Side; anchor: Point; point: Point; radius: number };
export type Glyph = {
  segmentId: number; letter: Letter; notation: string; vertices: Vertex[];
  paths: Vertex[][]; edges: GlyphEdge[]; marks: GlyphMark[];
};
export type GeometryIssue = { kind: 'edge-intersection' | 'vertex-clearance' | 'mark-clearance' | 'mark-range'; items: [string, string] };
export type Injection = { version: string; glyphs: Glyph[]; issues: GeometryIssue[]; attempts: number };

/** Internal `o`s split edges. Colons are a single longitudinal slot with two marks. */
function parsePath(notation: string): EdgeDefinition[] {
  const edges: EdgeDefinition[] = [];
  let current: EdgeDefinition = { style: 'single', marks: [] };
  for (const token of notation) {
    if (token === 'o') { edges.push(current); current = { style: 'single', marks: [] }; }
    else if (token === '^') current.marks.push([-1]);
    else if (token === '_') current.marks.push([1]);
    else if (token === ':') current.marks.push([-1, 1]);
    else if (token === '=') current.style = 'double';
    else if (token === '|') current.style = 'cuts';
    else throw new Error(`Unknown glyph token: ${token}`);
  }
  edges.push(current);
  return edges;
}
export function definition(letter: string): GlyphDefinition {
  if (!Object.hasOwn(ALPHABET, letter)) throw new RangeError(`Unsupported glyph: ${letter}`);
  const key = letter as Letter;
  const notation = ALPHABET[key];
  const body = notation.slice(1, -1);
  const paths = body.startsWith('(') ? body.slice(1, -1).split('/') : [body];
  return { letter: key, notation, paths: paths.map(parsePath) };
}

/** Global upper normal; exactly vertical edges use a tiny above-right displacement. */
export function upperDirection(start: Point, end: Point): Point {
  const length = distance(start, end);
  const ux = (end.x - start.x) / length, uy = (end.y - start.y) / length;
  if (Math.abs(ux) < 1e-7) {
    const norm = Math.hypot(1, 0.02);
    return { x: 1 / norm, y: -0.02 / norm };
  }
  return ux > 0 ? { x: uy, y: -ux } : { x: -uy, y: ux };
}

/** Fixed boundaries, ordered internal vertices, and a separate deterministic micro stream. */
export function injectGlyph(segment: GlyphSlot, seed: string, deformation = 1, attempt = 0, reference = false): Glyph {
  const def = definition(segment.letter);
  const length = distance(segment.start, segment.end);
  if (length < 1e-7) throw new RangeError('A glyph needs distinct entry and exit points.');
  if (deformation < 0 || deformation > 1) throw new RangeError('Deformation must be between zero and one.');
  const ux = (segment.end.x - segment.start.x) / length, uy = (segment.end.y - segment.start.y) / length;
  const random = randomSource(`glyphs-v1:${seed}:${segment.id}:${segment.letter}:${attempt}`);
  const entry: Vertex = { id: segment.parentId === null ? 'origin' : `boundary:${segment.parentId}`, point: segment.start, boundary: true };
  const exit: Vertex = { id: `boundary:${segment.id}`, point: segment.end, boundary: true };
  const glyph: Glyph = { segmentId: segment.id, letter: def.letter, notation: def.notation, vertices: [entry, exit], paths: [], edges: [], marks: [] };
  for (const [pathIndex, edges] of def.paths.entries()) {
    const vertices = [entry];
    for (let i = 1; i < edges.length; i++) {
      const x = i / edges.length + (random() - 0.5) * 0.2 * deformation;
      // First path is counterclockwise from the chord, second is clockwise.
      // Even at full jitter internal points cannot switch sides or longitudinal order.
      const side = pathIndex === 0 ? -1 : 1;
      const y = side * (Math.max(0.22, 11 / length) + (random() - 0.5) * 0.3 * deformation);
      const vertex: Vertex = {
        id: `glyph:${segment.id}:path:${pathIndex}:vertex:${i}`,
        point: { x: segment.start.x + length * (ux * x - uy * y), y: segment.start.y + length * (uy * x + ux * y) },
        boundary: false,
      };
      vertices.push(vertex); glyph.vertices.push(vertex);
    }
    vertices.push(exit); glyph.paths.push(vertices);
    for (const [edgeIndex, spec] of edges.entries()) {
      const edge: GlyphEdge = { id: `glyph:${segment.id}:path:${pathIndex}:edge:${edgeIndex}`, from: vertices[edgeIndex], to: vertices[edgeIndex + 1], style: spec.style, path: pathIndex };
      glyph.edges.push(edge);
      const edgeLength = distance(edge.from.point, edge.to.point);
      const upper = upperDirection(edge.from.point, edge.to.point);
      const span = visibleEdgeSpan(edge, reference);
      // A marked edge reserves longitudinal slots inside the visible stroke, not its halos.
      // Extremely short edges keep a centered slot; validation reports any cramped geometry.
      const available = Math.max(0, span.end - span.start);
      const step = available / (spec.marks.length + 1);
      const spacing = 1 / (spec.marks.length + 1);
      const tangent = { x: (edge.to.point.x - edge.from.point.x) / edgeLength, y: (edge.to.point.y - edge.from.point.y) / edgeLength };
      const drift = upper.x * tangent.x + upper.y * tangent.y;
      for (const [slot, sides] of spec.marks.entries()) {
        const jitter = (random() - 0.5) * 2 * Math.min(0.08 * edgeLength, step * 0.2) * deformation;
        const longitudinal = available > 0 ? span.start + (slot + 1) * step + jitter : edgeLength / 2;
        const anchor = pointOnEdge(edge.from.point, edge.to.point, longitudinal / edgeLength);
        const radius = Math.min(1.5, edgeLength * spacing * 0.15, available > 0 ? step * 0.3 / MARK_HALO_SCALE : 1.5);
        for (const side of sides) {
          const sampledGap = Math.max(edge.style === 'double' ? 7 : 4.5, Math.min(8, edgeLength * 0.075)) * (1 + (random() - 0.5) * 0.4 * deformation);
          // Near exactly vertical edges, reserve room for the tiny global up/down shift too.
          const gap = available > 0 && Math.abs(drift) > 1e-10 ? Math.min(sampledGap, step * 0.15 / Math.abs(drift)) : sampledGap;
          glyph.marks.push({
            id: `${edge.id}:slot:${slot}:side:${side}`, edgeId: edge.id, slot, side, anchor,
            point: { x: anchor.x - side * upper.x * gap, y: anchor.y - side * upper.y * gap }, radius,
          });
        }
      }
    }
  }
  return glyph;
}

/** Only common graph boundary IDs may touch. Double traces remain one logical edge. */
export function validateGlyphs(glyphs: Glyph[], reference = false): GeometryIssue[] {
  const edges = glyphs.flatMap(g => g.edges);
  const marks = glyphs.flatMap(g => g.marks);
  const vertices = [...new Map(glyphs.flatMap(g => g.vertices).map(v => [v.id, v])).values()];
  const issues: GeometryIssue[] = [];
  const envelope = (edge: GlyphEdge) => edge.style === 'double' ? 2.6 : edge.style === 'cuts' ? 4 : 0.5;
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const a = edges[i], b = edges[j];
    const shared = [a.from.id, a.to.id].some(id => id === b.from.id || id === b.to.id);
    const kind = intersection(a.from.point, a.to.point, b.from.point, b.to.point);
    if (kind !== 'none' && !(shared && kind === 'touch')) issues.push({ kind: 'edge-intersection', items: [a.id, b.id] });
  }
  for (const vertex of vertices) for (const edge of edges) {
    if (vertex.id === edge.from.id || vertex.id === edge.to.id) continue;
    if (pointEdgeDistance(vertex.point, edge.from.point, edge.to.point) < 2.7 + envelope(edge)) issues.push({ kind: 'vertex-clearance', items: [vertex.id, edge.id] });
  }
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) {
    if (distance(vertices[i].point, vertices[j].point) < 5.4) issues.push({ kind: 'vertex-clearance', items: [vertices[i].id, vertices[j].id] });
  }
  const edgeById = new Map(edges.map(edge => [edge.id, edge]));
  for (const mark of marks) {
    const ownEdge = edgeById.get(mark.edgeId)!;
    const span = visibleEdgeSpan(ownEdge, reference);
    const ux = (ownEdge.to.point.x - ownEdge.from.point.x) / span.length;
    const uy = (ownEdge.to.point.y - ownEdge.from.point.y) / span.length;
    const projection = (mark.point.x - ownEdge.from.point.x) * ux + (mark.point.y - ownEdge.from.point.y) * uy;
    const halo = mark.radius * MARK_HALO_SCALE;
    if (projection - halo < span.start - 1e-7 || projection + halo > span.end + 1e-7) issues.push({ kind: 'mark-range', items: [mark.id, ownEdge.id] });
    for (const edge of edges) {
      if (pointEdgeDistance(mark.point, edge.from.point, edge.to.point) < mark.radius + envelope(edge) + 0.5) issues.push({ kind: 'mark-clearance', items: [mark.id, edge.id] });
    }
    for (const vertex of vertices) {
      if (distance(mark.point, vertex.point) < mark.radius + 3.2) issues.push({ kind: 'mark-clearance', items: [mark.id, vertex.id] });
    }
  }
  for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) {
    if (distance(marks[i].point, marks[j].point) < marks[i].radius + marks[j].radius + 0.5) issues.push({ kind: 'mark-clearance', items: [marks[i].id, marks[j].id] });
  }
  return issues;
}

/** Retry microgeometry only: the tree's input/output points never move. */
export function injectConstellation(constellation: Constellation): Injection {
  let best: Injection | undefined;
  const amplitudes = [1, 1, 0.75, 0.5, 0.25, 0.1, 0];
  for (const [attempt, amplitude] of amplitudes.entries()) {
    const glyphs = constellation.segments.map(s => injectGlyph(s, constellation.seed, amplitude, attempt));
    const issues = validateGlyphs(glyphs);
    const result = { version: GLYPH_VERSION, glyphs, issues, attempts: attempt + 1 };
    if (!best || issues.length < best.issues.length) best = result;
    if (!issues.length) return result;
  }
  return { ...best!, attempts: amplitudes.length };
}
