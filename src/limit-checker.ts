import { Chart, Point } from 'chart.js';
import {
  isObjectPointArray,
  PointLimits,
  intersectionPoint,
  LineSegment,
} from './data-point-util';
import { half, lineSegment } from './line-seg-util';
import { findData } from './chart-util';


/**
 * Basic args common to all limit checker functions
 */
export interface LimitCheckOptions {
  /**
   * chart The chart object
   */
  chart: Chart;
  /**
   * The index of the dataset the moved point belongs to
   */
  datasetIndex: number;
  /**
   * The index of the changed point within that dataset
   */
  elemIndex: number;

  /**
   * the metadata for the series containing the changed point
   */
  seriesMeta?: {
    upperLimitSeries?: string,
    lowerLimitSeries?:string
  }
}

export interface LimitChecker {
  /**
   * Determines, if a given point p is within its limits
   *
   * @options the basic options (chart, datasetIndex, element index, series metadata)
   * @param p the point which shall be tested against the limits
   */
  isValueWithinLimits(p: Point): LimitCheckResult;
}

export interface LimitCheckResult {
  /**
   * true, if the checker located the position within the x/y limits
   */
  inLimits: boolean;

  /**
   * an optional suggested position where the dragged point should in fact be
   *
   * e.g. relevant when user is doing quick/sloppy drag and drop ops, with drag events being having long distances
   */
  correctedPosition?: Point;
}


/**
 * Service providing methods to find chart point movement constraints
 */
export class LineIntersectingLimitChecker implements LimitChecker {
  private upperLimitSeries?: Point[];
  private lowerLimitSeries?: Point[];

  constructor(private readonly options: LimitCheckOptions) {
    // currently no action
  }

  public reset() {
    this.upperLimitSeries = undefined;
    this.lowerLimitSeries = undefined;
  }

  // TODO: compute the nearest point within limits
  // especially x-index: do not fail move, but constrain x values!!
  //

  public isValueWithinLimits(point: Point): LimitCheckResult {
    const p = { ...point };
    const options = this.options;
    if (this.upperLimitSeries == null || this.lowerLimitSeries == null) {
      this.computeLimitSeries(options);
    }
    const indexLimits = this.findIndexLimits(options);
    if (p.x <= indexLimits.min) {
      p.x = indexLimits.min;
      return {
        inLimits: true,
        correctedPosition: p,
      };
    }
    if (p.x >= indexLimits.max) {
      p.x = indexLimits.max;
      return {
        inLimits: true,
        correctedPosition: p,
      };
    }

    const data = this.options.chart.data.datasets[options.datasetIndex]
      .data as Point[];
    const leftSegment: LineSegment | undefined =
      options.elemIndex > 0
        ? { a: data[options.elemIndex - 1], b: p }
        : undefined;
    const rightSegment: LineSegment | undefined =
      options.elemIndex < data.length - 1
        ? { a: p, b: data[options.elemIndex + 1] }
        : undefined;

    // verbose codelines for debugging....
    const upperLimitsIntersectLeft = this.intersectCurves(
      this.upperLimitSeries!,
      leftSegment,
    );
    const upperLimitsIntersectRight = this.intersectCurves(
      this.upperLimitSeries!,
      rightSegment,
    );
    const lowerLimitIntersectLeft = this.intersectCurves(
      this.lowerLimitSeries!,
      leftSegment,
    );
    const lowerLimitIntersectRight = this.intersectCurves(
      this.lowerLimitSeries!,
      rightSegment,
    );

    const withinLimits = !(
      upperLimitsIntersectLeft ||
      upperLimitsIntersectRight ||
      lowerLimitIntersectLeft ||
      lowerLimitIntersectRight
    );

    return {
      inLimits: withinLimits,
    };
  }

  private intersectCurves(curve: Point[], seg?: LineSegment): boolean {
    return (
      seg != null &&
      curve.length > 0 &&
      curve.some((pt, i, arr) => {
        const limitSeg = { a: pt, b: arr[i + 1] };
        return i < arr.length - 1 && intersectionPoint(seg, limitSeg) != null;
      })
    );
  }

  private computeLimitSeries(options: LimitCheckOptions) {
    // select data for editable curve
    // TODO for editable LIMITS: options.seriesMeta?.isLimit
    // upperLimit: The lowerLimit for an Upper Limit Curve is the same lower limit curve as for the editable series, the upper limit is the y axis max
    // lowerLimit: The upperLimit for an Upper Limit Curve is the same upper limit curve as for the editable series, the lower limit is the y axis min

    const limitIndices = this.findLimitSetIndices(
      options.chart,
      options.seriesMeta,
    );
    const yAxisMax =
      options.chart.getDatasetMeta(options.datasetIndex).vScale?.max ??
      Number.MAX_SAFE_INTEGER;
    const yAxisMin =
      options.chart.getDatasetMeta(options.datasetIndex).vScale?.min ??
      Number.MIN_SAFE_INTEGER;

    const xAxisMax =
      options.chart.getDatasetMeta(options.datasetIndex).iScale?.max ??
      Number.MAX_SAFE_INTEGER;
    const xAxisMin =
      options.chart.getDatasetMeta(options.datasetIndex).iScale?.min ??
      Number.MIN_SAFE_INTEGER;

    let lset =
      options.chart.data.datasets[limitIndices.upperLimitSetIndex]?.data;
    this.upperLimitSeries = isObjectPointArray(lset)
      ? lset
      : [
          { x: xAxisMin, y: yAxisMax },
          { x: xAxisMax, y: yAxisMax },
        ];

    lset = options.chart.data.datasets[limitIndices.lowerLimitSetIndex]?.data;
    this.lowerLimitSeries = isObjectPointArray(lset)
      ? lset
      : [
          { x: xAxisMin, y: yAxisMin },
          { x: xAxisMax, y: yAxisMin },
        ];
  }

