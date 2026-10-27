import type { GlyphEdge, GlyphMark, Vertex } from './glyphs.ts';
import { distance } from './geometry.ts';

export const ATLAS_EDGE_MASK_ID = 'atlas-star-gaps';
export const VERTEX_HALO_RADIUS = 7;
export const INTERNAL_HALO_RADIUS = 5;
export const ORIGIN_RING_RADIUS = 13.5;
export const ORIGIN_STAR_RADIUS = 3.9;
export const LINE_HALO_GAP = 2;
export const STAR_SCALE = 2;
export const BOUNDARY_STAR_RADIUS = 2.7;
export const INTERNAL_STAR_RADIUS = 2.5;
export const MARK_HALO_SCALE = 2.6;

export function vertexKeepout(vertex: Vertex, reference: boolean): number {
  const halo =
    reference || !vertex.boundary
      ? INTERNAL_HALO_RADIUS
      : vertex.id === 'origin'
        ? ORIGIN_RING_RADIUS + 0.5
        : VERTEX_HALO_RADIUS;
  return halo + LINE_HALO_GAP;
}

/** Distances along the logical edge after reserving halos and rounded line caps. */
export function visibleEdgeSpan(
  edge: GlyphEdge,
  reference = false,
): { start: number; end: number; length: number } {
  return {
    start: vertexKeepout(edge.from, reference) + 0.5,
    end:
      distance(edge.from.point, edge.to.point) -
      vertexKeepout(edge.to, reference) -
      0.5,
    length: distance(edge.from.point, edge.to.point),
  };
}

/** Core footprints used by both rendering and collision validation (halos are decorative). */
export function vertexBaseRadius(vertex: Vertex, reference = false): number {
  if (reference || !vertex.boundary) return INTERNAL_STAR_RADIUS;
  return vertex.id === 'origin' ? ORIGIN_STAR_RADIUS : BOUNDARY_STAR_RADIUS;
}
export function vertexCoreRadius(vertex: Vertex, reference = false): number {
  return vertexBaseRadius(vertex, reference) * STAR_SCALE;
}
export function markCoreRadius(mark: GlyphMark): number {
  return mark.radius * STAR_SCALE;
}
export function edgeEnvelope(edge: GlyphEdge): number {
  return edge.style === 'double' ? 2.6 : edge.style === 'cuts' ? 4 : 0.5;
}
