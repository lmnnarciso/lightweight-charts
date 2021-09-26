import { Series } from '../model/series';
import { SeriesType } from '../model/series-options';
import { BusinessDay, UTCTimestamp } from '../model/time-data';
export declare type Time = UTCTimestamp | BusinessDay | string;
export declare function isBusinessDay(time: Time): time is BusinessDay;
export declare function isUTCTimestamp(time: Time): time is UTCTimestamp;
/**
 * Structure describing whitespace data item (data point without series' data)
 */
export interface WhitespaceData {
    time: Time;
}
/**
 * Structure describing single data item for series of type Line or Area
 */
export interface LineData {
    time: Time;
    /**
     * Price value of data item
     */
    value: number;
}
/**
 * Structure describing a single item of data for histogram series
 */
export interface HistogramData extends LineData {
    /**
     * Optional color value for certain data item. If missed, color from HistogramSeriesOptions is used
     */
    color?: string;
}
export interface BarData {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
}
export declare function isWhitespaceData(data: SeriesDataItemTypeMap[SeriesType]): data is WhitespaceData;
export declare function isFulfilledData(data: SeriesDataItemTypeMap[SeriesType]): data is (BarData | LineData | HistogramData);
export interface SeriesDataItemTypeMap {
    Bar: BarData | WhitespaceData;
    Candlestick: BarData | WhitespaceData;
    Area: LineData | WhitespaceData;
    Line: LineData | WhitespaceData;
    Histogram: HistogramData | WhitespaceData;
}
export interface DataUpdatesConsumer<TSeriesType extends SeriesType> {
    applyNewData(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType][]): void;
    updateData(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType]): void;
}
