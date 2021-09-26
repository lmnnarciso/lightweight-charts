import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { drawScaled } from '../helpers/canvas-helpers';
import { Delegate } from '../helpers/delegate';
import { ChartModel } from '../model/chart-model';
import { InvalidateMask, } from '../model/invalidate-mask';
import { Series } from '../model/series';
import { createPreconfiguredCanvas, getCanvasDevicePixelRatio, getContext2D, Size } from './canvas-utils';
// import { PaneSeparator, SEPARATOR_HEIGHT } from './pane-separator';
import { PaneWidget } from './pane-widget';
import { TimeAxisWidget } from './time-axis-widget';
var ChartWidget = /** @class */ (function () {
    function ChartWidget(container, options) {
        this._paneWidgets = [];
        this._drawRafId = 0;
        this._height = 0;
        this._width = 0;
        this._leftPriceAxisWidth = 0;
        this._rightPriceAxisWidth = 0;
        this._invalidateMask = null;
        this._drawPlanned = false;
        this._clicked = new Delegate();
        this._crosshairMoved = new Delegate();
        this._options = options;
        this._element = document.createElement('div');
        this._element.classList.add('tv-lightweight-charts');
        this._element.style.overflow = 'hidden';
        this._element.style.width = '100%';
        this._element.style.height = '100%';
        disableSelection(this._element);
        this._tableElement = document.createElement('table');
        this._tableElement.setAttribute('cellspacing', '0');
        this._element.appendChild(this._tableElement);
        this._onWheelBound = this._onMousewheel.bind(this);
        this._element.addEventListener('wheel', this._onWheelBound, { passive: false });
        this._model = new ChartModel(this._invalidateHandler.bind(this), this._options);
        this.model().crosshairMoved().subscribe(this._onPaneWidgetCrosshairMoved.bind(this), this);
        this._timeAxisWidget = new TimeAxisWidget(this);
        this._tableElement.appendChild(this._timeAxisWidget.getElement());
        var width = this._options.width;
        var height = this._options.height;
        if (width === 0 || height === 0) {
            var containerRect = container.getBoundingClientRect();
            // TODO: Fix it better
            // on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
            // For chart widget we decreases because we must be inside container.
            // For time axis this is not important, since it just affects space for pane widgets
            if (width === 0) {
                width = Math.floor(containerRect.width);
                width -= width % 2;
            }
            if (height === 0) {
                height = Math.floor(containerRect.height);
                height -= height % 2;
            }
        }
        // BEWARE: resize must be called BEFORE _syncGuiWithModel (in constructor only)
        // or after but with adjustSize to properly update time scale
        this.resize(width, height);
        this._syncGuiWithModel();
        container.appendChild(this._element);
        this._updateTimeAxisVisibility();
        this._model.timeScale().optionsApplied().subscribe(this._model.fullUpdate.bind(this._model), this);
        this._model.priceScalesOptionsChanged().subscribe(this._model.fullUpdate.bind(this._model), this);
    }
    ChartWidget.prototype.model = function () {
        return this._model;
    };
    ChartWidget.prototype.options = function () {
        return this._options;
    };
    ChartWidget.prototype.paneWidgets = function () {
        return this._paneWidgets;
    };
    ChartWidget.prototype.destroy = function () {
        this._element.removeEventListener('wheel', this._onWheelBound);
        if (this._drawRafId !== 0) {
            window.cancelAnimationFrame(this._drawRafId);
        }
        this._model.crosshairMoved().unsubscribeAll(this);
        this._model.timeScale().optionsApplied().unsubscribeAll(this);
        this._model.priceScalesOptionsChanged().unsubscribeAll(this);
        this._model.destroy();
        for (var _i = 0, _a = this._paneWidgets; _i < _a.length; _i++) {
            var paneWidget = _a[_i];
            this._tableElement.removeChild(paneWidget.getElement());
            paneWidget.clicked().unsubscribeAll(this);
            paneWidget.destroy();
        }
        this._paneWidgets = [];
        // for (const paneSeparator of this._paneSeparators) {
        // 	this._destroySeparator(paneSeparator);
        // }
        // this._paneSeparators = [];
        ensureNotNull(this._timeAxisWidget).destroy();
        if (this._element.parentElement !== null) {
            this._element.parentElement.removeChild(this._element);
        }
        this._crosshairMoved.destroy();
        this._clicked.destroy();
    };
    ChartWidget.prototype.resize = function (width, height, forceRepaint) {
        if (forceRepaint === void 0) { forceRepaint = false; }
        if (this._height === height && this._width === width) {
            return;
        }
        this._height = height;
        this._width = width;
        var heightStr = height + 'px';
        var widthStr = width + 'px';
        ensureNotNull(this._element).style.height = heightStr;
        ensureNotNull(this._element).style.width = widthStr;
        this._tableElement.style.height = heightStr;
        this._tableElement.style.width = widthStr;
        if (forceRepaint) {
            this._drawImpl(new InvalidateMask(3 /* Full */));
        }
        else {
            this._model.fullUpdate();
        }
    };
    ChartWidget.prototype.paint = function (invalidateMask) {
        if (invalidateMask === undefined) {
            invalidateMask = new InvalidateMask(3 /* Full */);
        }
        for (var i = 0; i < this._paneWidgets.length; i++) {
            this._paneWidgets[i].paint(invalidateMask.invalidateForPane(i).level);
        }
        this._timeAxisWidget.paint(invalidateMask.fullInvalidation());
    };
    ChartWidget.prototype.applyOptions = function (options) {
        this._model.applyOptions(options);
        this._updateTimeAxisVisibility();
        var width = options.width || this._width;
        var height = options.height || this._height;
        this.resize(width, height);
    };
    ChartWidget.prototype.clicked = function () {
        return this._clicked;
    };
    ChartWidget.prototype.crosshairMoved = function () {
        return this._crosshairMoved;
    };
    ChartWidget.prototype.takeScreenshot = function () {
        var _this = this;
        if (this._invalidateMask !== null) {
            this._drawImpl(this._invalidateMask);
            this._invalidateMask = null;
        }
        // calculate target size
        var firstPane = this._paneWidgets[0];
        var targetCanvas = createPreconfiguredCanvas(document, new Size(this._width, this._height));
        var ctx = getContext2D(targetCanvas);
        var pixelRatio = getCanvasDevicePixelRatio(targetCanvas);
        drawScaled(ctx, pixelRatio, function () {
            var targetX = 0;
            var targetY = 0;
            var drawPriceAxises = function (position) {
                for (var paneIndex = 0; paneIndex < _this._paneWidgets.length; paneIndex++) {
                    var paneWidget = _this._paneWidgets[paneIndex];
                    var paneWidgetHeight = paneWidget.getSize().h;
                    var priceAxisWidget = ensureNotNull(position === 'left' ? paneWidget.leftPriceAxisWidget() : paneWidget.rightPriceAxisWidget());
                    var image = priceAxisWidget.getImage();
                    ctx.drawImage(image, targetX, targetY, priceAxisWidget.getWidth(), paneWidgetHeight);
                    targetY += paneWidgetHeight;
                    // if (paneIndex < this._paneWidgets.length - 1) {
                    // 	const separator = this._paneSeparators[paneIndex];
                    // 	const separatorSize = separator.getSize();
                    // 	const separatorImage = separator.getImage();
                    // 	ctx.drawImage(separatorImage, targetX, targetY, separatorSize.w, separatorSize.h);
                    // 	targetY += separatorSize.h;
                    // }
                }
            };
            // draw left price scale if exists
            if (_this._isLeftAxisVisible()) {
                drawPriceAxises('left');
                targetX = ensureNotNull(firstPane.leftPriceAxisWidget()).getWidth();
            }
            targetY = 0;
            for (var paneIndex = 0; paneIndex < _this._paneWidgets.length; paneIndex++) {
                var paneWidget = _this._paneWidgets[paneIndex];
                var paneWidgetSize = paneWidget.getSize();
                var image = paneWidget.getImage();
                ctx.drawImage(image, targetX, targetY, paneWidgetSize.w, paneWidgetSize.h);
                targetY += paneWidgetSize.h;
                // if (paneIndex < this._paneWidgets.length - 1) {
                // 	const separator = this._paneSeparators[paneIndex];
                // 	const separatorSize = separator.getSize();
                // 	const separatorImage = separator.getImage();
                // 	ctx.drawImage(separatorImage, targetX, targetY, separatorSize.w, separatorSize.h);
                // 	targetY += separatorSize.h;
                // }
            }
            targetX += firstPane.getSize().w;
            if (_this._isRightAxisVisible()) {
                targetY = 0;
                drawPriceAxises('right');
            }
            var drawStub = function (position) {
                var stub = ensureNotNull(position === 'left' ? _this._timeAxisWidget.leftStub() : _this._timeAxisWidget.rightStub());
                var size = stub.getSize();
                var image = stub.getImage();
                ctx.drawImage(image, targetX, targetY, size.w, size.h);
            };
            // draw time scale
            if (_this._options.timeScale.visible) {
                targetX = 0;
                if (_this._isLeftAxisVisible()) {
                    drawStub('left');
                    targetX = ensureNotNull(firstPane.leftPriceAxisWidget()).getWidth();
                }
                var size = _this._timeAxisWidget.getSize();
                var image = _this._timeAxisWidget.getImage();
                ctx.drawImage(image, targetX, targetY, size.w, size.h);
                if (_this._isRightAxisVisible()) {
                    targetX += firstPane.getSize().w;
                    drawStub('right');
                    ctx.restore();
                }
            }
        });
        return targetCanvas;
    };
    ChartWidget.prototype.getPriceAxisWidth = function (position) {
        if (position === 'none') {
            return 0;
        }
        if (position === 'left' && !this._isLeftAxisVisible()) {
            return 0;
        }
        if (position === 'right' && !this._isRightAxisVisible()) {
            return 0;
        }
        if (this._paneWidgets.length === 0) {
            return 0;
        }
        // we don't need to worry about exactly pane widget here
        // because all pane widgets have the same width of price axis widget
        // see _adjustSizeImpl
        var priceAxisWidget = position === 'left'
            ? this._paneWidgets[0].leftPriceAxisWidget()
            : this._paneWidgets[0].rightPriceAxisWidget();
        return ensureNotNull(priceAxisWidget).getWidth();
    };
    // eslint-disable-next-line complexity
    ChartWidget.prototype._adjustSizeImpl = function () {
        var totalStretch = 0;
        var leftPriceAxisWidth = 0;
        var rightPriceAxisWidth = 0;
        for (var _i = 0, _a = this._paneWidgets; _i < _a.length; _i++) {
            var paneWidget = _a[_i];
            if (this._isLeftAxisVisible()) {
                leftPriceAxisWidth = Math.max(leftPriceAxisWidth, ensureNotNull(paneWidget.leftPriceAxisWidget()).optimalWidth());
            }
            if (this._isRightAxisVisible()) {
                rightPriceAxisWidth = Math.max(rightPriceAxisWidth, ensureNotNull(paneWidget.rightPriceAxisWidget()).optimalWidth());
            }
            totalStretch += paneWidget.stretchFactor();
        }
        var width = this._width;
        var height = this._height;
        var paneWidth = Math.max(width - leftPriceAxisWidth - rightPriceAxisWidth, 0);
        // const separatorCount = this._paneSeparators.length;
        // const separatorHeight = SEPARATOR_HEIGHT;
        var separatorsHeight = 0; // separatorHeight * separatorCount;
        var timeAxisHeight = this._options.timeScale.visible ? this._timeAxisWidget.optimalHeight() : 0;
        // TODO: Fix it better
        // on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
        if (timeAxisHeight % 2) {
            timeAxisHeight += 1;
        }
        var otherWidgetHeight = separatorsHeight + timeAxisHeight;
        var totalPaneHeight = height < otherWidgetHeight ? 0 : height - otherWidgetHeight;
        var stretchPixels = totalPaneHeight / totalStretch;
        var accumulatedHeight = 0;
        for (var paneIndex = 0; paneIndex < this._paneWidgets.length; ++paneIndex) {
            var paneWidget = this._paneWidgets[paneIndex];
            paneWidget.setState(this._model.panes()[paneIndex]);
            var paneHeight = 0;
            var calculatePaneHeight = 0;
            if (paneIndex === this._paneWidgets.length - 1) {
                calculatePaneHeight = totalPaneHeight - accumulatedHeight;
            }
            else {
                calculatePaneHeight = Math.round(paneWidget.stretchFactor() * stretchPixels);
            }
            paneHeight = Math.max(calculatePaneHeight, 2);
            accumulatedHeight += paneHeight;
            paneWidget.setSize(new Size(paneWidth, paneHeight));
            if (this._isLeftAxisVisible()) {
                paneWidget.setPriceAxisSize(leftPriceAxisWidth, 'left');
            }
            if (this._isRightAxisVisible()) {
                paneWidget.setPriceAxisSize(rightPriceAxisWidth, 'right');
            }
            if (paneWidget.state()) {
                this._model.setPaneHeight(paneWidget.state(), paneHeight);
            }
        }
        this._timeAxisWidget.setSizes(new Size(paneWidth, timeAxisHeight), leftPriceAxisWidth, rightPriceAxisWidth);
        this._model.setWidth(paneWidth);
        if (this._leftPriceAxisWidth !== leftPriceAxisWidth) {
            this._leftPriceAxisWidth = leftPriceAxisWidth;
        }
        if (this._rightPriceAxisWidth !== rightPriceAxisWidth) {
            this._rightPriceAxisWidth = rightPriceAxisWidth;
        }
    };
    ChartWidget.prototype._onMousewheel = function (event) {
        var deltaX = event.deltaX / 100;
        var deltaY = -(event.deltaY / 100);
        if ((deltaX === 0 || !this._options.handleScroll.mouseWheel) &&
            (deltaY === 0 || !this._options.handleScale.mouseWheel)) {
            return;
        }
        if (event.cancelable) {
            event.preventDefault();
        }
        switch (event.deltaMode) {
            case event.DOM_DELTA_PAGE:
                // one screen at time scroll mode
                deltaX *= 120;
                deltaY *= 120;
                break;
            case event.DOM_DELTA_LINE:
                // one line at time scroll mode
                deltaX *= 32;
                deltaY *= 32;
                break;
        }
        if (deltaY !== 0 && this._options.handleScale.mouseWheel) {
            var zoomScale = Math.sign(deltaY) * Math.min(1, Math.abs(deltaY));
            var scrollPosition = event.clientX - this._element.getBoundingClientRect().left;
            this.model().zoomTime(scrollPosition, zoomScale);
        }
        if (deltaX !== 0 && this._options.handleScroll.mouseWheel) {
            this.model().scrollChart(deltaX * -80); // 80 is a made up coefficient, and minus is for the "natural" scroll
        }
    };
    ChartWidget.prototype._drawImpl = function (invalidateMask) {
        var invalidationType = invalidateMask.fullInvalidation();
        // actions for full invalidation ONLY (not shared with light)
        if (invalidationType === 3 /* Full */) {
            this._updateGui();
        }
        // light or full invalidate actions
        if (invalidationType === 3 /* Full */ ||
            invalidationType === 2 /* Light */) {
            var panes = this._model.panes();
            for (var i = 0; i < panes.length; i++) {
                if (invalidateMask.invalidateForPane(i).autoScale) {
                    panes[i].momentaryAutoScale();
                }
            }
            var timeScaleInvalidations = invalidateMask.timeScaleInvalidations();
            for (var _i = 0, timeScaleInvalidations_1 = timeScaleInvalidations; _i < timeScaleInvalidations_1.length; _i++) {
                var tsInvalidation = timeScaleInvalidations_1[_i];
                this._applyTimeScaleInvalidation(tsInvalidation);
            }
            if (timeScaleInvalidations.length > 0) {
                this._model.recalculateAllPanes();
                this._model.updateCrosshair();
                this._model.lightUpdate();
            }
            this._timeAxisWidget.update();
        }
        this.paint(invalidateMask);
    };
    ChartWidget.prototype._applyTimeScaleInvalidation = function (invalidation) {
        var timeScale = this._model.timeScale();
        switch (invalidation.type) {
            case 0 /* FitContent */:
                timeScale.fitContent();
                break;
            case 1 /* ApplyRange */:
                timeScale.setLogicalRange(invalidation.value);
                break;
            case 2 /* ApplyBarSpacing */:
                timeScale.setBarSpacing(invalidation.value);
                break;
            case 3 /* ApplyRightOffset */:
                timeScale.setRightOffset(invalidation.value);
                break;
            case 4 /* Reset */:
                timeScale.restoreDefault();
                break;
        }
    };
    ChartWidget.prototype._invalidateHandler = function (invalidateMask) {
        var _this = this;
        if (this._invalidateMask !== null) {
            this._invalidateMask.merge(invalidateMask);
        }
        else {
            this._invalidateMask = invalidateMask;
        }
        if (!this._drawPlanned) {
            this._drawPlanned = true;
            this._drawRafId = window.requestAnimationFrame(function () {
                _this._drawPlanned = false;
                _this._drawRafId = 0;
                if (_this._invalidateMask !== null) {
                    _this._drawImpl(_this._invalidateMask);
                    _this._invalidateMask = null;
                }
            });
        }
    };
    ChartWidget.prototype._updateGui = function () {
        this._syncGuiWithModel();
    };
    // private _destroySeparator(separator: PaneSeparator): void {
    // 	this._tableElement.removeChild(separator.getElement());
    // 	separator.destroy();
    // }
    ChartWidget.prototype._syncGuiWithModel = function () {
        var panes = this._model.panes();
        var targetPaneWidgetsCount = panes.length;
        var actualPaneWidgetsCount = this._paneWidgets.length;
        // Remove (if needed) pane widgets and separators
        for (var i = targetPaneWidgetsCount; i < actualPaneWidgetsCount; i++) {
            var paneWidget = ensureDefined(this._paneWidgets.pop());
            this._tableElement.removeChild(paneWidget.getElement());
            paneWidget.clicked().unsubscribeAll(this);
            paneWidget.destroy();
            // const paneSeparator = this._paneSeparators.pop();
            // if (paneSeparator !== undefined) {
            // 	this._destroySeparator(paneSeparator);
            // }
        }
        // Create (if needed) new pane widgets and separators
        for (var i = actualPaneWidgetsCount; i < targetPaneWidgetsCount; i++) {
            var paneWidget = new PaneWidget(this, panes[i]);
            paneWidget.clicked().subscribe(this._onPaneWidgetClicked.bind(this), this);
            this._paneWidgets.push(paneWidget);
            // create and insert separator
            // if (i > 1) {
            // 	const paneSeparator = new PaneSeparator(this, i - 1, i, true);
            // 	this._paneSeparators.push(paneSeparator);
            // 	this._tableElement.insertBefore(paneSeparator.getElement(), this._timeAxisWidget.getElement());
            // }
            // insert paneWidget
            this._tableElement.insertBefore(paneWidget.getElement(), this._timeAxisWidget.getElement());
        }
        for (var i = 0; i < targetPaneWidgetsCount; i++) {
            var state = panes[i];
            var paneWidget = this._paneWidgets[i];
            if (paneWidget.state() !== state) {
                paneWidget.setState(state);
            }
            else {
                paneWidget.updatePriceAxisWidgets();
            }
        }
        this._updateTimeAxisVisibility();
        this._adjustSizeImpl();
    };
    ChartWidget.prototype._getMouseEventParamsImpl = function (index, point) {
        var seriesPrices = new Map();
        if (index !== null) {
            var serieses = this._model.serieses();
            serieses.forEach(function (s) {
                // TODO: replace with search left
                var prices = s.dataAt(index);
                if (prices !== null) {
                    seriesPrices.set(s, prices);
                }
            });
        }
        var clientTime;
        if (index !== null) {
            var timePoint = this._model.timeScale().indexToTime(index);
            if (timePoint !== null) {
                clientTime = timePoint;
            }
        }
        var hoveredSource = this.model().hoveredSource();
        var hoveredSeries = hoveredSource !== null && hoveredSource.source instanceof Series
            ? hoveredSource.source
            : undefined;
        var hoveredObject = hoveredSource !== null && hoveredSource.object !== undefined
            ? hoveredSource.object.externalId
            : undefined;
        return {
            time: clientTime,
            point: point || undefined,
            hoveredSeries: hoveredSeries,
            seriesPrices: seriesPrices,
            hoveredObject: hoveredObject,
        };
    };
    ChartWidget.prototype._onPaneWidgetClicked = function (time, point) {
        var _this = this;
        this._clicked.fire(function () { return _this._getMouseEventParamsImpl(time, point); });
    };
    ChartWidget.prototype._onPaneWidgetCrosshairMoved = function (time, point) {
        var _this = this;
        this._crosshairMoved.fire(function () { return _this._getMouseEventParamsImpl(time, point); });
    };
    ChartWidget.prototype._updateTimeAxisVisibility = function () {
        var display = this._options.timeScale.visible ? '' : 'none';
        this._timeAxisWidget.getElement().style.display = display;
    };
    ChartWidget.prototype._isLeftAxisVisible = function () {
        return this._options.leftPriceScale.visible;
    };
    ChartWidget.prototype._isRightAxisVisible = function () {
        return this._options.rightPriceScale.visible;
    };
    return ChartWidget;
}());
export { ChartWidget };
function disableSelection(element) {
    element.style.userSelect = 'none';
    // eslint-disable-next-line deprecation/deprecation
    element.style.webkitUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.msUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.MozUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.webkitTapHighlightColor = 'transparent';
}
