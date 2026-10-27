import type { Point } from './generator.ts';

const EPS = 1e-7;
export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y); }
export function pointOnEdge(start: Point, end: Point, t: number): Point {
  return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
}
export function pointEdgeDistance(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x, dy = end.y - start.y;
  const squared = dx * dx + dy * dy;
  const t = squared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / squared)) : 0;
  return distance(point, pointOnEdge(start, end, t));
}
export function intersection(a: Point, b: Point, c: Point, d: Point): 'none' | 'touch' | 'cross' | 'overlap' {
  const cross = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const ca = cross(a, b, c), da = cross(a, b, d), ac = cross(c, d, a), bc = cross(c, d, b);
  if (Math.abs(ca) < EPS && Math.abs(da) < EPS && Math.abs(ac) < EPS && Math.abs(bc) < EPS) {
    const axis = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'x' : 'y';
    const overlap = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis])) -
      Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]));
    return overlap > EPS ? 'overlap' : overlap >= -EPS ? 'touch' : 'none';
  }
  if (ca * da < -EPS && ac * bc < -EPS) return 'cross';
  if (pointEdgeDistance(a, c, d) < EPS || pointEdgeDistance(b, c, d) < EPS ||
      pointEdgeDistance(c, a, b) < EPS || pointEdgeDistance(d, a, b) < EPS) return 'touch';
  return 'none';
}
