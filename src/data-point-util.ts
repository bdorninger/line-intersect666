// the two-char eq (==) / ineq (!=) ops in this file are for a purpose!!
import { Chart, Point } from 'chart.js';

export interface PointLimits {
  min: number;
  max: number;
}

export interface LineSegment {
  a: Point;
  b: Point;
}

export interface LinearFunc {
  k: number;
  d: number;
}

export function convertPointFromPx(chart: Chart, ppx: Point) : Point {
  return { x: chart.scales['x'].getValueForPixel(ppx.x) ?? 0, 
           y: chart.scales['y'].getValueForPixel(ppx.y)?? 0
          }
  // y: chart.scales['y'].getValueForPixel(chart.scales.y.height + chart.chartArea.top - ppx.y)?? 0};
}

/**
 * Transforms a data point applying the spcified transformations
 * @param data the data point
 * @param xTransformation unit transformation for the x dimension
 * @param yTransformation unit transformation for the y dimension
 * @returns the transformed data point
 */
/* export function transformData(
  data: Point[],
  xTransformation?: UnitTransformation,
  yTransformation?: UnitTransformation,
): Point[] {
  return data.map((p) => ({
    x: xTransformation ? xTransformation.apply(p.x) : p.x,
    y: yTransformation ? yTransformation.apply(p.y) : p.y,
  }));
}*/

/**
 * Tests if a specified object is a data point (having x and y coordinate properties)
 * @param p The object to test
 * @returns true, if the object is a data point
 */
export function isObjectDataPoint(p: unknown): p is Point {
  if (p != null) {
    const scdp = p as Point;
    return typeof scdp.x === 'number' && typeof scdp.y === 'number';
  }
  return false;
}

/**
 * Tests, if a specified array is a valid object point array.
 * @param arr the array to test
 * @param allowNulls if true, null values are allowed in the array
 * @returns true, if the array consists of Point objects
 */
export function isObjectPointArray(
  arr: unknown,
  allowNulls = false,
): arr is Point[] {
  if (Array.isArray(arr)) {
    return arr.every(
      (p) => (p !== null && isObjectDataPoint(p)) || (p === null && allowNulls),
    );
  }
  return false;
}

/**
 * Performs a Math binary op only if both values are truthy
 * @param a the first argument for the math function
 * @param b  the second value of the math function
 * @param fn the math function to perform
 * @returns The outcome of calling fn(a,b) if both are truthy. If either value is truthy, it returns that value. it returns undefined if both values a re falsy
 */
export function safeMathBinaryOp(
  a: number | null | undefined,
  b: number | null | undefined,
  fn: (a: number, b: number) => number,
): number | undefined {
  let ret: number | undefined;
  if (a != null && b == null) {
    ret = a;
  } else if (a == null && b != null) {
    ret = b;
  } else if (a != null && b != null) {
    ret = fn(a, b);
  }
  return ret;
}

/**
 * Computes the min and max values in a specified number array considering the value on a specified index.
 *
 * If the argument idx is in range of 0 to the array' length, min is the closest value in the array below the value at that index. max is the closest value above that index
 *
 * If idx is -1, this function just returns the min max values of all values in the array
 *
 * @param arr the array to search in
 * @param idx the index where to look up the min max values
 * @param minDefault a default for the min value (used e.g when the array is empty)
 * @param maxDefault a default for the max value (used e.g when the array is empty)
 * @returns an array of two values, min being at index 0, max being at index 1
 */
export function minmax(
  arr: number[],
  idx: number,
  minDefault: number,
  maxDefault: number,
) {
  if (idx < -1 || idx >= arr.length) {
    throw new Error(`illegal index ${idx}`);
  }

  if (arr.length === 0) {
    return [minDefault, maxDefault];
  }

  const sorted = [...arr].sort((r, s) => r - s);
  const p = arr[idx];
  const p0 = arr[idx - 1];
  const p1 = arr[idx + 1];

  if (idx === -1) {
    return [sorted[0], sorted[sorted.length - 1]];
  }

  const ret: number[] = [];
  if (p0 !== undefined) {
    ret.push(p0);
  }
  if (p1 !== undefined) {
    ret.push(p1);
  }

  if (p0 === undefined && p1 !== undefined) {
    if (p === sorted[0]) {
      ret.push(minDefault);
    } else {
      ret.push(maxDefault);
    }
  } else if (p1 === undefined && p0 !== undefined) {
    if (p === sorted[0]) {
      ret.push(minDefault);
    } else {
      ret.push(maxDefault);
    }
  }
  return ret.sort((r, s) => r - s);
}

