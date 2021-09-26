import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { BusinessDay, TimePoint, TimePointIndex, TimeScalePoint } from '../model/time-data';
import { SeriesDataItemTypeMap, Time } from './data-consumer';
export declare function convertTime(time: Time): TimePoint;
export declare function stringToBusinessDay(value: string): BusinessDay;
export interface TimeScaleChanges {
    /**
     * An array of the new time scale points
     */
    points?: readonly TimeScalePoint[];
    /**
     * In terms of time scale "base index" means the latest time scale point with data (there might be whitespaces)
     */
    baseIndex: TimePointIndex | null;
}
export interface SeriesChanges {
    /**
     * Data to be merged into series' plot list
     */
    data: SeriesPlotRow[];
    /**
     * Whether it needs to clear old data before apply data from this change
     */
    fullUpdate: boolean;
}
export interface DataUpdateResponse {
    /**
     * Contains updates for all _changed_ series (if series data doesn't changed then it will not be here)
     */
    series: Map<Series, SeriesChanges>;
    /**
     * Contains optional time scale points
     */
    timeScale: TimeScaleChanges;
}
export declare class DataLayer {
    private _pointDataByTimePoint;
    private _seriesRowsBySeries;
    private _seriesLastTimePoint;
    private _sortedTimePoints;
    destroy(): void;
    setSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType][]): DataUpdateResponse;
    removeSeries(series: Series): DataUpdateResponse;
    updateSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType]): DataUpdateResponse;
    private _updateLastSeriesRow;
    private _setRowsToSeries;
    private _cleanupPointsData;
    /**
     * Sets new time scale and make indexes valid for all series
     *
     * @returns An index of the first changed point
     */
    private _updateTimeScalePoints;
    private _getBaseIndex;
    /**
     * Methods syncs indexes (recalculates them applies them to point/series data) between time scale, point data and series point
     * and returns generated update for applied change.
     */
    private _syncIndexesAndApplyChanges;
}
