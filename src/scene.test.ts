import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, defaultSeed, normalizeText } from './generator.ts';
import { injectConstellation } from './glyphs.ts';
import { placeGlyphLabels } from './labels.ts';
import { createSceneCache } from './scene.ts';

test('equivalent text, automatic seed and redraws reuse the complete generated scene', () => {
  let builds = 0;
  const cache = createSceneCache((text, seed) => {
    builds++;
    const constellation = generate(text, seed);
    return { constellation, injection: injectConstellation(constellation) };
  });
  const first = cache.getScene('Órbita!');
  for (let i = 0; i < 5; i++)
    assert.strictEqual(cache.getScene('orbita'), first);
  assert.strictEqual(
    cache.getScene('ÓRBITA', defaultSeed(normalizeText('Órbita!'))),
    first,
  );
  assert.equal(builds, 1);
  const customized = cache.getScene('orbita', 'custom');
  assert.notStrictEqual(customized, first);
  assert.strictEqual(cache.getScene('orbita', ' custom '), customized);
  assert.equal(builds, 2);
  assert.notStrictEqual(cache.getScene('different', 'custom'), customized);
  assert.equal(builds, 3);
});

test('labels reuse measurements until the scene or font measurement key changes', () => {
  let layouts = 0;
  let measurements = 0;
  const cache = createSceneCache(undefined, (glyphs, measure) => {
    layouts++;
    return placeGlyphLabels(glyphs, measure);
  });
  const measure = (text: string) => {
    measurements++;
    return text.length * 5;
  };
  const scene = cache.getScene('ASTRONYMIC');
  const first = cache.getLabels(scene, 'fallback', measure);
  const measured = measurements;
  assert.strictEqual(cache.getLabels(scene, 'fallback', measure), first);
  assert.equal(layouts, 1);
  assert.equal(measurements, measured);
  const loaded = cache.getLabels(scene, 'loaded', measure);
  assert.notStrictEqual(loaded, first);
  assert.equal(layouts, 2);
  assert.strictEqual(
    cache.getScene('ASTRONYMIC'),
    scene,
    'font loading must not regenerate geometry',
  );
  assert.strictEqual(cache.getLabels(scene, 'loaded', measure), loaded);
  cache.getLabels(cache.getScene('SOL'), 'loaded', measure);
  assert.equal(layouts, 3);
});

test('a failed generation cannot make the previous scene cache return stale data for new input', () => {
  const cache = createSceneCache();
  const scene = cache.getScene('SOL');
  assert.throws(() => cache.getScene('A'.repeat(121)), RangeError);
  assert.strictEqual(cache.getScene('SOL'), scene);
});
