import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { InvalidationLevel } from '../model/invalidate-mask';
import { IPriceDataSource } from '../model/iprice-data-source';
import { Pane } from '../model/pane';
import { Point } from '../model/point';
import { TimePointIndex } from '../model/time-data';
import { IPaneView } from '../views/pane/ipane-view';
import { Size } from './canvas-utils';
import { ChartWidget } from './chart-widget';
import { Position, TouchMouseEvent, TouchMouseEventLocal } from './mouse-event-handler';
import { PriceAxisWidget, PriceAxisWidgetSide } from './price-axis-widget';
export interface HitTestResult {
    source: IPriceDataSource;
    object?: HoveredObject;
    view: IPaneView;
}
export declare class PaneWidget implements IDestroyable {
    private readonly _chart;
    private _state;
    private _size;
    private _leftPriceAxisWidget;
    private _rightPriceAxisWidget;
    private readonly _paneCell;
    private readonly _leftAxisCell;
    private readonly _rightAxisCell;
    private readonly _canvasBinding;
    private readonly _topCanvasBinding;
    private readonly _rowElement;
    private readonly _mouseEventHandler;
    private _startScrollingPos;
    private _isScrolling;
    private _clicked;
    private _prevPinchScale;
    private _longTap;
    private _startTrackPoint;
    private _exitTrackingModeOnNextTry;
    private _initCrosshairPosition;
    private _scrollXAnimation;
    constructor(chart: ChartWidget, state: Pane);
    destroy(): void;
    state(): Pane;
    setState(pane: Pane | null): void;
    chart(): ChartWidget;
    getElement(): HTMLElement;
    updatePriceAxisWidgets(): void;
    stretchFactor(): number;
    setStretchFactor(stretchFactor: number): void;
    mouseEnterEvent(event: TouchMouseEvent): void;
    mouseDownEvent(event: TouchMouseEvent): void;
    mouseMoveEvent(event: TouchMouseEventLocal): void;
    mouseClickEvent(event: TouchMouseEvent): void;
    pressedMouseMoveEvent(event: TouchMouseEvent): void;
    mouseUpEvent(event: TouchMouseEvent): void;
    longTapEvent(event: TouchMouseEvent): void;
    mouseLeaveEvent(event: TouchMouseEvent): void;
    clicked(): ISubscription<TimePointIndex | null, Point>;
    pinchStartEvent(): void;
    pinchEvent(middlePoint: Position, scale: number): void;
    hitTest(x: Coordinate | number, y: Coordinate | number): HitTestResult | null;
    setPriceAxisSize(width: number, position: PriceAxisWidgetSide): void;
    getSize(): Size;
    setSize(size: Size): void;
    recalculatePriceScales(): void;
    getImage(): HTMLCanvasElement;
    paint(type: InvalidationLevel): void;
    leftPriceAxisWidget(): PriceAxisWidget | null;
    rightPriceAxisWidget(): PriceAxisWidget | null;
    private _onStateDestroyed;
    private _drawBackground;
    private _drawGrid;
    private _drawWatermark;
    private _drawCrosshair;
    private _drawSources;
    private _drawSourceImpl;
    private _hitTestPaneView;
    private _recreatePriceAxisWidgets;
    private _preventCrosshairMove;
    private _preventScroll;
    private _correctXCoord;
    private _correctYCoord;
    private _setCrosshairPosition;
    private _clearCrosshairPosition;
    private _tryExitTrackingMode;
    private _startTrackingMode;
    private _model;
    private _finishScroll;
    private _endScroll;
    private _terminateKineticAnimation;
    private readonly _canvasConfiguredHandler;
    private readonly _topCanvasConfiguredHandler;
}
