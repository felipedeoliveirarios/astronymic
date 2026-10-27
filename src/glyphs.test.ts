import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from './generator.ts';
import { distance, intersection } from './geometry.ts';
import {
  ALPHABET, definition, injectGlyph, injectConstellation, validateGlyphs,
  type GlyphSlot, type Letter,
} from './glyphs.ts';

function slot(letter: string, angle = 0, length = 100, id = 0): GlyphSlot {
  return { id, parentId: null, letter, start: { x: 20, y: 30 }, end: { x: 20 + Math.cos(angle) * length, y: 30 + Math.sin(angle) * length } };
}
// Independent alphabet fixture: vertex count, edge count, and ordered mark slots by path.
const expected: Record<Letter, [number, number, string[]]> = {
  A: [2, 1, ['']], B: [3, 3, ['', '']], C: [3, 3, ['', '']], D: [2, 1, ['^_^_']],
  E: [2, 1, ['^']], F: [2, 1, ['_^^']], G: [2, 1, ['___']], H: [4, 4, ['', '']],
  I: [2, 1, ['_']], J: [2, 1, ['_']], K: [2, 1, ['^:']], L: [2, 1, ['_:']],
  M: [2, 1, ['^_^']], N: [2, 1, ['_^_']], O: [2, 1, ['^^']], P: [3, 3, ['', '^']],
  Q: [3, 3, ['_', '']], R: [2, 1, [':']], S: [2, 1, ['^__']], T: [2, 1, ['^_']],
  U: [2, 1, ['__']], V: [2, 1, ['']], W: [2, 1, ['']], X: [2, 1, ['_^_^_']],
  Y: [2, 1, [':_']], Z: [2, 1, ['^^^']],
};

test('all 26 glyph graphs and ordered mark slots match the alphabet', () => {
  assert.equal(Object.keys(ALPHABET).length, 26);
  for (const [letter, [vertices, edges, paths]] of Object.entries(expected)) {
    const glyph = injectGlyph(slot(letter), 'alphabet', 0);
    assert.equal(glyph.vertices.length, vertices, letter);
    assert.equal(glyph.edges.length, edges, letter);
    assert.equal(glyph.paths.length, paths.length, letter);
    const def = definition(letter);
    assert.deepEqual(def.paths.map(path => path.flatMap(edge => edge.marks.map(sides => sides.length === 2 ? ':' : sides[0] === -1 ? '^' : '_')).join('')), paths, letter);
    assert.equal(glyph.marks.length, paths.join('').replaceAll(':', '^_').length, letter);
    assert.equal(glyph.edges.length - glyph.vertices.length + 1, paths.length - 1, 'cycle rank');
    for (const path of glyph.paths) {
      assert.strictEqual(path[0], glyph.vertices[0]);
      assert.strictEqual(path.at(-1), glyph.vertices[1]);
    }
    assert.equal(glyph.edges[0].style, letter === 'J' || letter === 'V' ? 'double' : letter === 'W' ? 'cuts' : 'single');
  }
  assert.throws(() => definition('?'), RangeError);
  assert.throws(() => definition('toString'), RangeError);
});

