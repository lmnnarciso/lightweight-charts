import { ensureNotNull } from '../helpers/assertions';
import { clearRect, clearRectWithGradient, drawScaled } from '../helpers/canvas-helpers';
import { Delegate } from '../helpers/delegate';
import { createBoundCanvas, getContext2D, Size } from './canvas-utils';
import { KineticAnimation } from './kinetic-animation';
import { MouseEventHandler } from './mouse-event-handler';
import { PriceAxisWidget } from './price-axis-widget';
import { isMobile, mobileTouch } from './support-touch';
// actually we should check what event happened (touch or mouse)
// not check current UA to detect "mobile" device
var trackCrosshairOnlyAfterLongTap = isMobile;
var Constants;
(function (Constants) {
    Constants[Constants["MinScrollSpeed"] = 0.2] = "MinScrollSpeed";
    Constants[Constants["MaxScrollSpeed"] = 7] = "MaxScrollSpeed";
    Constants[Constants["DumpingCoeff"] = 0.997] = "DumpingCoeff";
    Constants[Constants["ScrollMinMove"] = 15] = "ScrollMinMove";
})(Constants || (Constants = {}));
function drawBackground(renderer, ctx, pixelRatio, isHovered, hitTestData) {
    if (renderer.drawBackground) {
        renderer.drawBackground(ctx, pixelRatio, isHovered, hitTestData);
    }
}
function drawForeground(renderer, ctx, pixelRatio, isHovered, hitTestData) {
    renderer.draw(ctx, pixelRatio, isHovered, hitTestData);
}
function sourcePaneViews(source, pane) {
    return source.paneViews(pane);
}
function sourceTopPaneViews(source, pane) {
    return source.topPaneViews !== undefined ? source.topPaneViews(pane) : [];
}
var PaneWidget = /** @class */ (function () {
    function PaneWidget(chart, state) {
        var _this = this;
        this._size = new Size(0, 0);
        this._leftPriceAxisWidget = null;
        this._rightPriceAxisWidget = null;
        this._startScrollingPos = null;
        this._isScrolling = false;
        this._clicked = new Delegate();
        this._prevPinchScale = 0;
        this._longTap = false;
        this._startTrackPoint = null;
        this._exitTrackingModeOnNextTry = false;
        this._initCrosshairPosition = null;
        this._scrollXAnimation = null;
        this._canvasConfiguredHandler = function () { return _this._state && _this._model().lightUpdate(); };
        this._topCanvasConfiguredHandler = function () { return _this._state && _this._model().lightUpdate(); };
        this._chart = chart;
        this._state = state;
        this._state.onDestroyed().subscribe(this._onStateDestroyed.bind(this), this, true);
        this._paneCell = document.createElement('td');
        this._paneCell.style.padding = '0';
        this._paneCell.style.position = 'relative';
        var paneWrapper = document.createElement('div');
        paneWrapper.style.width = '100%';
        paneWrapper.style.height = '100%';
        paneWrapper.style.position = 'relative';
        paneWrapper.style.overflow = 'hidden';
        this._leftAxisCell = document.createElement('td');
        this._leftAxisCell.style.padding = '0';
        this._rightAxisCell = document.createElement('td');
        this._rightAxisCell.style.padding = '0';
        this._paneCell.appendChild(paneWrapper);
        this._canvasBinding = createBoundCanvas(paneWrapper, new Size(16, 16));
        this._canvasBinding.subscribeCanvasConfigured(this._canvasConfiguredHandler);
        var canvas = this._canvasBinding.canvas;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._topCanvasBinding = createBoundCanvas(paneWrapper, new Size(16, 16));
        this._topCanvasBinding.subscribeCanvasConfigured(this._topCanvasConfiguredHandler);
        var topCanvas = this._topCanvasBinding.canvas;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        this._rowElement = document.createElement('tr');
        this._rowElement.appendChild(this._leftAxisCell);
        this._rowElement.appendChild(this._paneCell);
        this._rowElement.appendChild(this._rightAxisCell);
        this.updatePriceAxisWidgets();
        var scrollOptions = this.chart().options().handleScroll;
        this._mouseEventHandler = new MouseEventHandler(this._topCanvasBinding.canvas, this, {
            treatVertTouchDragAsPageScroll: !scrollOptions.vertTouchDrag,
            treatHorzTouchDragAsPageScroll: !scrollOptions.horzTouchDrag,
        });
    }
    PaneWidget.prototype.destroy = function () {
        if (this._leftPriceAxisWidget !== null) {
            this._leftPriceAxisWidget.destroy();
        }
        if (this._rightPriceAxisWidget !== null) {
            this._rightPriceAxisWidget.destroy();
        }
        this._topCanvasBinding.unsubscribeCanvasConfigured(this._topCanvasConfiguredHandler);
        this._topCanvasBinding.destroy();
        this._canvasBinding.unsubscribeCanvasConfigured(this._canvasConfiguredHandler);
        this._canvasBinding.destroy();
        if (this._state !== null) {
            this._state.onDestroyed().unsubscribeAll(this);
        }
        this._mouseEventHandler.destroy();
    };
    PaneWidget.prototype.state = function () {
        return ensureNotNull(this._state);
    };
    PaneWidget.prototype.setState = function (pane) {
        if (this._state !== null) {
            this._state.onDestroyed().unsubscribeAll(this);
        }
        this._state = pane;
        if (this._state !== null) {
            this._state.onDestroyed().subscribe(PaneWidget.prototype._onStateDestroyed.bind(this), this, true);
        }
        this.updatePriceAxisWidgets();
    };
    PaneWidget.prototype.chart = function () {
        return this._chart;
    };
    PaneWidget.prototype.getElement = function () {
        return this._rowElement;
    };
    PaneWidget.prototype.updatePriceAxisWidgets = function () {
        if (this._state === null) {
            return;
        }
        this._recreatePriceAxisWidgets();
        if (this._model().serieses().length === 0) {
            return;
        }
        if (this._leftPriceAxisWidget !== null) {
            var leftPriceScale = this._state.leftPriceScale();
            this._leftPriceAxisWidget.setPriceScale(ensureNotNull(leftPriceScale));
        }
        if (this._rightPriceAxisWidget !== null) {
            var rightPriceScale = this._state.rightPriceScale();
            this._rightPriceAxisWidget.setPriceScale(ensureNotNull(rightPriceScale));
        }
    };
    PaneWidget.prototype.stretchFactor = function () {
        return this._state !== null ? this._state.stretchFactor() : 0;
    };
    PaneWidget.prototype.setStretchFactor = function (stretchFactor) {
        if (this._state) {
            this._state.setStretchFactor(stretchFactor);
        }
    };
    PaneWidget.prototype.mouseEnterEvent = function (event) {
        if (!this._state) {
            return;
        }
        var x = event.localX;
        var y = event.localY;
        if (!mobileTouch) {
            this._setCrosshairPosition(x, y);
        }
    };
    PaneWidget.prototype.mouseDownEvent = function (event) {
        this._longTap = false;
        this._exitTrackingModeOnNextTry = this._startTrackPoint !== null;
        if (!this._state) {
            return;
        }
        this._terminateKineticAnimation();
        if (document.activeElement !== document.body && document.activeElement !== document.documentElement) {
            // If any focusable element except the page itself is focused, remove the focus
            ensureNotNull(document.activeElement).blur();
        }
        else {
            // Clear selection
            var selection = document.getSelection();
            if (selection !== null) {
                selection.removeAllRanges();
            }
        }
        var model = this._model();
        var priceScale = this._state.defaultPriceScale();
        if (priceScale.isEmpty() || model.timeScale().isEmpty()) {
            return;
        }
        if (this._startTrackPoint !== null) {
            var crosshair = model.crosshairSource();
            this._initCrosshairPosition = { x: crosshair.appliedX(), y: crosshair.appliedY() };
            this._startTrackPoint = { x: event.localX, y: event.localY };
        }
        if (!mobileTouch) {
            this._setCrosshairPosition(event.localX, event.localY);
        }
    };
    PaneWidget.prototype.mouseMoveEvent = function (event) {
        if (!this._state) {
            return;
        }
        var x = event.localX;
        var y = event.localY;
        if (this._preventCrosshairMove()) {
            this._clearCrosshairPosition();
        }
        if (!mobileTouch) {
            this._setCrosshairPosition(x, y);
            var hitTest = this.hitTest(x, y);
            this._model().setHoveredSource(hitTest && { source: hitTest.source, object: hitTest.object });
            if (hitTest !== null && hitTest.view.moveHandler !== undefined) {
                hitTest.view.moveHandler(x, y);
            }
        }
    };
    PaneWidget.prototype.mouseClickEvent = function (event) {
        if (this._state === null) {
            return;
        }
        var x = event.localX;
        var y = event.localY;
        var hitTest = this.hitTest(x, y);
        if (hitTest !== null && hitTest.view.clickHandler !== undefined) {
            hitTest.view.clickHandler(x, y);
        }
        if (this._clicked.hasListeners()) {
            var currentTime = this._model().crosshairSource().appliedIndex();
            this._clicked.fire(currentTime, { x: x, y: y });
        }
        this._tryExitTrackingMode();
    };
    // eslint-disable-next-line complexity
    PaneWidget.prototype.pressedMouseMoveEvent = function (event) {
        if (this._state === null) {
            return;
        }
        var model = this._model();
        var x = event.localX;
        var y = event.localY;
        if (this._startTrackPoint !== null) {
            // tracking mode: move crosshair
            this._exitTrackingModeOnNextTry = false;
            var origPoint = ensureNotNull(this._initCrosshairPosition);
            var newX = origPoint.x + (x - this._startTrackPoint.x);
            var newY = origPoint.y + (y - this._startTrackPoint.y);
            this._setCrosshairPosition(newX, newY);
        }
        else if (!this._preventCrosshairMove()) {
            this._setCrosshairPosition(x, y);
        }
        if (model.timeScale().isEmpty()) {
            return;
        }
        var chartOptions = this._chart.options();
        var scrollOptions = chartOptions.handleScroll;
        var kineticScrollOptions = chartOptions.kineticScroll;
        if ((!scrollOptions.pressedMouseMove || event.type === 'touch') &&
            (!scrollOptions.horzTouchDrag && !scrollOptions.vertTouchDrag || event.type === 'mouse')) {
            return;
        }
        var priceScale = this._state.defaultPriceScale();
        var now = performance.now();
        if (this._startScrollingPos === null && !this._preventScroll()) {
            this._startScrollingPos = {
                x: event.clientX,
                y: event.clientY,
                timestamp: now,
                localX: event.localX,
                localY: event.localY,
            };
        }
        if (this._scrollXAnimation !== null) {
            this._scrollXAnimation.addPosition(event.localX, now);
        }
        if (this._startScrollingPos !== null &&
            !this._isScrolling &&
            (this._startScrollingPos.x !== event.clientX || this._startScrollingPos.y !== event.clientY)) {
            if (this._scrollXAnimation === null && (event.type === 'touch' && kineticScrollOptions.touch ||
                event.type === 'mouse' && kineticScrollOptions.mouse)) {
                this._scrollXAnimation = new KineticAnimation(0.2 /* MinScrollSpeed */, 7 /* MaxScrollSpeed */, 0.997 /* DumpingCoeff */, 15 /* ScrollMinMove */);
                this._scrollXAnimation.addPosition(this._startScrollingPos.localX, this._startScrollingPos.timestamp);
                this._scrollXAnimation.addPosition(event.localX, now);
            }
            if (!priceScale.isEmpty()) {
                model.startScrollPrice(this._state, priceScale, event.localY);
            }
            model.startScrollTime(event.localX);
            this._isScrolling = true;
        }
        if (this._isScrolling) {
            // this allows scrolling not default price scales
            if (!priceScale.isEmpty()) {
                model.scrollPriceTo(this._state, priceScale, event.localY);
            }
            model.scrollTimeTo(event.localX);
        }
    };
    PaneWidget.prototype.mouseUpEvent = function (event) {
        if (this._state === null) {
            return;
        }
        this._longTap = false;
        this._endScroll(event);
    };
    PaneWidget.prototype.longTapEvent = function (event) {
        this._longTap = true;
        if (this._startTrackPoint === null && trackCrosshairOnlyAfterLongTap) {
            var point = { x: event.localX, y: event.localY };
            this._startTrackingMode(point, point);
        }
    };
    PaneWidget.prototype.mouseLeaveEvent = function (event) {
        if (this._state === null) {
            return;
        }
        this._state.model().setHoveredSource(null);
        if (!isMobile) {
            this._clearCrosshairPosition();
        }
    };
    PaneWidget.prototype.clicked = function () {
        return this._clicked;
    };
    PaneWidget.prototype.pinchStartEvent = function () {
        this._prevPinchScale = 1;
        this._terminateKineticAnimation();
    };
    PaneWidget.prototype.pinchEvent = function (middlePoint, scale) {
        if (!this._chart.options().handleScale.pinch) {
            return;
        }
        var zoomScale = (scale - this._prevPinchScale) * 5;
        this._prevPinchScale = scale;
        this._model().zoomTime(middlePoint.x, zoomScale);
    };
    PaneWidget.prototype.hitTest = function (x, y) {
        var state = this._state;
        if (state === null) {
            return null;
        }
        var sources = state.orderedSources();
        for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
            var source = sources_1[_i];
            var sourceResult = this._hitTestPaneView(source.paneViews(state), x, y);
            if (sourceResult !== null) {
                return {
                    source: source,
                    view: sourceResult.view,
                    object: sourceResult.object,
                };
            }
        }
        return null;
    };
    PaneWidget.prototype.setPriceAxisSize = function (width, position) {
        var priceAxisWidget = position === 'left' ? this._leftPriceAxisWidget : this._rightPriceAxisWidget;
        ensureNotNull(priceAxisWidget).setSize(new Size(width, this._size.h));
    };
    PaneWidget.prototype.getSize = function () {
        return this._size;
    };
    PaneWidget.prototype.setSize = function (size) {
        if (size.w < 0 || size.h < 0) {
            throw new Error('Try to set invalid size to PaneWidget ' + JSON.stringify(size));
        }
        if (this._size.equals(size)) {
            return;
        }
        this._size = size;
        this._canvasBinding.resizeCanvas({ width: size.w, height: size.h });
        this._topCanvasBinding.resizeCanvas({ width: size.w, height: size.h });
        this._paneCell.style.width = size.w + 'px';
        this._paneCell.style.height = size.h + 'px';
    };
    PaneWidget.prototype.recalculatePriceScales = function () {
        var pane = ensureNotNull(this._state);
        pane.recalculatePriceScale(pane.leftPriceScale());
        pane.recalculatePriceScale(pane.rightPriceScale());
        for (var _i = 0, _a = pane.dataSources(); _i < _a.length; _i++) {
            var source = _a[_i];
            if (pane.isOverlay(source)) {
                var priceScale = source.priceScale();
                if (priceScale !== null) {
                    pane.recalculatePriceScale(priceScale);
                }
                // for overlay drawings price scale is owner's price scale
                // however owner's price scale could not contain ds
                source.updateAllViews();
            }
        }
    };
    PaneWidget.prototype.getImage = function () {
        return this._canvasBinding.canvas;
    };
    PaneWidget.prototype.paint = function (type) {
        if (type === 0 /* None */) {
            return;
        }
        if (this._state === null) {
            return;
        }
        if (type > 1 /* Cursor */) {
            this.recalculatePriceScales();
        }
        if (this._leftPriceAxisWidget !== null) {
            this._leftPriceAxisWidget.paint(type);
        }
        if (this._rightPriceAxisWidget !== null) {
            this._rightPriceAxisWidget.paint(type);
        }
        if (type !== 1 /* Cursor */) {
            var ctx = getContext2D(this._canvasBinding.canvas);
            ctx.save();
            this._drawBackground(ctx, this._canvasBinding.pixelRatio);
            if (this._state) {
                this._drawGrid(ctx, this._canvasBinding.pixelRatio);
                this._drawWatermark(ctx, this._canvasBinding.pixelRatio);
                this._drawSources(ctx, this._canvasBinding.pixelRatio, sourcePaneViews);
            }
            ctx.restore();
        }
        var topCtx = getContext2D(this._topCanvasBinding.canvas);
        topCtx.clearRect(0, 0, Math.ceil(this._size.w * this._topCanvasBinding.pixelRatio), Math.ceil(this._size.h * this._topCanvasBinding.pixelRatio));
        this._drawSources(topCtx, this._canvasBinding.pixelRatio, sourceTopPaneViews);
        this._drawCrosshair(topCtx, this._topCanvasBinding.pixelRatio);
    };
    PaneWidget.prototype.leftPriceAxisWidget = function () {
        return this._leftPriceAxisWidget;
    };
    PaneWidget.prototype.rightPriceAxisWidget = function () {
        return this._rightPriceAxisWidget;
    };
    PaneWidget.prototype._onStateDestroyed = function () {
        if (this._state !== null) {
            this._state.onDestroyed().unsubscribeAll(this);
        }
        this._state = null;
    };
    PaneWidget.prototype._drawBackground = function (ctx, pixelRatio) {
        var _this = this;
        drawScaled(ctx, pixelRatio, function () {
            var model = _this._model();
            var topColor = model.backgroundTopColor();
            var bottomColor = model.backgroundBottomColor();
            if (topColor === bottomColor) {
                clearRect(ctx, 0, 0, _this._size.w, _this._size.h, bottomColor);
            }
            else {
                clearRectWithGradient(ctx, 0, 0, _this._size.w, _this._size.h, topColor, bottomColor);
            }
        });
    };
    PaneWidget.prototype._drawGrid = function (ctx, pixelRatio) {
        var state = ensureNotNull(this._state);
        var paneView = state.grid().paneView();
        var renderer = paneView.renderer(state.height(), state.width());
        if (renderer !== null) {
            ctx.save();
            renderer.draw(ctx, pixelRatio, false);
            ctx.restore();
        }
    };
    PaneWidget.prototype._drawWatermark = function (ctx, pixelRatio) {
        var source = this._model().watermarkSource();
        this._drawSourceImpl(ctx, pixelRatio, sourcePaneViews, drawBackground, source);
        this._drawSourceImpl(ctx, pixelRatio, sourcePaneViews, drawForeground, source);
    };
    PaneWidget.prototype._drawCrosshair = function (ctx, pixelRatio) {
        this._drawSourceImpl(ctx, pixelRatio, sourcePaneViews, drawForeground, this._model().crosshairSource());
    };
    PaneWidget.prototype._drawSources = function (ctx, pixelRatio, paneViewsGetter) {
        var state = ensureNotNull(this._state);
        var sources = state.orderedSources();
        for (var _i = 0, sources_2 = sources; _i < sources_2.length; _i++) {
            var source = sources_2[_i];
            this._drawSourceImpl(ctx, pixelRatio, paneViewsGetter, drawBackground, source);
        }
        for (var _a = 0, sources_3 = sources; _a < sources_3.length; _a++) {
            var source = sources_3[_a];
            this._drawSourceImpl(ctx, pixelRatio, paneViewsGetter, drawForeground, source);
        }
    };
    PaneWidget.prototype._drawSourceImpl = function (ctx, pixelRatio, paneViewsGetter, drawFn, source) {
        var state = ensureNotNull(this._state);
        var paneViews = paneViewsGetter(source, state);
        var height = state.height();
        var width = state.width();
        var hoveredSource = state.model().hoveredSource();
        var isHovered = hoveredSource !== null && hoveredSource.source === source;
        var objecId = hoveredSource !== null && isHovered && hoveredSource.object !== undefined
            ? hoveredSource.object.hitTestData
            : undefined;
        for (var _i = 0, paneViews_1 = paneViews; _i < paneViews_1.length; _i++) {
            var paneView = paneViews_1[_i];
            var renderer = paneView.renderer(height, width);
            if (renderer !== null) {
                ctx.save();
                drawFn(renderer, ctx, pixelRatio, isHovered, objecId);
                ctx.restore();
            }
        }
    };
    PaneWidget.prototype._hitTestPaneView = function (paneViews, x, y) {
        for (var _i = 0, paneViews_2 = paneViews; _i < paneViews_2.length; _i++) {
            var paneView = paneViews_2[_i];
            var renderer = paneView.renderer(this._size.h, this._size.w);
            if (renderer !== null && renderer.hitTest) {
                var result = renderer.hitTest(x, y);
                if (result !== null) {
                    return {
                        view: paneView,
                        object: result,
                    };
                }
            }
        }
        return null;
    };
    PaneWidget.prototype._recreatePriceAxisWidgets = function () {
        if (this._state === null) {
            return;
        }
        var chart = this._chart;
        if (!chart.options().leftPriceScale.visible && this._leftPriceAxisWidget !== null) {
            this._leftAxisCell.removeChild(this._leftPriceAxisWidget.getElement());
            this._leftPriceAxisWidget.destroy();
            this._leftPriceAxisWidget = null;
        }
        if (!chart.options().rightPriceScale.visible && this._rightPriceAxisWidget !== null) {
            this._rightAxisCell.removeChild(this._rightPriceAxisWidget.getElement());
            this._rightPriceAxisWidget.destroy();
            this._rightPriceAxisWidget = null;
        }
        var rendererOptionsProvider = chart.model().rendererOptionsProvider();
        if (chart.options().leftPriceScale.visible && this._leftPriceAxisWidget === null) {
            this._leftPriceAxisWidget = new PriceAxisWidget(this, chart.options().layout, rendererOptionsProvider, 'left');
            this._leftAxisCell.appendChild(this._leftPriceAxisWidget.getElement());
        }
        if (chart.options().rightPriceScale.visible && this._rightPriceAxisWidget === null) {
            this._rightPriceAxisWidget = new PriceAxisWidget(this, chart.options().layout, rendererOptionsProvider, 'right');
            this._rightAxisCell.appendChild(this._rightPriceAxisWidget.getElement());
        }
    };
    PaneWidget.prototype._preventCrosshairMove = function () {
        return trackCrosshairOnlyAfterLongTap && this._startTrackPoint === null;
    };
    PaneWidget.prototype._preventScroll = function () {
        return trackCrosshairOnlyAfterLongTap && this._longTap || this._startTrackPoint !== null;
    };
    PaneWidget.prototype._correctXCoord = function (x) {
        return Math.max(0, Math.min(x, this._size.w - 1));
    };
    PaneWidget.prototype._correctYCoord = function (y) {
        return Math.max(0, Math.min(y, this._size.h - 1));
    };
    PaneWidget.prototype._setCrosshairPosition = function (x, y) {
        this._model().setAndSaveCurrentPosition(this._correctXCoord(x), this._correctYCoord(y), ensureNotNull(this._state));
    };
    PaneWidget.prototype._clearCrosshairPosition = function () {
        this._model().clearCurrentPosition();
    };
    PaneWidget.prototype._tryExitTrackingMode = function () {
        if (this._exitTrackingModeOnNextTry) {
            this._startTrackPoint = null;
            this._clearCrosshairPosition();
        }
    };
    PaneWidget.prototype._startTrackingMode = function (startTrackPoint, crossHairPosition) {
        this._startTrackPoint = startTrackPoint;
        this._exitTrackingModeOnNextTry = false;
        this._setCrosshairPosition(crossHairPosition.x, crossHairPosition.y);
        var crosshair = this._model().crosshairSource();
        this._initCrosshairPosition = { x: crosshair.appliedX(), y: crosshair.appliedY() };
    };
    PaneWidget.prototype._model = function () {
        return this._chart.model();
    };
    PaneWidget.prototype._finishScroll = function () {
        var model = this._model();
        var state = this.state();
        var priceScale = state.defaultPriceScale();
        model.endScrollPrice(state, priceScale);
        model.endScrollTime();
        this._startScrollingPos = null;
        this._isScrolling = false;
    };
    PaneWidget.prototype._endScroll = function (event) {
        var _this = this;
        if (!this._isScrolling) {
            return;
        }
        var startAnimationTime = performance.now();
        if (this._scrollXAnimation !== null) {
            this._scrollXAnimation.start(event.localX, startAnimationTime);
        }
        if ((this._scrollXAnimation === null || this._scrollXAnimation.finished(startAnimationTime))) {
            // animation is not needed
            this._finishScroll();
            return;
        }
        var model = this._model();
        var timeScale = model.timeScale();
        var scrollXAnimation = this._scrollXAnimation;
        var animationFn = function () {
            if ((scrollXAnimation.terminated())) {
                // animation terminated, see _terminateKineticAnimation
                return;
            }
            var now = performance.now();
            var xAnimationFinished = scrollXAnimation.finished(now);
            if (!scrollXAnimation.terminated()) {
                var prevRightOffset = timeScale.rightOffset();
                model.scrollTimeTo(scrollXAnimation.getPosition(now));
                if (prevRightOffset === timeScale.rightOffset()) {
                    xAnimationFinished = true;
                    _this._scrollXAnimation = null;
                }
            }
            if (xAnimationFinished) {
                _this._finishScroll();
                return;
            }
            requestAnimationFrame(animationFn);
        };
        requestAnimationFrame(animationFn);
    };
    PaneWidget.prototype._terminateKineticAnimation = function () {
        var now = performance.now();
        var xAnimationFinished = this._scrollXAnimation === null || this._scrollXAnimation.finished(now);
        if (this._scrollXAnimation !== null) {
            if (!xAnimationFinished) {
                this._finishScroll();
            }
        }
        if (this._scrollXAnimation !== null) {
            this._scrollXAnimation.terminate();
            this._scrollXAnimation = null;
        }
    };
    return PaneWidget;
}());
export { PaneWidget };
