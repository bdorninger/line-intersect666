import { Point } from "chart.js";
import { LineSegment } from "./data-point-util";

export function seg(from: Point, to: Point): LineSegment & { k: number, d: number} {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const k = dx === 0 ? Number.POSITIVE_INFINITY : dy/dx ;
    const d = k=== Number.POSITIVE_INFINITY ? 0: to.y - to.x*k

    return {
        a: from,
        b: to,
        k: k,
        d: d
    }
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

export function half(s: LineSegment & { k: number, d: number}, dir: 'up'|'down', lastdx?: number): { seg: LineSegment & { k: number, d: number}, dx: number } {
    console.log(`half: k: ${s.k}, d: ${s.d}`, s.b.x*s.k)
    const dx = lastdx ? lastdx : s.b.x - s.a.x;
    // const dy = s.b.y - s.a.y;
    
    // TODO: special case k is INF, i.e. vertical line of drag
    // iterative: directly manipulate sby!
    // exact: would need limit curve's lin seg that goes thru sbx.

    const newx = s.b.x + (dir==='down' ? (-dx/2):dx/2);
    const nseg = {
        a: s.a,
        b: {
            x: newx,
            y: newx * s.k + s.d 
        }
    } 
    return { seg: seg(nseg.a ,nseg.b), dx: dx/2};
}