export function makeFakeDataPoints(max = 4): Point[] {
  const arr: Point[] = [];
  for (let i = 0; i < max; i++) {
    arr.push(
      ({ x: i + 0.5, y: (i + 0.5) * 1.5 + 2 }),
    );
  }
  return arr;
}

type LRange = [number, number];

// helper function iv two line segments overlap
export function isOverlapping(r1: LRange, r2: LRange, skip = false): boolean {
  r1.sort();
  r2.sort();
  const inside1 = r1[0] >= r2[0] && r1[0] <= r2[1];
  const inside2 = r1[1] >= r2[0] && r1[1] <= r2[1];
  return inside1 || inside2 || (!skip && isOverlapping(r2, r1, true));
}

// boolean xor helper
function xor(a: boolean, b: boolean) {
  return (a || b) && !(a && b);
}

// default precision for line intersection computation
const PRECISION = 7;

function toPrec(n: number, precision: number): number {
  return precision >=0 ? Number(n.toFixed(precision)):n;
}

function toPrecPt(p: Point, precision: number): Point {
  return {
    x: toPrec(p.x,precision),
    y: toPrec(p.y,precision)
  }
}

/**
 * compute intersection point of two given line segments
 */
// eslint-disable-next-line complexity
export function intersectionPoint(
  l1: LineSegment & Partial<LinearFunc>,
  l2: LineSegment & Partial<LinearFunc>,
  precision = PRECISION,
): (Point & { meta?: string }) | undefined {
  const p1 = toPrecPt(l1.a,precision)// l1.a.x <= l1.b.x ? l1.a : l1.b;
  const p2 = toPrecPt(l1.b,precision)//l1.a.x <= l1.b.x ? l1.b : l1.a;
  const p3 = toPrecPt(l2.a,precision)//l2.a.x <= l2.b.x ? l2.a : l2.b;
  const p4 = toPrecPt(l2.b,precision)//l2.a.x <= l2.b.x ? l2.b : l2.a;

  // compute slopes
  const m1 = l1.k!=null ? l1.k:(p2.y - p1.y) / (p2.x - p1.x);
  const m2 = l2.k!=null ? l2.k: (p4.y - p3.y) / (p4.x - p3.x);
 

  const parallel = m1 === m2;

  // y-Achsenabschnitte berechnen
  const d1 = l1.d!=null ? l1.d : p1.y - m1 * p1.x;
  const d2 = l2.d!=null ? l2.d : p3.y - m2 * p3.x;
  const coincident =
    parallel &&
    ((Number.isFinite(m1) && d1 === d2) ||
      (m1 === Infinity &&
        p1.x === p3.x &&
        isOverlapping([p1.y, p2.y], [p3.y, p4.y])));

  if (parallel && !coincident) {
    return undefined;
  }

  // compute x value of intersection
  // parallel, but not congruent
  // - overlaping and both m === infinity: x = p1.x
  // - !overlapping and both m === infinity: do not compute x and y --> parallel
  // - either m === infinity: x can only be the x of the vertical line
  //                          y then is computed with the other lines m and d
  let x: number;
  if (xor(!Number.isFinite(m1), !Number.isFinite(m2))) {
    x = m1 === Infinity ? p1.x : p3.x;
    
  } else {
    x = (d2 - d1) / (m1 - m2);
  }

  // compute y of intersection
  let y = (Number.isFinite(m1) ? m1 : m2) * x + (Number.isFinite(m1) ? d1 : d2);

  x = precision > 0 ? Number(x.toFixed(precision)):x;
  y = precision >0 ? Number(y.toFixed(precision)):y;

  // is the computed point on both line segs?
  if (coincident) {
    return { x: p1.x, y: p1.y, meta: 'coincident' };
  } else if (
    x >= Math.min(p1.x, p2.x) &&
    x <= Math.max(p1.x, p2.x) &&
    x >= Math.min(p3.x, p4.x) &&
    x <= Math.max(p3.x, p4.x) &&
    y >= Math.min(p1.y, p2.y) &&
    y <= Math.max(p1.y, p2.y) &&
    y >= Math.min(p3.y, p4.y) &&
    y <= Math.max(p3.y, p4.y)
  ) {
    return { x, y };
  } else {
    return undefined;
  }
}

// --> num Utils
export function compareWithPrecision(a: number, b: number, precision: number) {
  return Math.abs(a - b) < precision;
}
