import { IDestroyable } from '../helpers/idestroyable';
import { InvalidationLevel } from '../model/invalidate-mask';
import { LayoutOptionsInternal } from '../model/layout-options';
import { PriceScalePosition } from '../model/pane';
import { PriceScale } from '../model/price-scale';
import { PriceAxisViewRendererOptions } from '../renderers/iprice-axis-view-renderer';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';
import { Size } from './canvas-utils';
import { PaneWidget } from './pane-widget';
export declare type PriceAxisWidgetSide = Exclude<PriceScalePosition, 'overlay'>;
export declare class PriceAxisWidget implements IDestroyable {
    private readonly _pane;
    private readonly _options;
    private readonly _rendererOptionsProvider;
    private readonly _isLeft;
    private _priceScale;
    private _size;
    private readonly _cell;
    private readonly _canvasBinding;
    private readonly _topCanvasBinding;
    private _updateTimeout;
    private _mouseEventHandler;
    private _mousedown;
    private readonly _widthCache;
    private _tickMarksCache;
    private _color;
    private _font;
    private _prevOptimalWidth;
    constructor(pane: PaneWidget, options: LayoutOptionsInternal, rendererOptionsProvider: PriceAxisRendererOptionsProvider, side: PriceAxisWidgetSide);
    destroy(): void;
    getElement(): HTMLElement;
    lineColor(): string;
    textColor(): string;
    fontSize(): number;
    baseFont(): string;
    rendererOptions(): Readonly<PriceAxisViewRendererOptions>;
    optimalWidth(): number;
    setSize(size: Size): void;
    getWidth(): number;
    setPriceScale(priceScale: PriceScale): void;
    priceScale(): PriceScale | null;
    reset(): void;
    paint(type: InvalidationLevel): void;
    getImage(): HTMLCanvasElement;
    private _mouseDownEvent;
    private _pressedMouseMoveEvent;
    private _mouseDownOutsideEvent;
    private _mouseUpEvent;
    private _mouseDoubleClickEvent;
    private _mouseEnterEvent;
    private _mouseLeaveEvent;
    private _backLabels;
    private _drawBackground;
    private _drawBorder;
    private _drawTickMarks;
    private _alignLabels;
    private _drawBackLabels;
    private _drawCrosshairLabel;
    private _setCursor;
    private _onMarksChanged;
    private _recreateTickMarksCache;
    private readonly _canvasConfiguredHandler;
    private readonly _topCanvasConfiguredHandler;
}
