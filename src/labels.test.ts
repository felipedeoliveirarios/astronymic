import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from './generator.ts';
import { ALPHABET, injectGlyph, injectConstellation, validateGlyphs } from './glyphs.ts';
import { MARK_HALO_SCALE, visibleEdgeSpan } from './appearance.ts';
import { boxesOverlap, glyphCenter, placeGlyphLabels } from './labels.ts';

test('marks and their halos remain in visible longitudinal side bands at every orientation', () => {
  for (const letter of Object.keys(ALPHABET)) for (const length of [30, 100]) {
    for (const angle of [0, 0.8, Math.PI / 2 - 0.001, Math.PI / 2, Math.PI / 2 + 0.001, Math.PI, -Math.PI / 2, -0.8]) {
      for (let seed = 0; seed < 5; seed++) {
        const glyph = injectGlyph({ id: 0, parentId: null, letter, start: {x:20,y:30}, end: {x:20+Math.cos(angle)*length,y:30+Math.sin(angle)*length} }, String(seed));
        for (const edge of glyph.edges) {
          const span = visibleEdgeSpan(edge);
          let previous = -Infinity;
          let previousSlot = -1;
          for (const mark of glyph.marks.filter(m => m.edgeId === edge.id)) {
            const ux = (edge.to.point.x - edge.from.point.x) / span.length;
            const uy = (edge.to.point.y - edge.from.point.y) / span.length;
            const projection = (mark.point.x - edge.from.point.x) * ux + (mark.point.y - edge.from.point.y) * uy;
            const halo = mark.radius * MARK_HALO_SCALE;
            assert.ok(projection - halo >= span.start - 1e-9, `${letter} before visible start`);
            assert.ok(projection + halo <= span.end + 1e-9, `${letter} after visible end`);
            if (mark.slot !== previousSlot) assert.ok(projection > previous, `${letter} mark order`);
            previous = projection; previousSlot = mark.slot;
          }
        }
      }
    }
  }
});

test('label base uses the full glyph center, including compound internal vertices', () => {
  const glyph = injectGlyph({id:0,parentId:null,letter:'B',start:{x:0,y:0},end:{x:100,y:0}}, 'center', 0);
  assert.deepEqual(glyphCenter(glyph), {x:50,y:-11});
  const [label] = placeGlyphLabels([glyph]);
  assert.deepEqual(label.glyphCenter, {x:50,y:-11});
  assert.equal(label.collisions, 0);
});

test('horizontal labels prefer above and vertical labels choose a free side', () => {
  const make = (end: {x:number;y:number}) => injectGlyph({id:0,parentId:null,letter:'A',start:{x:0,y:0},end}, 'labels');
  const [horizontal] = placeGlyphLabels([make({x:100,y:0})]);
  assert.equal(horizontal.center.x,50); assert.ok(horizontal.center.y < 0);
  const [vertical] = placeGlyphLabels([make({x:0,y:100})]);
  assert.equal(vertical.center.y,50); assert.ok(vertical.center.x > 0);
});

test('label placement avoids geometry and other labels reproducibly on representative texts', () => {
  for (const word of ['Astronymic','BC H PQ J V W R','CONSTELACAO','ABCDEFGHIJKLMNOPQRSTUVWXYZ']) {
    const injection = injectConstellation(generate(word));
    const placements = placeGlyphLabels(injection.glyphs);
    assert.deepEqual(placements, placeGlyphLabels(injection.glyphs));
    assert.equal(placements.length, injection.glyphs.length);
    for (const label of placements) assert.equal(label.collisions,0, `${word}: ${label.text}`);
    for (let i=0;i<placements.length;i++) for (let j=i+1;j<placements.length;j++) {
      assert.equal(boxesOverlap(placements[i].box,placements[j].box),false);
    }
  }
  assert.deepEqual(placeGlyphLabels([]),[]);
});

test('validation reports marks outside the visible range instead of accepting an overrun', () => {
  const glyph = injectGlyph({id:0,parentId:null,letter:'E',start:{x:0,y:0},end:{x:100,y:0}}, 'bounds', 0);
  glyph.marks[0].point.x = 99;
  assert.ok(validateGlyphs([glyph]).some(issue => issue.kind === 'mark-range'));
});
