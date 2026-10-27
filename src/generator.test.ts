import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generate,
  normalizeText,
  randomSource,
  type Segment,
} from './generator.ts';

test('normalization policy handles accents and filters unsupported characters', () => {
  assert.equal(normalizeText('Órbita, céu! 123 🌙'), 'ORBITACEU');
  assert.equal(generate('123').segments.length, 0);
  assert.throws(() => generate('a'.repeat(121)), RangeError);
});
test('same normalized text, seed and version reproduce every coordinate', () => {
  assert.deepEqual(generate('Órbita!'), generate('orbita'));
  assert.deepEqual(generate('ASTRONYMIC', '42'), generate('ASTRONYMIC', '42'));
  assert.notDeepEqual(
    generate('ASTRONYMIC', '42').segments,
    generate('ASTRONYMIC', '43').segments,
  );
  const random = randomSource('fixed');
  assert.deepEqual(
    [random(), random(), random()],
    [0.5401650061830878, 0.726846712641418, 0.2728199837729335],
  );
});
test('all slots occur exactly once in clockwise DFS, with connected boundaries', () => {
  for (const text of [
    'A',
    'CEU',
    'ASTRONYMIC',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'A'.repeat(120),
  ]) {
    for (let seed = 0; seed < 20; seed++) {
      const result = generate(text, String(seed));
      const visited: Segment[] = [];
      const walk = (nodes: Segment[], back: number) => {
        let previous = -1;
        for (const node of nodes) {
          const order =
            (((node.angle - back) % (2 * Math.PI)) + 2 * Math.PI) %
            (2 * Math.PI);
          assert.ok(order >= previous);
          previous = order;
          visited.push(node);
          if (node.parentId !== null)
            assert.deepEqual(node.start, result.segments[node.parentId].end);
          assert.ok(Number.isFinite(node.end.x) && Number.isFinite(node.end.y));
          assert.ok(node.length >= 30);
          walk(node.children, node.angle + Math.PI);
        }
      };
      walk(
        result.segments.filter((s) => s.parentId === null),
        -Math.PI / 2,
      );
      assert.equal(visited.map((s) => s.letter).join(''), text);
      assert.equal(new Set(visited.map((s) => s.id)).size, text.length);
    }
  }
});
test('representative short and long words obtain layouts without crossings', () => {
  for (const text of [
    'SOL',
    'LUA',
    'ASTRONYMIC',
    'CONSTELACAO',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ]) {
    assert.equal(generate(text).crossings, 0, text);
  }
});

test('Astronymic central continuation bends back and forth instead of flattening', () => {
  const result = generate('Astronymic');
  assert.equal(result.version, 'segments-v3');
  const chain = 'STRON'
    .split('')
    .map((letter) => result.segments.find((s) => s.letter === letter)!);
  const turns = chain.slice(1).map((segment, index) => {
    assert.equal(segment.parentId, chain[index].id);
    return segment.angle - chain[index].angle;
  });
  for (let i = 0; i < turns.length; i++) {
    assert.ok(
      Math.abs(turns[i]) > Math.PI / 18,
      'central turns should exceed ten degrees',
    );
    if (i > 0)
      assert.ok(
        turns[i] * turns[i - 1] < 0,
        'successive central turns should reverse direction',
      );
  }
  assert.equal(result.crossings, 0);
});

test('debug data describes actual branching trials, leaves and reserved sectors', () => {
  assert.deepEqual(generate('Astronymic').rootBranching, {
    probability: 0.5,
    trials: [
      { probability: 0.5, success: true },
      { probability: 0.25, success: false },
    ],
    inheritedProbability: 0.25,
    stop: 'failure',
  });
  assert.equal(generate('A').rootBranching.stop, 'budget');
  assert.deepEqual(generate('A').rootBranching.trials, []);
  assert.equal(generate('').rootBranching.stop, 'leaf');
  for (let seed = 0; seed < 20; seed++) {
    const result = generate('ABCDEFGHIJKLMNOPQRSTUVWXYZ', String(seed));
    const check = (
      branching: typeof result.rootBranching,
      children: Segment[],
    ) => {
      assert.equal(
        children.length,
        branching.stop === 'leaf'
          ? 0
          : 1 + branching.trials.filter((t) => t.success).length,
      );
      assert.ok(
        branching.trials.slice(0, -1).every((t) => t.success),
        'failure must terminate trials',
      );
      if (branching.stop === 'failure')
        assert.equal(branching.trials.at(-1)?.success, false);
      for (const child of children)
        assert.equal(
          child.debug.branching.probability,
          branching.inheritedProbability,
        );
    };
    check(
      result.rootBranching,
      result.segments.filter((s) => s.parentId === null),
    );
    for (const segment of result.segments) {
      const { sectorLow, sectorWidth, offset, branching } = segment.debug;
      assert.ok(
        segment.angle > sectorLow && segment.angle < sectorLow + sectorWidth,
      );
      assert.ok(Math.abs(offset) <= sectorWidth * 0.45 + 1e-12);
      check(branching, segment.children);
    }
  }
});
