import { IPriceFormatter } from '../formatters/iprice-formatter';
import { IDestroyable } from '../helpers/idestroyable';
import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { BarPrice, BarPrices } from './bar';
import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { CustomPriceLine } from './custom-price-line';
import { FirstValue } from './iprice-data-source';
import { Pane } from './pane';
import { PriceDataSource } from './price-data-source';
import { PriceLineOptions } from './price-line-options';
import { PriceScale } from './price-scale';
import { SeriesBarColorer } from './series-bar-colorer';
import { SeriesPlotList, SeriesPlotRow } from './series-data';
import { InternalSeriesMarker, SeriesMarker } from './series-markers';
import { SeriesOptionsMap, SeriesPartialOptionsMap, SeriesType } from './series-options';
import { TimePoint, TimePointIndex } from './time-data';
export interface LastValueDataResult {
    noData: boolean;
}
export interface LastValueDataResultWithoutData extends LastValueDataResult {
    noData: true;
}
export interface LastValueDataResultWithData extends LastValueDataResult {
    noData: false;
    text: string;
    formattedPriceAbsolute: string;
    formattedPricePercentage: string;
    color: string;
    coordinate: Coordinate;
    index: TimePointIndex;
}
export interface LastValueDataResultWithRawPrice extends LastValueDataResultWithData {
    price: number;
}
export declare type LastValueDataResultWithoutRawPrice = LastValueDataResultWithoutData | LastValueDataResultWithData;
export interface MarkerData {
    price: BarPrice;
    radius: number;
    borderColor: string | null;
    backgroundColor: string;
}
export interface SeriesDataAtTypeMap {
    Bar: BarPrices;
    Candlestick: BarPrices;
    Area: BarPrice;
    Line: BarPrice;
    Histogram: BarPrice;
}
export declare type SeriesOptionsInternal<T extends SeriesType = SeriesType> = SeriesOptionsMap[T];
export declare type SeriesPartialOptionsInternal<T extends SeriesType = SeriesType> = SeriesPartialOptionsMap[T];
export declare class Series<T extends SeriesType = SeriesType> extends PriceDataSource implements IDestroyable {
    private readonly _seriesType;
    private _data;
    private readonly _priceAxisViews;
    private readonly _panePriceAxisView;
    private _formatter;
    private readonly _priceLineView;
    private readonly _customPriceLines;
    private readonly _baseHorizontalLineView;
    private _paneView;
    private readonly _lastPriceAnimationPaneView;
    private _barColorerCache;
    private readonly _options;
    private _markers;
    private _indexedMarkers;
    private _markersPaneView;
    private _animationTimeoutId;
    constructor(model: ChartModel, options: SeriesOptionsInternal<T>, seriesType: T);
    destroy(): void;
    priceLineColor(lastBarColor: string): string;
    lastValueData(globalLast: boolean, withRawPrice?: false): LastValueDataResultWithoutRawPrice;
    lastValueData(globalLast: boolean, withRawPrice: true): LastValueDataResultWithRawPrice;
    barColorer(): SeriesBarColorer;
    options(): Readonly<SeriesOptionsMap[T]>;
    applyOptions(options: SeriesPartialOptionsInternal<T>): void;
    clearData(): void;
    updateData(data: readonly SeriesPlotRow<T>[], clearData: boolean): void;
    setMarkers(data: SeriesMarker<TimePoint>[]): void;
    indexedMarkers(): InternalSeriesMarker<TimePointIndex>[];
    createPriceLine(options: PriceLineOptions): CustomPriceLine;
    removePriceLine(line: CustomPriceLine): void;
    seriesType(): T;
    firstValue(): FirstValue | null;
    firstBar(): SeriesPlotRow<T> | null;
    bars(): SeriesPlotList<T>;
    dataAt(time: TimePointIndex): SeriesDataAtTypeMap[SeriesType] | null;
    topPaneViews(pane: Pane): readonly IPaneView[];
    paneViews(): readonly IPaneView[];
    priceAxisViews(pane: Pane, priceScale: PriceScale): readonly IPriceAxisView[];
    autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;
    minMove(): number;
    formatter(): IPriceFormatter;
    updateAllViews(): void;
    priceScale(): PriceScale;
    markerDataAtIndex(index: TimePointIndex): MarkerData | null;
    title(): string;
    visible(): boolean;
    private _isOverlay;
    private _autoscaleInfoImpl;
    private _markerRadius;
    private _markerBorderColor;
    private _markerBackgroundColor;
    private _recreateFormatter;
    private _recalculateMarkers;
    private _recreatePaneViews;
}
