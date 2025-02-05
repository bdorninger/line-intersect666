import Chart, { ChartDataset, Point } from 'chart.js/auto';

export let curve =  {
    label: "curve",
    data: [{x: 1, y: 2}, {x: 3.5, y: 7}, {x: 5, y: 7},{x: 8, y: 6},{x: 10, y: 14.5}]
  }

export let limit: ChartDataset<'line'> = {
    label: "limit",
    data: [{x: 1, y: 1},{x:4,y:6.5},{x:4.7,y:2}, {x: 10, y: 6}],
    pointBorderWidth:0,
    pointRadius: 0
  }

  export let limitUp: ChartDataset<'line'> = {
    label: "limitUp",
    data: [{x: 1, y: 12},{x:5,y:14},{x:5,y:18}, {x: 10, y: 16}],
    pointBorderWidth:0,
    pointRadius: 0
  }

  export let intersecting: ChartDataset<'line'> =  {
    label: "moved",
    data: [{x: 1, y: 2}, {x: 3.5, y: 7}, {x:  7.8, y: 0},{x: 8, y: 6},{x: 10, y: 14.5}], 
    borderWidth:2,
    borderDash: [3,3]
  }

export let dragline: ChartDataset<'line'> = {
    label: "dragline",
    data: [],
    borderWidth:4,
    borderDash: [3,3],
    pointRadius: 0
}



export function initChart(ctx: CanvasRenderingContext2D): Chart<'line'> {
    const chart = new Chart<'line'>(ctx, {
        type: 'line',
        /*plugins: {        
            title: {
              display: true,
              text: 'Min and Max Settings'
            } as any
          },*/
        data: {
          datasets: [
          curve,intersecting,limit,limitUp,dragline
        ],
        },
        // plugins: plugins,
        options: {
          responsive: true, // is default true anyway
          events: ['mousemove', 'mouseout', 'click', 'touchstart'],
          maintainAspectRatio: true,
          interaction: {
            mode: 'point',
            intersect: false,
          },
          //
          scales: {
            x: {
                type: 'linear',
                min: 0,
                max: 10,
              },
            y: {
              type: 'linear',
              min: 0,
              max: 20,
            }
          },
          // onClick: this.onChartClicked.bind(this),
          animation: false,
          plugins: {
            legend: {
              display: false,
              position: 'bottom',
              labels: {
                usePointStyle: true,
                //generateLabels: ,
              },
            },
            tooltip: {
              enabled: false
              
            },
          } 
        },
      });
      return chart;
}

export function findData(name: string, chart: Chart<'line'>) {
    return chart.data.datasets.find(ds => ds.label === name);
}

export function findMeta(name: string, chart: Chart<'line'>) {
    const idx = chart.data.datasets.findIndex(ds => ds.label === name);
    if(idx>=0) {
        return chart.getDatasetMeta(idx)
    }
    return undefined
    
}

export function findPoint(name: string, index: number, chart: Chart<'line'>): Point {    
    const ds = chart.data.datasets.find(ds => ds.label === name);
    return ds?.data[index] as Point ?? { x: 0, y:0};
}