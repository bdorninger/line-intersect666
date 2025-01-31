import { findData, findMeta, findPoint, initChart } from './chart-util';
import { LineSegment } from './data-point-util';
import { LineIntersectingLimitChecker } from './limit-checker';
import { half, len, seg } from './line-seg-util';
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
const mov = seg(findPoint('curve',2,chart), findPoint('moved',2,chart))
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
    lowerLimitSeries: 'limit'
  }
})

console.log('limit ok',limitchecker.isValueWithinLimits({x: 7, y: 4}))
console.log('limit mov not ok',limitchecker.isValueWithinLimits(mov.b))

const meta = findMeta('dragline',chart);

const pxseg = seg(
  {x: meta!.data[0].x, y:chart.scales.y.height + chart.chartArea.top - meta!.data[0].y},
  {x: meta!.data[1].x, y:chart.scales.y.height + chart.chartArea.top - meta!.data[1].y} 
)

let pxseglen = len(pxseg);

console.log('XXXX',chart,meta, pxseg,pxseglen);

console.log('lines',meta!.data[1].y, pxseg.b.y, chart.scales.y.height)

let s = pxseg;
let l = len(s);
let done = pxseglen <= 1; // || limitchecker.isValueWithinLimits() ;
let iter = 0;
while(!done) {
  
  debugger;
  

  iter++;
  // console.log('ss',s,l)
  s = half(s,'down');
  l = len(s);

  updateDrag(s)
  
  done  = len(s) <=1 || iter  >=100;

}

console.log(`Done in ${iter} iterations`,s, l)


function updateDrag(s: LineSegment ) {
  const drl = findData('dragline',chart);
  const from = { x: chart.scales['x'].getValueForPixel(s.a.x)?? 0, y: chart.scales['y'].getValueForPixel(chart.scales.y.height + chart.chartArea.top - s.a.y)?? 0}
  const to = { x: chart.scales['x'].getValueForPixel(s.b.x) ?? 0, y: chart.scales['y'].getValueForPixel(chart.scales.y.height + chart.chartArea.top - s.b.y)?? 0}
  // console.log("data",from,to)
  drl!.data = [from,to];
  drl!.pointRadius = 5
  chart.update();

}

