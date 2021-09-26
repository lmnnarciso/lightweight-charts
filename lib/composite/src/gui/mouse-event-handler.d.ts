import { IDestroyable } from '../helpers/idestroyable';
import { Coordinate } from '../model/coordinate';
export declare type HandlerEventCallback = (event: TouchMouseEvent) => void;
export declare type EmptyCallback = () => void;
export declare type PinchEventCallback = (middlePoint: Position, scale: number) => void;
export interface MouseEventHandlers {
    pinchStartEvent?: EmptyCallback;
    pinchEvent?: PinchEventCallback;
    pinchEndEvent?: EmptyCallback;
    mouseClickEvent?: HandlerEventCallback;
    mouseDoubleClickEvent?: HandlerEventCallback;
    mouseDownEvent?: HandlerEventCallback;
    mouseDownOutsideEvent?: EmptyCallback;
    mouseEnterEvent?: HandlerEventCallback;
    mouseLeaveEvent?: HandlerEventCallback;
    mouseMoveEvent?: HandlerEventCallback;
    mouseUpEvent?: HandlerEventCallback;
    pressedMouseMoveEvent?: HandlerEventCallback;
    longTapEvent?: HandlerEventCallback;
}
export interface TouchMouseEventLocal {
    readonly localX: number | Coordinate;
    readonly localY: number | Coordinate;
}
export interface TouchMouseEvent {
    readonly clientX: Coordinate;
    readonly clientY: Coordinate;
    readonly pageX: Coordinate;
    readonly pageY: Coordinate;
    readonly screenX: Coordinate;
    readonly screenY: Coordinate;
    readonly localX: Coordinate;
    readonly localY: Coordinate;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly shiftKey: boolean;
    readonly metaKey: boolean;
    readonly type: 'touch' | 'mouse';
    view: MouseEvent['view'];
}
export interface Position {
    x: number;
    y: number;
}
export interface MouseEventHandlerOptions {
    treatVertTouchDragAsPageScroll: boolean;
    treatHorzTouchDragAsPageScroll: boolean;
}
export declare class MouseEventHandler implements IDestroyable {
    private readonly _target;
    private _handler;
    private readonly _options;
    private _clickCount;
    private _clickTimeoutId;
    private _longTapTimeoutId;
    private _longTapActive;
    private _mouseMoveStartPosition;
    private _moveExceededManhattanDistance;
    private _cancelClick;
    private _unsubscribeOutsideEvents;
    private _unsubscribeMousemove;
    private _unsubscribeRoot;
    private _startPinchMiddlePoint;
    private _startPinchDistance;
    private _pinchPrevented;
    private _preventDragProcess;
    private _mousePressed;
    constructor(target: HTMLElement, handler: MouseEventHandlers, options: MouseEventHandlerOptions);
    destroy(): void;
    private _mouseEnterHandler;
    private _resetClickTimeout;
    private _mouseMoveHandler;
    private _mouseMoveWithDownHandler;
    private _mouseUpHandler;
    private _clearLongTapTimeout;
    private _mouseDownHandler;
    private _init;
    private _initPinch;
    private _checkPinchState;
    private _startPinch;
    private _stopPinch;
    private _mouseLeaveHandler;
    private _longTapHandler;
    private _processEvent;
    private _makeCompatEvent;
}
