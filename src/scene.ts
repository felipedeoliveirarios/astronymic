import {
  defaultSeed,
  generate,
  normalizeText,
  type Constellation,
} from './generator.ts';
import { injectConstellation, type Injection } from './glyphs.ts';
import { placeGlyphLabels, type GlyphLabel } from './labels.ts';

export type Scene = { constellation: Constellation; injection: Injection };
type BuildScene = (text: string, seed: string) => Scene;
const buildScene: BuildScene = (text, seed) => {
  const easterEgg = text === 'FAZOL';
  const constellation = generate(easterEgg ? 'AA' : text, seed);
  if (easterEgg) {
    constellation.normalized = text;
    // Two A glyphs share the origin at the corner of an upright L.
    constellation.segments.forEach((segment, index) => {
      segment.parentId = null;
      segment.start = { x: 0, y: 0 };
      segment.end = index === 0 ? { x: 0, y: -160 } : { x: 100, y: 0 };
      segment.angle = index === 0 ? -Math.PI / 2 : 0;
      segment.length = index === 0 ? 160 : 100;
      segment.children = [];
      segment.debug = {
        sectorLow: segment.angle,
        sectorWidth: 0,
        offset: 0,
        branching: {
          probability: 0,
          trials: [],
          inheritedProbability: 0,
          stop: 'leaf',
        },
      };
    });
    constellation.crossings = 0;
    constellation.attempts = 1;
    constellation.rootBranching = {
      probability: 1,
      trials: [],
      inheritedProbability: 0,
      stop: 'budget',
    };
  }
  return { constellation, injection: injectConstellation(constellation) };
};

/** Bounded to the current scene and one font measurement; toggles never regenerate geometry. */
export function createSceneCache(
  build: BuildScene = buildScene,
  layout = placeGlyphLabels,
) {
  let sceneKey: string | undefined;
  let scene: Scene;
  let labelScene: Scene | undefined;
  let labelKey: string | undefined;
  let placements: GlyphLabel[];
  return {
    getScene(text: string, customSeed?: string): Scene {
      const normalized = normalizeText(text);
      const seed = customSeed?.trim() || defaultSeed(normalized);
      const key = JSON.stringify([normalized, seed]);
      if (key !== sceneKey) {
        const next = build(normalized, seed);
        scene = next;
        sceneKey = key;
      }
      return scene;
    },
    getLabels(
      current: Scene,
      measurementKey: string,
      measure: (text: string) => number,
    ): GlyphLabel[] {
      if (current !== labelScene || measurementKey !== labelKey) {
        placements = layout(current.injection.glyphs, measure);
        labelScene = current;
        labelKey = measurementKey;
      }
      return placements;
    },
  };
}
