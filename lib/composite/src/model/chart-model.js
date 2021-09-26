/// <reference types="_build-time-constants" />
import { assert, ensureNotNull } from '../helpers/assertions';
import { gradientColorAtPercent } from '../helpers/color';
import { Delegate } from '../helpers/delegate';
import { merge } from '../helpers/strict-type-checks';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';
import { Crosshair } from './crosshair';
import { isDefaultPriceScale } from './default-price-scale';
import { InvalidateMask } from './invalidate-mask';
import { Magnet } from './magnet';
import { DEFAULT_STRETCH_FACTOR, Pane } from './pane';
import { Series } from './series';
import { TimeScale } from './time-scale';
import { Watermark } from './watermark';
var BackgroundColorSide;
(function (BackgroundColorSide) {
    BackgroundColorSide[BackgroundColorSide["Top"] = 0] = "Top";
    BackgroundColorSide[BackgroundColorSide["Bottom"] = 1] = "Bottom";
})(BackgroundColorSide || (BackgroundColorSide = {}));
var ChartModel = /** @class */ (function () {
    function ChartModel(invalidateHandler, options) {
        this._panes = [];
        this._serieses = [];
        this._width = 0;
        this._initialTimeScrollPos = null;
        this._hoveredSource = null;
        this._priceScalesOptionsChanged = new Delegate();
        this._crosshairMoved = new Delegate();
        this._gradientColorsCache = null;
        this._invalidateHandler = invalidateHandler;
        this._options = options;
        this._rendererOptionsProvider = new PriceAxisRendererOptionsProvider(this);
        this._timeScale = new TimeScale(this, options.timeScale, this._options.localization);
        this._crosshair = new Crosshair(this, options.crosshair);
        this._magnet = new Magnet(options.crosshair);
        this._watermark = new Watermark(this, options.watermark);
        this.createPane();
        this._panes[0].setStretchFactor(DEFAULT_STRETCH_FACTOR * 2);
        this._backgroundTopColor = this._getBackgroundColor(0 /* Top */);
        this._backgroundBottomColor = this._getBackgroundColor(1 /* Bottom */);
    }
    ChartModel.prototype.fullUpdate = function () {
        this._invalidate(new InvalidateMask(3 /* Full */));
    };
    ChartModel.prototype.lightUpdate = function () {
        this._invalidate(new InvalidateMask(2 /* Light */));
    };
    ChartModel.prototype.cursorUpdate = function () {
        this._invalidate(new InvalidateMask(1 /* Cursor */));
    };
    ChartModel.prototype.updateSource = function (source) {
        var inv = this._invalidationMaskForSource(source);
        this._invalidate(inv);
    };
    ChartModel.prototype.hoveredSource = function () {
        return this._hoveredSource;
    };
    ChartModel.prototype.setHoveredSource = function (source) {
        var prevSource = this._hoveredSource;
        this._hoveredSource = source;
        if (prevSource !== null) {
            this.updateSource(prevSource.source);
        }
        if (source !== null) {
            this.updateSource(source.source);
        }
    };
    ChartModel.prototype.options = function () {
        return this._options;
    };
    ChartModel.prototype.applyOptions = function (options) {
        merge(this._options, options);
        this._panes.forEach(function (p) { return p.applyScaleOptions(options); });
        if (options.timeScale !== undefined) {
            this._timeScale.applyOptions(options.timeScale);
        }
        if (options.localization !== undefined) {
            this._timeScale.applyLocalizationOptions(options.localization);
        }
        if (options.leftPriceScale || options.rightPriceScale) {
            this._priceScalesOptionsChanged.fire();
        }
        this._backgroundTopColor = this._getBackgroundColor(0 /* Top */);
        this._backgroundBottomColor = this._getBackgroundColor(1 /* Bottom */);
        this.fullUpdate();
    };
    ChartModel.prototype.applyPriceScaleOptions = function (priceScaleId, options) {
        var res = this.findPriceScale(priceScaleId);
        if (res === null) {
            if (process.env.NODE_ENV === 'development') {
                throw new Error("Trying to apply price scale options with incorrect ID: " + priceScaleId);
            }
            return;
        }
        res.priceScale.applyOptions(options);
        this._priceScalesOptionsChanged.fire();
    };
    ChartModel.prototype.findPriceScale = function (priceScaleId) {
        for (var _i = 0, _a = this._panes; _i < _a.length; _i++) {
            var pane = _a[_i];
            var priceScale = pane.priceScaleById(priceScaleId);
            if (priceScale !== null) {
                return {
                    pane: pane,
                    priceScale: priceScale,
                };
            }
        }
        return null;
    };
    ChartModel.prototype.timeScale = function () {
        return this._timeScale;
    };
    ChartModel.prototype.panes = function () {
        return this._panes;
    };
    ChartModel.prototype.watermarkSource = function () {
        return this._watermark;
    };
    ChartModel.prototype.crosshairSource = function () {
        return this._crosshair;
    };
    ChartModel.prototype.crosshairMoved = function () {
        return this._crosshairMoved;
    };
    ChartModel.prototype.setPaneHeight = function (pane, height) {
        pane.setHeight(height);
        this.recalculateAllPanes();
    };
    ChartModel.prototype.setWidth = function (width) {
        this._width = width;
        this._timeScale.setWidth(this._width);
        this._panes.forEach(function (pane) { return pane.setWidth(width); });
        this.recalculateAllPanes();
    };
    ChartModel.prototype.createPane = function (index) {
        var pane = new Pane(this._timeScale, this);
        if (index !== undefined) {
            this._panes.splice(index, 0, pane);
        }
        else {
            // adding to the end - common case
            this._panes.push(pane);
        }
        var actualIndex = (index === undefined) ? this._panes.length - 1 : index;
        // we always do autoscaling on the creation
        // if autoscale option is true, it is ok, just recalculate by invalidation mask
        // if autoscale option is false, autoscale anyway on the first draw
        // also there is a scenario when autoscale is true in constructor and false later on applyOptions
        var mask = new InvalidateMask(3 /* Full */);
        mask.invalidatePane(actualIndex, {
            level: 0 /* None */,
            autoScale: true,
        });
        this._invalidate(mask);
        return pane;
    };
    ChartModel.prototype.startScalePrice = function (pane, priceScale, x) {
        pane.startScalePrice(priceScale, x);
    };
    ChartModel.prototype.scalePriceTo = function (pane, priceScale, x) {
        pane.scalePriceTo(priceScale, x);
        this.updateCrosshair();
        this._invalidate(this._paneInvalidationMask(pane, 2 /* Light */));
    };
    ChartModel.prototype.endScalePrice = function (pane, priceScale) {
        pane.endScalePrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* Light */));
    };
    ChartModel.prototype.startScrollPrice = function (pane, priceScale, x) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.startScrollPrice(priceScale, x);
    };
    ChartModel.prototype.scrollPriceTo = function (pane, priceScale, x) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.scrollPriceTo(priceScale, x);
        this.updateCrosshair();
        this._invalidate(this._paneInvalidationMask(pane, 2 /* Light */));
    };
    ChartModel.prototype.endScrollPrice = function (pane, priceScale) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.endScrollPrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* Light */));
    };
    ChartModel.prototype.resetPriceScale = function (pane, priceScale) {
        pane.resetPriceScale(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* Light */));
    };
    ChartModel.prototype.startScaleTime = function (position) {
        this._timeScale.startScale(position);
    };
    /**
     * Zoom in/out the chart (depends on scale value).
     *
     * @param pointX - X coordinate of the point to apply the zoom (the point which should stay on its place)
     * @param scale - Zoom value. Negative value means zoom out, positive - zoom in.
     */
    ChartModel.prototype.zoomTime = function (pointX, scale) {
        var timeScale = this.timeScale();
        if (timeScale.isEmpty() || scale === 0) {
            return;
        }
        var timeScaleWidth = timeScale.width();
        pointX = Math.max(1, Math.min(pointX, timeScaleWidth));
        timeScale.zoom(pointX, scale);
        this.recalculateAllPanes();
    };
    ChartModel.prototype.scrollChart = function (x) {
        this.startScrollTime(0);
        this.scrollTimeTo(x);
        this.endScrollTime();
    };
    ChartModel.prototype.scaleTimeTo = function (x) {
        this._timeScale.scaleTo(x);
        this.recalculateAllPanes();
    };
    ChartModel.prototype.endScaleTime = function () {
        this._timeScale.endScale();
        this.lightUpdate();
    };
    ChartModel.prototype.startScrollTime = function (x) {
        this._initialTimeScrollPos = x;
        this._timeScale.startScroll(x);
    };
    ChartModel.prototype.scrollTimeTo = function (x) {
        var res = false;
        if (this._initialTimeScrollPos !== null && Math.abs(x - this._initialTimeScrollPos) > 20) {
            this._initialTimeScrollPos = null;
            res = true;
        }
        this._timeScale.scrollTo(x);
        this.recalculateAllPanes();
        return res;
    };
    ChartModel.prototype.endScrollTime = function () {
        this._timeScale.endScroll();
        this.lightUpdate();
        this._initialTimeScrollPos = null;
    };
    ChartModel.prototype.serieses = function () {
        return this._serieses;
    };
    ChartModel.prototype.setAndSaveCurrentPosition = function (x, y, pane) {
        this._crosshair.saveOriginCoord(x, y);
        var price = NaN;
        var index = this._timeScale.coordinateToIndex(x);
        var visibleBars = this._timeScale.visibleStrictRange();
        if (visibleBars !== null) {
            index = Math.min(Math.max(visibleBars.left(), index), visibleBars.right());
        }
        var priceScale = pane.defaultPriceScale();
        var firstValue = priceScale.firstValue();
        if (firstValue !== null) {
            price = priceScale.coordinateToPrice(y, firstValue);
        }
        price = this._magnet.align(price, index, pane);
        this._crosshair.setPosition(index, price, pane);
        this.cursorUpdate();
        this._crosshairMoved.fire(this._crosshair.appliedIndex(), { x: x, y: y });
    };
    ChartModel.prototype.clearCurrentPosition = function () {
        var crosshair = this.crosshairSource();
        crosshair.clearPosition();
        this.cursorUpdate();
        this._crosshairMoved.fire(null, null);
    };
    ChartModel.prototype.updateCrosshair = function () {
        // apply magnet
        var pane = this._crosshair.pane();
        if (pane !== null) {
            var x = this._crosshair.originCoordX();
            var y = this._crosshair.originCoordY();
            this.setAndSaveCurrentPosition(x, y, pane);
        }
        this._crosshair.updateAllViews();
    };
    ChartModel.prototype.updateTimeScale = function (newBaseIndex, newPoints) {
        var oldFirstTime = this._timeScale.indexToTime(0);
        if (newPoints !== undefined) {
            this._timeScale.update(newPoints);
        }
        var newFirstTime = this._timeScale.indexToTime(0);
        var currentBaseIndex = this._timeScale.baseIndex();
        var visibleBars = this._timeScale.visibleStrictRange();
        // if time scale cannot return current visible bars range (e.g. time scale has zero-width)
        // then we do not need to update right offset to shift visible bars range to have the same right offset as we have before new bar
        // (and actually we cannot)
        if (visibleBars !== null && oldFirstTime !== null && newFirstTime !== null) {
            var isLastSeriesBarVisible = visibleBars.contains(currentBaseIndex);
            var isLeftBarShiftToLeft = oldFirstTime.timestamp > newFirstTime.timestamp;
            var isSeriesPointsAdded = newBaseIndex !== null && newBaseIndex > currentBaseIndex;
            var isSeriesPointsAddedToRight = isSeriesPointsAdded && !isLeftBarShiftToLeft;
            var needShiftVisibleRangeOnNewBar = isLastSeriesBarVisible && this._timeScale.options().shiftVisibleRangeOnNewBar;
            if (isSeriesPointsAddedToRight && !needShiftVisibleRangeOnNewBar) {
                var compensationShift = newBaseIndex - currentBaseIndex;
                this._timeScale.setRightOffset(this._timeScale.rightOffset() - compensationShift);
            }
        }
        this._timeScale.setBaseIndex(newBaseIndex);
    };
    ChartModel.prototype.recalculatePane = function (pane) {
        if (pane !== null) {
            pane.recalculate();
        }
    };
    ChartModel.prototype.paneForSource = function (source) {
        var pane = this._panes.find(function (p) { return p.orderedSources().includes(source); });
        return pane === undefined ? null : pane;
    };
    ChartModel.prototype.recalculateAllPanes = function () {
        this._watermark.updateAllViews();
        this._panes.forEach(function (p) { return p.recalculate(); });
        this.updateCrosshair();
    };
    ChartModel.prototype.destroy = function () {
        this._panes.forEach(function (p) { return p.destroy(); });
        this._panes.length = 0;
        // to avoid memleaks
        this._options.localization.priceFormatter = undefined;
        this._options.localization.timeFormatter = undefined;
    };
    ChartModel.prototype.rendererOptionsProvider = function () {
        return this._rendererOptionsProvider;
    };
    ChartModel.prototype.priceAxisRendererOptions = function () {
        return this._rendererOptionsProvider.options();
    };
    ChartModel.prototype.priceScalesOptionsChanged = function () {
        return this._priceScalesOptionsChanged;
    };
    ChartModel.prototype.createSeries = function (seriesType, options) {
        var pane = this._panes[0];
        var series = this._createSeries(options, seriesType, pane);
        this._serieses.push(series);
        if (this._serieses.length === 1) {
            // call fullUpdate to recalculate chart's parts geometry
            this.fullUpdate();
        }
        else {
            this.lightUpdate();
        }
        return series;
    };
    ChartModel.prototype.removeSeries = function (series) {
        var pane = this.paneForSource(series);
        var seriesIndex = this._serieses.indexOf(series);
        assert(seriesIndex !== -1, 'Series not found');
        this._serieses.splice(seriesIndex, 1);
        ensureNotNull(pane).removeDataSource(series);
        if (series.destroy) {
            series.destroy();
        }
    };
    ChartModel.prototype.moveSeriesToScale = function (series, targetScaleId) {
        var pane = ensureNotNull(this.paneForSource(series));
        pane.removeDataSource(series);
        // check if targetScaleId exists
        var target = this.findPriceScale(targetScaleId);
        if (target === null) {
            // new scale on the same pane
            var zOrder = series.zorder();
            pane.addDataSource(series, targetScaleId, zOrder);
        }
        else {
            // if move to the new scale of the same pane, keep zorder
            // if move to new pane
            var zOrder = (target.pane === pane) ? series.zorder() : undefined;
            target.pane.addDataSource(series, targetScaleId, zOrder);
        }
    };
    ChartModel.prototype.fitContent = function () {
        var mask = new InvalidateMask(2 /* Light */);
        mask.setFitContent();
        this._invalidate(mask);
    };
    ChartModel.prototype.setTargetLogicalRange = function (range) {
        var mask = new InvalidateMask(2 /* Light */);
        mask.applyRange(range);
        this._invalidate(mask);
    };
    ChartModel.prototype.resetTimeScale = function () {
        var mask = new InvalidateMask(2 /* Light */);
        mask.resetTimeScale();
        this._invalidate(mask);
    };
    ChartModel.prototype.setBarSpacing = function (spacing) {
        var mask = new InvalidateMask(2 /* Light */);
        mask.setBarSpacing(spacing);
        this._invalidate(mask);
    };
    ChartModel.prototype.setRightOffset = function (offset) {
        var mask = new InvalidateMask(2 /* Light */);
        mask.setRightOffset(offset);
        this._invalidate(mask);
    };
    ChartModel.prototype.defaultVisiblePriceScaleId = function () {
        return this._options.rightPriceScale.visible ? "right" /* Right */ : "left" /* Left */;
    };
    ChartModel.prototype.backgroundBottomColor = function () {
        return this._backgroundBottomColor;
    };
    ChartModel.prototype.backgroundTopColor = function () {
        return this._backgroundTopColor;
    };
    ChartModel.prototype.backgroundColorAtYPercentFromTop = function (percent) {
        var bottomColor = this._backgroundBottomColor;
        var topColor = this._backgroundTopColor;
        if (bottomColor === topColor) {
            // solid background
            return bottomColor;
        }
        // gradient background
        // percent should be from 0 to 100 (we're using only integer values to make cache more efficient)
        percent = Math.max(0, Math.min(100, Math.round(percent * 100)));
        if (this._gradientColorsCache === null ||
            this._gradientColorsCache.topColor !== topColor || this._gradientColorsCache.bottomColor !== bottomColor) {
            this._gradientColorsCache = {
                topColor: topColor,
                bottomColor: bottomColor,
                colors: new Map(),
            };
        }
        else {
            var cachedValue = this._gradientColorsCache.colors.get(percent);
            if (cachedValue !== undefined) {
                return cachedValue;
            }
        }
        var result = gradientColorAtPercent(topColor, bottomColor, percent / 100);
        this._gradientColorsCache.colors.set(percent, result);
        return result;
    };
    ChartModel.prototype._paneInvalidationMask = function (pane, level) {
        var inv = new InvalidateMask(level);
        if (pane !== null) {
            var index = this._panes.indexOf(pane);
            inv.invalidatePane(index, {
                level: level,
            });
        }
        return inv;
    };
    ChartModel.prototype._invalidationMaskForSource = function (source, invalidateType) {
        if (invalidateType === undefined) {
            invalidateType = 2 /* Light */;
        }
        return this._paneInvalidationMask(this.paneForSource(source), invalidateType);
    };
    ChartModel.prototype._invalidate = function (mask) {
        if (this._invalidateHandler) {
            this._invalidateHandler(mask);
        }
        this._panes.forEach(function (pane) { return pane.grid().paneView().update(); });
    };
    ChartModel.prototype._createSeries = function (options, seriesType, pane) {
        var series = new Series(this, options, seriesType);
        var targetScaleId = options.priceScaleId !== undefined ? options.priceScaleId : this.defaultVisiblePriceScaleId();
        pane.addDataSource(series, targetScaleId);
        if (!isDefaultPriceScale(targetScaleId)) {
            // let's apply that options again to apply margins
            series.applyOptions(options);
        }
        return series;
    };
    ChartModel.prototype._getBackgroundColor = function (side) {
        var layoutOptions = this._options.layout;
        if (layoutOptions.background.type === "gradient" /* VerticalGradient */) {
            return side === 0 /* Top */ ?
                layoutOptions.background.topColor :
                layoutOptions.background.bottomColor;
        }
        return layoutOptions.background.color;
    };
    return ChartModel;
}());
export { ChartModel };
