import { PlotRow } from './plot-data';
import { PlotList } from './plot-list';
import { SeriesType } from './series-options';
export interface HistogramPlotRow extends PlotRow {
    readonly color?: string;
}
export interface SeriesPlotRowTypeAtTypeMap {
    Bar: PlotRow;
    Candlestick: PlotRow;
    Area: PlotRow;
    Line: PlotRow;
    Histogram: HistogramPlotRow;
}
export declare type SeriesPlotRow<T extends SeriesType = SeriesType> = SeriesPlotRowTypeAtTypeMap[T];
export declare type SeriesPlotList<T extends SeriesType = SeriesType> = PlotList<SeriesPlotRow<T>>;
export declare function createSeriesPlotList<T extends SeriesType = SeriesType>(): SeriesPlotList<T>;
