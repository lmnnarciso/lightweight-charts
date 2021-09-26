import { PlotRow, PlotRowValueIndex } from '../model/plot-data';
import { TimePointIndex } from '../model/time-data';
export declare const enum PlotRowSearchMode {
    NearestLeft = -1,
    Exact = 0,
    NearestRight = 1
}
export interface MinMax {
    min: number;
    max: number;
}
/**
 * PlotList is an array of plot rows
 * each plot row consists of key (index in timescale) and plot value map
 */
export declare class PlotList<PlotRowType extends PlotRow = PlotRow> {
    private _items;
    private _minMaxCache;
    private _rowSearchCache;
    clear(): void;
    last(): PlotRowType | null;
    firstIndex(): TimePointIndex | null;
    lastIndex(): TimePointIndex | null;
    size(): number;
    isEmpty(): boolean;
    contains(index: TimePointIndex): boolean;
    valueAt(index: TimePointIndex): PlotRowType | null;
    search(index: TimePointIndex, searchMode?: PlotRowSearchMode): PlotRowType | null;
    rows(): readonly PlotRowType[];
    minMaxOnRangeCached(start: TimePointIndex, end: TimePointIndex, plots: readonly PlotRowValueIndex[]): MinMax | null;
    merge(plotRows: readonly PlotRowType[]): void;
    private _indexAt;
    private _valueAt;
    private _search;
    private _searchNearestLeft;
    private _searchNearestRight;
    private _bsearch;
    private _lowerbound;
    private _upperbound;
    /**
     * @param endIndex - Non-inclusive end
     */
    private _plotMinMax;
    private _invalidateCacheForRow;
    private _prepend;
    private _append;
    private _updateLast;
    private _merge;
    private _minMaxOnRangeCachedImpl;
}
/**
 * Merges two ordered plot row arrays and returns result (ordered plot row array).
 *
 * BEWARE: If row indexes from plot rows are equal, the new plot row is used.
 *
 * NOTE: Time and memory complexity are O(N+M).
 */
export declare function mergePlotRows<PlotRowType extends PlotRow>(originalPlotRows: readonly PlotRowType[], newPlotRows: readonly PlotRowType[]): PlotRowType[];
