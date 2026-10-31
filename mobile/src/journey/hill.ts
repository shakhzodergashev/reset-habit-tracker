// The hill drawing's shape, shared by the Today and Stats hills.
// The website has the same numbers, so both put the cyclist in the same place.

// The drawing is 320 x 150 "units" and scales to the card's width.
export const WIDTH = 320;
export const HEIGHT = 150;

// The road up the hill: a curve from bottom left (P0) to top right (P3).
const P0 = { x: 0, y: 132 };
const P1 = { x: 130, y: 132 };
const P2 = { x: 190, y: 58 };
const P3 = { x: 320, y: 50 };
export const ROAD = `M${P0.x},${P0.y} C${P1.x},${P1.y} ${P2.x},${P2.y} ${P3.x},${P3.y}`;

// Progress 0 = the bottom of the road, 1 = the finish flag near the top.
const START = 0.06;
const FINISH = 0.92;

/** A point on the road and the slope there (in degrees), for t between 0 and 1. */
function pointOnRoad(t: number) {
  const u = 1 - t;
  const at = (a: number, b: number, c: number, d: number) =>
    u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  const slope = (a: number, b: number, c: number, d: number) =>
    3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
  return {
    x: at(P0.x, P1.x, P2.x, P3.x),
    y: at(P0.y, P1.y, P2.y, P3.y),
    angle:
      (Math.atan2(slope(P0.y, P1.y, P2.y, P3.y), slope(P0.x, P1.x, P2.x, P3.x)) * 180) / Math.PI,
  };
}

/** Where the cyclist stands for some progress between 0 and 1. */
export function riderAt(progress: number) {
  const p = Math.min(Math.max(progress, 0), 1);
  return pointOnRoad(START + (FINISH - START) * p);
}

/** Where the finish flag stands: just past the cyclist's last spot. */
export const FLAG = pointOnRoad(FINISH + 0.03);
