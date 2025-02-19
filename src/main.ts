import { Point } from 'chart.js';
import { findData, findMeta, findPoint, initChart } from './chart-util';
import { convertPointFromPx, intersectionPoint } from './data-point-util';
import { LineIntersectingLimitChecker } from './limit-checker';
import { len, lineSegment, range } from './line-seg-util';
import './style.css'


const chartCanvas = document.querySelector<HTMLCanvasElement>('#chart-canvas');
const ctx = chartCanvas?.getContext('2d');
/** !.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`
*/
// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
const chart = initChart(ctx!);
//const datasets = chart.data;
const curveSegStart = 2  
const s1 = findPoint('curve',curveSegStart,chart);
const s2 = findPoint('curve',curveSegStart+1,chart); 
const seg = lineSegment(s1,s2)
const limsegStart=5; 
const l1=findPoint('limitUp2',limsegStart,chart);
const l2 = findPoint('limitUp2',limsegStart+1,chart);
const lim = lineSegment(l1,l2)

const pointToProcess: 'start'|'end' = 'end'
const result = range(seg,pointToProcess, "x", lim);

console.log('RESULT',result)


const validProjections = result.projected.filter(seg => intersectionPoint(seg, lim)!=null)

if(isNaN(result.rays[1].d)) {
  console.warn("NAN")
}

const isec = intersectionPoint(result.rays[1],lim);
if(isec!=null) {  
  validProjections.push(result.rays[1]);
} else {
  const X = result.rays[1].b.x;
  const compX = (result.rays[1].b.y - lim.d)/lim.k;
  console.warn(`not isec`,X, compX )

}

console.log('valid',validProjections) 


/* chart.data.datasets.push({ 
  label: "start",
  data: [result.rays[0].a,result.rays[0].b]
})*/

/*chart.data.datasets.push({
  label: "mid",
  data: [result.rays[1].a,result.rays[1].b],
  borderColor: '#000022',
  borderWidth: 2,
  borderDash: [3,3] 
})*/

/*chart.data.datasets.push({
  label: "end",
  data: [result.rays[2].a,result.rays[2].b]
})*/

validProjections.forEach((seg,i) => {
  chart.data.datasets.push({
    label: `projection:${i}`,
    data: [seg.a,seg.b],
    borderColor: i===0 ? '#00CC00' : (i%2===0 ? '#CC0000':'#FF00CC'),
    borderDash: [4,4],
    borderWidth:1
  })  
})

/* chart.data.datasets.push({
  label: "projstart",
  data: [result.projected[0].a,result.projected[0].b], 
  borderColor: '#00CC00',
  borderDash: [4,4]
})*/
/*
chart.data.datasets.push({
  label: "projend",
  data: [result.projected[1].a,result.projected[1].b],
  borderColor: '#00CCcc',
  borderDash: [4,4]
})*/

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

/*
const mov = lineSegment(findPoint('curve',2,chart), findPoint('moved',2,chart))
console.log(mov)

const drl = findData('dragline',chart);
drl!.data = [mov.a, mov.b];
chart.update();

console.log(mov.b,len(mov));

const limitchecker = new LineIntersectingLimitChecker({
  chart: chart,
  datasetIndex: 0,
  elemIndex: 2,
  seriesMeta: {
    upperLimitSeries: 'limitUp',
    lowerLimitSeries: 'limit'
  }
})

// console.log('limit ok',limitchecker.isValueWithinLimits({x: 7, y: 4}))
// console.log('limit mov not ok',limitchecker.isValueWithinLimits(mov.b))

const meta = findMeta('dragline',chart);
const dataset = findData('dragline',chart);

const pxseg = lineSegment(
  {x: meta!.data[0].x, y:meta!.data[0].y}, // y:chart.scales.y.height + chart.chartArea.top - meta!.data[0].y},
  {x: meta!.data[1].x, y: meta!.data[1].y}// y:chart.scales.y.height + chart.chartArea.top - meta!.data[1].y} 
)
const pxstartx = chart.scales.x.getPixelForValue((dataset!.data[0]! as Point).x);
const pxstarty = chart.scales.y.getPixelForValue((dataset!.data[0]! as Point).y) ;


console.log("drag starts", pxseg.a.x, pxseg.a.y, pxstartx,pxstarty )

let lineSegPx = pxseg;

const t=performance.now()
let limitCheckResult = limitchecker.isValueWithinLimits( convertPointFromPx(chart,lineSegPx.b));

const ts=performance.now()
const corr = limitchecker.computeSuggested(pxseg.a, pxseg.b, limitCheckResult);
const te=performance.now()

console.log(`---- CORR POS ----`, corr,ts - t, te-ts)
*/





