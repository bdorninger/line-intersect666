import { Point } from 'chart.js';
import { findData, findMeta, findPoint, initChart } from './chart-util';
import { LineSegment, convertPointFromPx } from './data-point-util';
import { LineIntersectingLimitChecker } from './limit-checker';
import { half, len, lineSegment } from './line-seg-util';
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