test('B/C, P/Q and H preserve path order and internal vertex counts after rotation', () => {
  for (let degrees = 0; degrees < 360; degrees += 15) {
    const angle = degrees * Math.PI / 180;
    for (const letter of ['B', 'C', 'H', 'P', 'Q']) {
      for (let seed = 0; seed < 10; seed++) {
        const input = slot(letter, angle);
        const glyph = injectGlyph(input, String(seed));
        assert.deepEqual(glyph.paths.map(p => p.length), letter === 'H' ? [4, 2] : letter === 'B' || letter === 'P' ? [3, 2] : [2, 3]);
        const localY = (point: { x: number; y: number }) => -(point.x - input.start.x) * Math.sin(angle) + (point.y - input.start.y) * Math.cos(angle);
        for (const [index, path] of glyph.paths.entries()) for (const vertex of path.slice(1, -1)) {
          assert.ok(index === 0 ? localY(vertex.point) < 0 : localY(vertex.point) > 0);
        }
        const back = angle + Math.PI;
        const outgoing = glyph.paths.map(path => {
          const p = path[1].point;
          return ((Math.atan2(p.y - input.start.y, p.x - input.start.x) - back) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        });
        assert.ok(outgoing[0] < outgoing[1], `${letter} outgoing path order`);
      }
    }
  }
});

test('marks stay globally above/below and ordered, including near-vertical and reversed edges', () => {
  for (const letter of Object.keys(ALPHABET)) {
    for (const angle of [0, 0.8, Math.PI / 2 - 0.001, Math.PI / 2, Math.PI / 2 + 0.001, Math.PI, -Math.PI / 2, -0.8]) {
      const glyph = injectGlyph(slot(letter, angle), 'marks');
      for (const edge of glyph.edges) {
        const marks = glyph.marks.filter(mark => mark.edgeId === edge.id);
        let previous = -Infinity;
        for (const mark of marks) {
          assert.ok(mark.side === -1 ? mark.point.y < mark.anchor.y : mark.point.y > mark.anchor.y, letter);
          const dx = edge.to.point.x - edge.from.point.x, dy = edge.to.point.y - edge.from.point.y;
          const t = ((mark.anchor.x - edge.from.point.x) * dx + (mark.anchor.y - edge.from.point.y) * dy) / (dx * dx + dy * dy);
          assert.ok(t > 0 && t < 1);
          assert.ok(t >= previous - 1e-10, letter);
          previous = t;
        }
        for (const above of marks.filter(m => m.side === -1)) {
          const below = marks.find(m => m.slot === above.slot && m.side === 1);
          if (below) assert.deepEqual(above.anchor, below.anchor, 'colon shares a longitudinal anchor');
        }
      }
    }
  }
});

test('canonical glyphs have no intrinsic geometry conflicts at minimum and normal lengths', () => {
  for (const letter of Object.keys(ALPHABET)) for (const length of [30, 100]) for (let degrees = 0; degrees < 360; degrees += 15) {
    assert.deepEqual(validateGlyphs([injectGlyph(slot(letter, degrees * Math.PI / 180, length), 'canonical', 0)]), [], `${letter} at ${degrees}°, length ${length}`);
  }
});

test('injection is reproducible and preserves every tree boundary without sharing internal IDs', () => {
  const tree = generate('BC H PQ J V W R', 'fixed');
  const before = structuredClone(tree);
  const result = injectConstellation(tree);
  assert.deepEqual(result, injectConstellation(tree));
  assert.deepEqual(tree, before, 'macrogeometry must not be mutated');
  assert.equal(result.glyphs.map(g => g.letter).join(''), tree.normalized);
  const internal = result.glyphs.flatMap(g => g.vertices.filter(v => !v.boundary).map(v => v.id));
  assert.equal(new Set(internal).size, internal.length);
  for (const [index, glyph] of result.glyphs.entries()) {
    const input = tree.segments[index];
    assert.strictEqual(glyph.vertices[0].point, input.start);
    assert.strictEqual(glyph.vertices[1].point, input.end);
    if (input.parentId !== null) assert.equal(glyph.vertices[0].id, result.glyphs[input.parentId].vertices[1].id);
  }
  assert.notDeepEqual(injectGlyph(slot('H'), 'first'), injectGlyph(slot('H'), 'second'));
  assert.deepEqual(injectConstellation(generate('123')).glyphs, []);
  assert.equal(injectConstellation(generate('Astronymic')).issues.length, 0);
});

test('deformations stay inside configured longitudinal/transverse and mark jitter bounds', () => {
  for (let seed = 0; seed < 30; seed++) {
    const regular = injectGlyph(slot('H'), 'regular', 0);
    const deformed = injectGlyph(slot('H'), String(seed));
    for (let i = 2; i < regular.vertices.length; i++) {
      assert.ok(Math.abs(regular.vertices[i].point.x - deformed.vertices[i].point.x) <= 10);
      assert.ok(Math.abs(regular.vertices[i].point.y - deformed.vertices[i].point.y) <= 15);
    }
    const g = injectGlyph(slot('X'), String(seed));
    const reference = injectGlyph(slot('X'), 'regular', 0);
    for (const [i, mark] of g.marks.entries()) {
      assert.ok(Math.abs(mark.anchor.x - reference.marks[i].anchor.x) <= 8);
      const regularGap = distance(reference.marks[i].anchor, reference.marks[i].point);
      assert.ok(Math.abs(distance(mark.anchor, mark.point) / regularGap - 1) <= 0.2 + 1e-10);
    }
  }
});

test('validation reports crossing, overlap and mark conflicts, while allowing true boundary joins', () => {
  const a = injectGlyph(slot('A'), 'conflict');
  const b = injectGlyph({ id: 1, parentId: null, letter: 'A', start: { x: 70, y: 0 }, end: { x: 70, y: 60 } }, 'conflict');
  assert.ok(validateGlyphs([a, b]).some(i => i.kind === 'edge-intersection'));
  assert.equal(intersection({x:0,y:0},{x:10,y:0},{x:5,y:0},{x:15,y:0}), 'overlap');
  const continuation = injectGlyph({ id: 1, parentId: 0, letter: 'A', start: a.vertices[1].point, end: {x:220,y:30} }, 'join');
  assert.deepEqual(validateGlyphs([a, continuation]), []);
  const marked = injectGlyph(slot('E'), 'conflict', 0);
  marked.marks[0].point = marked.marks[0].anchor;
  assert.ok(validateGlyphs([marked]).some(i => i.kind === 'mark-clearance'));
  const cramped = injectConstellation(generate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  assert.ok(cramped.issues.length > 0, 'unresolved conflicts must not be hidden');
  assert.equal(cramped.attempts, 7);
});
