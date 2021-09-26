import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial } from '../helpers/strict-type-checks';
import { BarPrice, BarPrices } from '../model/bar';
import { ChartModel, ChartOptionsInternal } from '../model/chart-model';
import { InvalidateMask } from '../model/invalidate-mask';
import { Point } from '../model/point';
import { PriceAxisPosition } from '../model/price-scale';
import { Series } from '../model/series';
import { TimePoint } from '../model/time-data';
import { PaneWidget } from './pane-widget';
export interface MouseEventParamsImpl {
    time?: TimePoint;
    point?: Point;
    seriesPrices: Map<Series, BarPrice | BarPrices>;
    hoveredSeries?: Series;
    hoveredObject?: string;
}
export declare type MouseEventParamsImplSupplier = () => MouseEventParamsImpl;
export declare class ChartWidget implements IDestroyable {
    private readonly _options;
    private _paneWidgets;
    private readonly _model;
    private _drawRafId;
    private _height;
    private _width;
    private _leftPriceAxisWidth;
    private _rightPriceAxisWidth;
    private _element;
    private readonly _tableElement;
    private _timeAxisWidget;
    private _invalidateMask;
    private _drawPlanned;
    private _clicked;
    private _crosshairMoved;
    private _onWheelBound;
    constructor(container: HTMLElement, options: ChartOptionsInternal);
    model(): ChartModel;
    options(): Readonly<ChartOptionsInternal>;
    paneWidgets(): PaneWidget[];
    destroy(): void;
    resize(width: number, height: number, forceRepaint?: boolean): void;
    paint(invalidateMask?: InvalidateMask): void;
    applyOptions(options: DeepPartial<ChartOptionsInternal>): void;
    clicked(): ISubscription<MouseEventParamsImplSupplier>;
    crosshairMoved(): ISubscription<MouseEventParamsImplSupplier>;
    takeScreenshot(): HTMLCanvasElement;
    getPriceAxisWidth(position: PriceAxisPosition): number;
    private _adjustSizeImpl;
    private _onMousewheel;
    private _drawImpl;
    private _applyTimeScaleInvalidation;
    private _invalidateHandler;
    private _updateGui;
    private _syncGuiWithModel;
    private _getMouseEventParamsImpl;
    private _onPaneWidgetClicked;
    private _onPaneWidgetCrosshairMoved;
    private _updateTimeAxisVisibility;
    private _isLeftAxisVisible;
    private _isRightAxisVisible;
}
