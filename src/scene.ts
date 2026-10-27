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
  const constellation = generate(text, seed);
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