  private findIndexLimits(
    options: LimitCheckOptions,
    restrictFirstAndLast = true,
  ): PointLimits {
    const dsetMeta = options.chart.getDatasetMeta(options.datasetIndex);

    const data = options.chart.data.datasets[options.datasetIndex]
      .data as Point[];
    const dsetSize = data.length;
    const curPoint = data[options.elemIndex];

    if (
      restrictFirstAndLast &&
      (options.elemIndex === 0 || options.elemIndex >= dsetSize - 1)
    ) {
      return { min: curPoint.x, max: curPoint.x };
    }

    // TODO: see if we need the actual axis bounds!
    return {
      min:
        data[options.elemIndex - 1]?.x ??
        dsetMeta?.iScale?.min ??
        Number.MIN_SAFE_INTEGER,
      max:
        data[options.elemIndex + 1]?.x ??
        dsetMeta?.iScale?.max ??
        Number.MAX_SAFE_INTEGER,
    };
  }

  /**
   * Finds the limit curve dataset indices for a specified editable series
   * @param chart the chart hosting the curves
   * @param editableSeriesMetadata metadata of the edited dataset, whose limit curves are wanted
   * @returns the indices for the limit curves, -1 if either curve is not present
   */
  private findLimitSetIndices(
    chart: Chart,
    editableSeriesMetadata?: {
      upperLimitSeries?: string,
      lowerLimitSeries?:string
    },
  ) {
    let upper = -1;
    let lower = -1;
    if (editableSeriesMetadata !== undefined) {
      upper = this.findDataSetIndex(
        chart,
        editableSeriesMetadata.upperLimitSeries?.toString(),
      );
      lower = this.findDataSetIndex(
        chart,
        editableSeriesMetadata.lowerLimitSeries?.toString(),
      );
    }
    return {
      upperLimitSetIndex: upper,
      lowerLimitSetIndex: lower,
    };
  }

  /**
   * TODO: move to utils
   * Gets the dataset index for a labelled dataset in the chart
   * @param chart the chart to search the datasets in
   * @param label the label of the dataset
   * @returns the dataset index. -1 if no dataset with this label exists in the specified chart
   */
  private findDataSetIndex(chart: Chart, label?: string): number {
    if (label) {
      return chart.data.datasets.findIndex((dset) => dset.label === label);
    }
    return -1;
  }

  public computeSuggested(startPx: Point, endPx: Point, providedLimitCheckResult: LimitCheckResult) {

  let limitCheckResult = providedLimitCheckResult;
  let lineSegPx = lineSegment(startPx,endPx);
  let done = false;
  let iter = 0;
  let lastDx: number|undefined;
  let lastDy: number|undefined;
  let correctedPosition = providedLimitCheckResult.correctedPosition;

  while(!done) {  
    // debugger;
    iter++;
  
    const halved = half(lineSegPx, limitCheckResult.inLimits ? 'up':'down', lastDx, lastDy);
    lineSegPx = halved.seg;
    lastDx = halved.dx;
    lastDy = halved.dy;
  
    const draglineSeg = this.computeScaleValues(lineSegPx);
    // updateMoved(corrEndpoint);
    correctedPosition = draglineSeg.to;
    limitCheckResult = this.isValueWithinLimits(correctedPosition);

    this.updateVisuals(draglineSeg.from,correctedPosition);        
    console.log(`Corr endpoint:`,correctedPosition, limitCheckResult.inLimits, lastDx, lastDy);
   
    // TODO: berechner Differenz der Längen von letzten inLimit und notInLimit - die muss min sein
    done  = (limitCheckResult.inLimits && Math.abs(lastDx) <=1 && Math.abs(lastDy)<=1) || iter  >= 100; // emergency exit, if we do not converge
    // chart.update();
  }

  console.log(`Done in ${iter} iterations`,lineSegPx, limitCheckResult.inLimits)
  return correctedPosition;
}

  private computeScaleValues(s:LineSegment) {
    const chart = this.options.chart;
    const from = { x: chart.scales['x'].getValueForPixel(s.a.x)?? 0,
     // y: chart.scales['y'].getValueForPixel(chart.scales.y.height + chart.chartArea.top - s.a.y)?? 0}
     y: chart.scales['y'].getValueForPixel(s.a.y)?? 0}
    const to = { x: chart.scales['x'].getValueForPixel(s.b.x) ?? 0, 
      y: chart.scales['y'].getValueForPixel(s.b.y)?? 0}
      // y: chart.scales['y'].getValueForPixel(chart.scales.y.height + chart.chartArea.top - s.b.y)?? 0}
    return {
      from,
      to
    }
  }  

  // DO NOT USE THAT IN CC4
  private updateVisuals(from: Point, to: Point) {    
    // this.options.chart.data.datasets[this.options.datasetIndex].data[this.options.elemIndex] = to;
    this.options.chart.data.datasets[this.options.datasetIndex+1].data[this.options.elemIndex] = to;
    const drl = findData('dragline',this.options.chart as Chart<'line'>);
    drl!.data = [from,to];
    drl!.pointRadius = 5  
    this.options.chart.update();
  }
}




