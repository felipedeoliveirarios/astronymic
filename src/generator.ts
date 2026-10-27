/** Prototype: macrogeometry only. Each edge is a slot for one future glyph. */
export const ALGORITHM_VERSION = 'segments-v3';
export const MAX_LETTERS = 120;
export type Point = { x: number; y: number };
export type Segment = {
  id: number;
  parentId: number | null;
  letter: string;
  start: Point;
  end: Point;
  length: number;
  angle: number;
  children: Segment[];
};
export type Constellation = {
  normalized: string;
  seed: string;
  version: string;
  segments: Segment[];
  crossings: number;
  attempts: number;
};

/** Initial text policy: decompose accents, uppercase, retain ASCII A–Z only. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z]/g, '');
}

/** FNV-1a over UTF-16 code units; paired with the explicitly versioned Mulberry32. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function randomSource(seed: string): () => number {
  let state = hash(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function defaultSeed(normalized: string): string {
  return hash(normalized).toString(16).padStart(8, '0');
}
const TAU = Math.PI * 2;
function clockwise(angle: number, reference: number): number {
  return ((angle - reference) % TAU + TAU) % TAU;
}

type Slot = { children: Slot[] };
/** Reserve a mandatory continuation first, then add only nonempty branches. */
function topology(count: number, probability: number, random: () => number): Slot[] {
  if (!count) return [];
  let childCount = 1;
  let inherited = probability;
  while (childCount < count && random() < inherited) {
    childCount++;
    inherited /= 2;
  }
  if (childCount === 1) inherited = Math.min(1, probability * 2);
  const budgets = Array<number>(childCount).fill(1);
  for (let remaining = count - childCount; remaining > 0; remaining--) {
    budgets[Math.floor(random() * childCount)]++;
  }
  return budgets.map(budget => ({ children: topology(budget - 1, inherited, random) }));
}

export function intersects(a: Segment, b: Segment): boolean {
  // Adjacent glyphs intentionally meet at a boundary; ignore that common endpoint.
  const same = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-7;
  if ([a.start, a.end].some(p => [b.start, b.end].some(q => same(p, q)))) return false;
  const cross = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const on = (p: Point, q: Point, r: Point) => Math.abs(cross(p, q, r)) < 1e-7 &&
    r.x >= Math.min(p.x, q.x) - 1e-7 && r.x <= Math.max(p.x, q.x) + 1e-7 &&
    r.y >= Math.min(p.y, q.y) - 1e-7 && r.y <= Math.max(p.y, q.y) + 1e-7;
  const c1 = cross(a.start, a.end, b.start), c2 = cross(a.start, a.end, b.end);
  const c3 = cross(b.start, b.end, a.start), c4 = cross(b.start, b.end, a.end);
  return (c1 * c2 < 0 && c3 * c4 < 0) || on(a.start, a.end, b.start) ||
    on(a.start, a.end, b.end) || on(b.start, b.end, a.start) || on(b.start, b.end, a.end);
}

export function generate(text: string, customSeed?: string): Constellation {
  const normalized = normalizeText(text);
  if (normalized.length > MAX_LETTERS) throw new RangeError(`Use até ${MAX_LETTERS} letras.`);
  const seed = customSeed?.trim() || defaultSeed(normalized);
  let best: Constellation | undefined;
  for (let attempt = 0; attempt < 32; attempt++) {
    // Keep the v1 random stream so this revision changes angles, not topology or lengths.
    const random = randomSource(`segments-v1:${seed}:${attempt}`);
    const roots = topology(normalized.length, 0.5, random);
    const segments: Segment[] = [];
    function layout(slots: Slot[], start: Point, low: number, width: number, parent: Segment | null, offset: number): Segment[] {
      const candidates = slots.map((slot, index) => {
        const sectorLow = low + width * index / slots.length;
        const sectorWidth = width / slots.length;
        // Counter the parent's actual deviation from its sector center. Randomness
        // keeps this from becoming a rigid zigzag; clamping preserves the reservation.
        const shift = Math.max(-sectorWidth * 0.45, Math.min(sectorWidth * 0.45, -offset + (random() - 0.5) * 0.4 * sectorWidth));
        const angle = sectorLow + sectorWidth / 2 + shift;
        const length = Math.max(30, 100 + 0.5 * (100 - (parent?.length ?? 100)) + (random() - 0.5) * 60);
        return { slot, sectorLow, sectorWidth, shift, angle, length };
      });
      const back = parent ? parent.angle + Math.PI : -Math.PI / 2;
      candidates.sort((a, b) => clockwise(a.angle, back) - clockwise(b.angle, back));
      return candidates.map(c => {
        const segment: Segment = {
          id: segments.length, parentId: parent?.id ?? null,
          letter: normalized[segments.length], start,
          end: { x: start.x + Math.cos(c.angle) * c.length, y: start.y + Math.sin(c.angle) * c.length },
          length: c.length, angle: c.angle, children: [],
        };
        segments.push(segment);
        segment.children = layout(c.slot.children, segment.end, c.sectorLow, c.sectorWidth, segment, c.shift);
        return segment;
      });
    }
    layout(roots, { x: 0, y: 0 }, -Math.PI / 6, Math.PI * 4 / 3, null, 0);
    let crossings = 0;
    for (let i = 0; i < segments.length; i++) for (let j = i + 1; j < segments.length; j++) {
      if (intersects(segments[i], segments[j])) crossings++;
    }
    const result = { normalized, seed, version: ALGORITHM_VERSION, segments, crossings, attempts: attempt + 1 };
    if (!best || crossings < best.crossings) best = result;
    if (crossings === 0) return result;
  }
  return { ...best!, attempts: 32 };
}
