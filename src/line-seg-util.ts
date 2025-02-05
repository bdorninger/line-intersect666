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

export function half(s: LineSegment & { k: number, d: number}, dir: 'up'|'down', lastdx?: number, lastdy?:number): { seg: LineSegment & { k: number, d: number}, dx: number, dy: number } {
    // console.log(`half: k: ${s.k}, d: ${s.d}`, s.b.x*s.k)
    let dx = lastdx ?? (s.b.x - s.a.x);
    let dy = lastdy ?? (s.b.y - s.a.y);    /// y computed by applying k and d except if we have a vert line   
    

    const newx = s.k===Number.POSITIVE_INFINITY ? s.b.x : s.b.x + (dir==='down' ? (-dx/2):dx/2);
    const newy = s.k===Number.POSITIVE_INFINITY ? s.b.y + (dir==='down' ? (-dy/2):(dy/2)) : newx * s.k + s.d;
    const nseg = {
        a: s.a,
        b: {
            x: newx,
            y: newy
        }
    } 
    return { seg: seg(nseg.a ,nseg.b), dx: dx/2, dy: dy/2};
}