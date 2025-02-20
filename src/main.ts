import { Chart, DatasetController } from 'chart.js';
import { findData, findPoint, initChart } from './chart-util';
import { intersectionPoint } from './data-point-util';
import { lineSegment, range } from './line-seg-util';
import './style.css'
import { Observable, Subject, interval, take } from 'rxjs';


const chartCanvas = document.querySelector<HTMLCanvasElement>('#chart-canvas');
const ctx = chartCanvas?.getContext('2d');


const chart = initChart(ctx!);
const cd = findData('curve',chart);
const limit = findData('limitUp2',chart);
const maxCurve = cd!.data.length-1;
const maxLim = limit!.data.length-1;


const dir = 'y';
let obs$=animate(chart,'start',dir);
obs$.subscribe({complete: () => {
  animate(chart,'end',dir).subscribe({
    complete: () => console.log('DONE')
  })
}})


function animate(chart: Chart<'line'>, curvePt:'start'|'end', dim: 'x'|'y', ): Observable<void> {
  const obs$=new Subject<void>();
  interval(2000).pipe(take(maxCurve*maxLim)).forEach(v => {
    console.log(`limInd ${Math.floor(v/maxCurve)}, curvInd: ${v%maxCurve}`, curvePt,dim);
    computeAndVisualizeRanges(chart,Math.floor(v/maxCurve),v%maxCurve,curvePt,dim); 
    // console.log(v)
  }).finally(() => {
    obs$.complete();
  });
  return obs$;
}


/**
 * compute projections
 * @param chart 
 */
function computeAndVisualizeRanges(chart: Chart<'line'>, limsegStart=0, curveSegStart=0, pointOfCurveSeg:'start'|'end'='start', dimension: 'x'|'y'='x') {

const s1 = findPoint('curve',curveSegStart,chart);
const s2 = findPoint('curve',curveSegStart+1,chart); 
const seg = lineSegment(s1,s2) 

const l1= findPoint('limitUp2',limsegStart,chart);
const l2 = findPoint('limitUp2',limsegStart+1,chart);
const lim = lineSegment(l1,l2)

const pointToProcess = pointOfCurveSeg;
const result = range(seg,pointToProcess, dimension, lim);

console.log('RESULT',result)

const validProjections = result.projected.filter(seg => intersectionPoint(seg, lim)!=null)

console.log('valid',validProjections) 

const movingPoint = pointToProcess === 'start' ? seg.a : seg.b;
const diff = validProjections.map(lseg => {
  let endPt = dimension === 'x' ? lseg.b.x : lseg.b.y;
  let startPt = dimension === 'x' ? movingPoint.x: movingPoint.y  
  return {
    dist: Math.abs(endPt - startPt),
    point: lseg.b
  } 
}).sort((a,b) => a.dist-b.dist );

console.log('sorted',diff)

//
// ------------- VIS -----------------
//
chart.data.datasets=chart.data.datasets.filter(ds => !ds.label?.startsWith('projection'));

validProjections.forEach((seg,i) => {
  chart.data.datasets.push({ 
    label: `projection:${i}`,
    data: [seg.a,seg.b],
    borderColor: i===0 ? '#00CC00' : (i%2===0 ? '#CC0000':'#FF00CC'),
    borderDash: [4,4],
    borderWidth:1
  })  
})

chart.setActiveElements([{  
  datasetIndex: 0,
  index: pointToProcess ==='start' as any ? curveSegStart : curveSegStart+1
},{
  datasetIndex:2,
  index: limsegStart
},{
  datasetIndex:2,
  index: limsegStart+1
}])
chart.update();
}
