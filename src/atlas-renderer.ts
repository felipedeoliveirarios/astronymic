import { DEFAULT_TRANSLATOR, type Translator } from './i18n.ts';
import type { Constellation, Branching } from './generator.ts';
import type { Injection } from './glyphs.ts';
import type { GlyphLabel } from './labels.ts';
import { appendGlyphs, sparkle } from './glyph-renderer.ts';
import {
  VERTEX_HALO_RADIUS,
  ORIGIN_RING_RADIUS,
  ORIGIN_STAR_RADIUS,
  ATLAS_EDGE_MASK_ID,
  BOUNDARY_STAR_RADIUS,
} from './appearance.ts';
import { svgElement as element } from './svg.ts';

function branchingLabel(branching: Branching, text: Translator): string {
  if (branching.stop === 'leaf') return text.text('branchEnd');
  if (!branching.trials.length)
    return text.text('branchNoTest', {
      probability: text.percent(branching.probability),
    });
  return branching.trials
    .map((t) => `${text.percent(t.probability)}${t.success ? '✓' : '×'}`)
    .join(' → ');
}
export function renderAtlas(
  result: Constellation,
  injection: Injection,
  placements: GlyphLabel[],
  showDebug: boolean,
  text: Translator = DEFAULT_TRANSLATOR,
): SVGSVGElement {
  const points = [
    { x: 0, y: 0 },
    ...injection.glyphs.flatMap((g) => [
      ...g.vertices.map((v) => v.point),
      ...g.marks.map((m) => m.point),
    ]),
    ...placements.flatMap((l) => [
      { x: l.box.x, y: l.box.y },
      { x: l.box.x + l.box.width, y: l.box.y + l.box.height },
    ]),
  ];
  const minX = Math.min(...points.map((p) => p.x)) - 60;
  const minY = Math.min(...points.map((p) => p.y)) - 60;
  const width = Math.max(250, Math.max(...points.map((p) => p.x)) - minX + 60);
  const height = Math.max(250, Math.max(...points.map((p) => p.y)) - minY + 60);
  const svg = element('svg', {
    viewBox: `${minX} ${minY} ${width} ${height}`,
    role: 'img',
    'aria-labelledby': 'svg-title svg-desc',
  });
  const svgTitle = element('title', { id: 'svg-title' });
  svgTitle.textContent = text.text('svgTitle', {
    text: result.normalized || text.text('emptyText'),
  });
  const desc = element('desc', { id: 'svg-desc' });
  desc.textContent = text.text('svgDescription', {
    count: text.number(injection.glyphs.length),
    text: result.normalized,
    issues: text.number(injection.issues.length),
    seed: result.seed,
    versions: `${result.version} / ${injection.version}`,
  });
  svg.append(svgTitle, desc);
  if (showDebug && result.segments.length) {
    const overlay = element('g', { class: 'debug-overlay' });
    for (const s of result.segments) {
      const { sectorLow: low, sectorWidth: width } = s.debug;
      const radius = Math.min(55, s.length * 0.7);
      const point = (angle: number) =>
        `${s.start.x + Math.cos(angle) * radius} ${s.start.y + Math.sin(angle) * radius}`;
      const wedge = element('path', {
        d: `M ${s.start.x} ${s.start.y} L ${point(low)} A ${radius} ${radius} 0 ${width > Math.PI ? 1 : 0} 1 ${point(low + width)} Z`,
        class: 'debug-sector',
        style: `--sector-color: hsl(${(s.id * 67 + 170) % 360} 65% 70%)`,
      });
      const tooltip = element('title', {});
      tooltip.textContent = text.text('sectorTooltip', {
        index: text.number(s.id + 1),
        letter: s.letter,
        width: text.decimal((width * 180) / Math.PI),
        start: text.decimal((low * 180) / Math.PI),
        offset: text.decimal((s.debug.offset * 180) / Math.PI),
      });
      wedge.append(tooltip);
      overlay.append(
        wedge,
        element('line', {
          x1: s.start.x,
          y1: s.start.y,
          x2: s.end.x,
          y2: s.end.y,
          class: 'macro-guide',
          mask: `url(#${ATLAS_EDGE_MASK_ID})`,
        }),
      );
    }
    svg.append(overlay);
  }
  appendGlyphs(svg, injection.glyphs, false, text);
  svg.append(
    element('circle', {
      cx: 0,
      cy: 0,
      r: ORIGIN_RING_RADIUS,
      class: 'origin-ring',
    }),
    sparkle({ x: 0, y: 0 }, ORIGIN_STAR_RADIUS, 'star origin-star'),
  );
  for (const s of result.segments) {
    svg.append(
      element('circle', {
        cx: s.end.x,
        cy: s.end.y,
        r: VERTEX_HALO_RADIUS,
        class: 'halo',
      }),
      sparkle(s.end, BOUNDARY_STAR_RADIUS),
    );
  }
  for (const placement of placements) {
    const label = element('text', {
      x: placement.center.x,
      y: placement.center.y,
      class: 'glyph-label',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
    });
    label.textContent = placement.text;
    svg.append(label);
  }
  if (showDebug && result.segments.length) {
    const nodes = [
      {
        point: { x: 0, y: 0 },
        name: text.text('origin'),
        branching: result.rootBranching,
      },
      ...result.segments.map((s) => ({
        point: s.end,
        name: text.text('junction', {
          index: text.number(s.id + 1),
          letter: s.letter,
        }),
        branching: s.debug.branching,
      })),
    ];
    for (const { point, name, branching } of nodes) {
      const label = element('text', {
        x: point.x + 10,
        y: point.y + 17,
        class: 'debug-probability',
      });
      label.textContent = branchingLabel(branching, text);
      const tooltip = element('title', {});
      const detail =
        branching.stop === 'leaf'
          ? text.text('branchEmpty')
          : text.text('branchInheritance', {
              probability: text.percent(branching.inheritedProbability),
              reason: text.text(
                branching.stop === 'budget' ? 'branchBudget' : 'branchFailure',
              ),
            });
      tooltip.textContent = text.text('branchTooltip', {
        name,
        probability: text.percent(branching.probability),
        tests: branchingLabel(branching, text),
        detail,
      });
      label.append(tooltip);
      svg.append(label);
    }
  }
  return svg;
}
