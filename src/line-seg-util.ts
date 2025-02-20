import { Point } from "chart.js";
import { LineSegment, LinearFunc } from "./data-point-util";

/**
 * Constructs a line segment from two points
 * @param from the starting point
 * @param to the end point
 * @returns the segment
 */
export function lineSegment(from: Point, to: Point): LineSegment & LinearFunc {
    return linear({ a: from, b: to });
  }
  

export function len(s: LineSegment): number {
    const dx = Math.abs(s.b.x - s.a.x);
    const dy = Math.abs(s.b.y - s.b.y);
    if(dx === 0) {
        return dy
    } else if (dy === 0) {
        return dx
    } else {
        return  Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
    }
}

export function half(s: LineSegment & { k: number, d: number}, dir: 'up'|'down', lastdx?: number, lastdy?:number): { seg: LineSegment & { k: number, d: number}, dx: number, dy: number } {
    // console.log(`half: k: ${s.k}, d: ${s.d}`, s.b.x*s.k)
    let dx = lastdx ?? (s.b.x - s.a.x);
    let dy = lastdy ?? (s.b.y - s.a.y);    /// y computed by applying k and d except if we have a vert line   
    

    const newx = !Number.isFinite(s.k) ? s.b.x : s.b.x + (dir==='down' ? (-dx/2):dx/2);
    const newy = !Number.isFinite(s.k) ? s.b.y + (dir==='down' ? (-dy/2):(dy/2)) : newx * s.k + s.d;
    const nseg = {
        a: s.a,
        b: {
            x: newx,
            y: newy
        }
    } 
    return { seg: lineSegment(nseg.a ,nseg.b), dx: dx/2, dy: dy/2};
}


/**
 * Computes the linear function properties k and d from a specified line segment
 * @param s the line segment, will be sorted by x coordinates!!
 * @param sortX when true, sorts the points by x coordinates. default true.
 * @returns the possibly modified segment plus the computed values for k and d
 */
export function linear(s: LineSegment, sortX = false): LinearFunc & LineSegment {    
    if (s.a.x > s.b.x && sortX) {
        console.log("lin",s.a,s.b);
      s = {
        a: s.b,
        b: s.a,
      };
    }
    const k = (s.b.y - s.a.y) / (s.b.x - s.a.x);
    const d = k == 0 ? s.a.y : s.a.y - k * s.a.x; // k=Inf > d=NaN
    return {
      k: k,
      d: d,
      ...s,
    };
  }
  
  /**
   * Computes the perpendicular distance of a point to a line
   * @param s the line segment
   * @param p the point
   * @returns the distance of p to s. negative, if p is "left" of line other wise positive
   */
  export function dist(s: LineSegment, p: Point): number {
    const lf = linear(s);
    let dist = 0;
    if (!Number.isFinite(lf.k)) {
      dist = p.x - s.a.x;
    } else if (lf.k === 0) {
      dist = p.y - s.a.y;
    } else {
      const fpy = lf.k * p.x + lf.d;
      const fpx = (p.y - lf.d) / lf.k;
      const ly = p.y - fpy;
      const lx = p.x - fpx;
      const sign = lx < 0 && ly < 0 ? -1 : 1;
      const hc = Math.sqrt(1 / (1 / Math.pow(lx, 2) + 1 / Math.pow(ly, 2)));
      dist = hc * sign;
    }
    return dist;
  }
  
  /**
   * Compute range of movement of a line's point against a specifed limit line. 
   * line and limit MUST not intersect from the beginning!   
   */
  export function range(
    line: LineSegment,
    point: 'start' | 'end',
    direction: 'x' | 'y',
    limit: LineSegment,
  ) {
    // create line segments
    const movingPoint = point === 'start' ? line.a : line.b;
    const stationaryPoint = point === 'start' ? line.b : line.a;
  
    const lim = linear(limit, false);   
    
    const distStatPt = dist(lim, stationaryPoint);
    const distMovPt = dist(lim, movingPoint);
  
    // create rays
    const rayStart = lineSegment(stationaryPoint, lim.a);
    const rayEnd = lineSegment(stationaryPoint, lim.b);    
  
    // create projections, where would the moved point end up?
    let projStart:Point;
    let projEnd: Point;
    let projMove: Point;
    if (direction === 'x') {
      projStart = {
        x: computeProjectedPointX(rayStart, movingPoint),
        y: movingPoint.y
      }
      projEnd = {
        x: computeProjectedPointX(rayEnd, movingPoint),
        y: movingPoint.y
      }
      projMove = {        
        x: computeProjectedPointX(lim, movingPoint),
        y: movingPoint.y,        
      }
    } else {      
      projStart = {
        x: movingPoint.x,
        y: computeProjectedPointY(rayStart, movingPoint)
      }
      projEnd = {
        x: movingPoint.x,
        y: computeProjectedPointY(rayEnd, movingPoint)
      }
      projMove = {
        x: movingPoint.x,
        y: computeProjectedPointY(lim, movingPoint)
      }
    }
  
    return { 
      rays: [rayStart, rayEnd],
      projected: [lineSegment(stationaryPoint,projStart), lineSegment(stationaryPoint,projMove),lineSegment(stationaryPoint,projEnd)],
      distStat: distStatPt,
      distMoved: distMovPt
      };
  }
  
  function computeProjectedPointY(
    line: LineSegment & LinearFunc,
    p: Point,
  ): number {
    let y: number;
  
    if (!Number.isFinite(line.k)) {
      y = line.a.y === p.y ? p.y : NaN;
    } else if (line.k === 0) {
      y = line.a.y;
    } else {
      y = line.k * p.x + line.d;
    }
    return y;
  } 
  
  function computeProjectedPointX(
    line: LineSegment & LinearFunc,
    p: Point,
  ): number {
    let x: number;
    if (!Number.isFinite(line.k)) {      
      x = line.a.x;
    } else if (line.k === 0) {
      x = line.a.x === p.x ? p.x : NaN;
    } else {
      x = (p.y - line.d) / line.k;
    }
    return x;
  }
  