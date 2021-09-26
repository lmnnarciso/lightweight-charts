import { __assign, __extends, __spreadArray } from "tslib";
import { PercentageFormatter } from '../formatters/percentage-formatter';
import { PriceFormatter } from '../formatters/price-formatter';
import { VolumeFormatter } from '../formatters/volume-formatter';
import { ensureNotNull } from '../helpers/assertions';
import { isInteger, merge } from '../helpers/strict-type-checks';
import { SeriesAreaPaneView } from '../views/pane/area-pane-view';
import { SeriesBarsPaneView } from '../views/pane/bars-pane-view';
import { SeriesCandlesticksPaneView } from '../views/pane/candlesticks-pane-view';
import { SeriesHistogramPaneView } from '../views/pane/histogram-pane-view';
import { SeriesLinePaneView } from '../views/pane/line-pane-view';
import { PanePriceAxisView } from '../views/pane/pane-price-axis-view';
import { SeriesHorizontalBaseLinePaneView } from '../views/pane/series-horizontal-base-line-pane-view';
import { SeriesLastPriceAnimationPaneView } from '../views/pane/series-last-price-animation-pane-view';
import { SeriesMarkersPaneView } from '../views/pane/series-markers-pane-view';
import { SeriesPriceLinePaneView } from '../views/pane/series-price-line-pane-view';
import { SeriesPriceAxisView } from '../views/price-axis/series-price-axis-view';
import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { CustomPriceLine } from './custom-price-line';
import { isDefaultPriceScale } from './default-price-scale';
import { PriceDataSource } from './price-data-source';
import { PriceRangeImpl } from './price-range-impl';
import { SeriesBarColorer } from './series-bar-colorer';
import { createSeriesPlotList } from './series-data';
var Series = /** @class */ (function (_super) {
    __extends(Series, _super);
    function Series(model, options, seriesType) {
        var _this = _super.call(this, model) || this;
        _this._data = createSeriesPlotList();
        _this._priceLineView = new SeriesPriceLinePaneView(_this);
        _this._customPriceLines = [];
        _this._baseHorizontalLineView = new SeriesHorizontalBaseLinePaneView(_this);
        _this._lastPriceAnimationPaneView = null;
        _this._barColorerCache = null;
        _this._markers = [];
        _this._indexedMarkers = [];
        _this._animationTimeoutId = null;
        _this._options = options;
        _this._seriesType = seriesType;
        var priceAxisView = new SeriesPriceAxisView(_this);
        _this._priceAxisViews = [priceAxisView];
        _this._panePriceAxisView = new PanePriceAxisView(priceAxisView, _this, model);
        if (seriesType === 'Area' || seriesType === 'Line') {
            _this._lastPriceAnimationPaneView = new SeriesLastPriceAnimationPaneView(_this);
        }
        _this._recreateFormatter();
        _this._recreatePaneViews();
        return _this;
    }
    Series.prototype.destroy = function () {
        if (this._animationTimeoutId !== null) {
            clearTimeout(this._animationTimeoutId);
        }
    };
    Series.prototype.priceLineColor = function (lastBarColor) {
        return this._options.priceLineColor || lastBarColor;
    };
    // returns object with:
    // formatted price
    // raw price (if withRawPrice)
    // coordinate
    // color
    // or { "noData":true } if last value could not be found
    // NOTE: should NEVER return null or undefined!
    Series.prototype.lastValueData = function (globalLast, withRawPrice) {
        var noDataRes = { noData: true };
        var priceScale = this.priceScale();
        if (this.model().timeScale().isEmpty() || priceScale.isEmpty() || this._data.isEmpty()) {
            return noDataRes;
        }
        var visibleBars = this.model().timeScale().visibleStrictRange();
        var firstValue = this.firstValue();
        if (visibleBars === null || firstValue === null) {
            return noDataRes;
        }
        // find range of bars inside range
        // TODO: make it more optimal
        var bar;
        var lastIndex;
        if (globalLast) {
            var lastBar = this._data.last();
            if (lastBar === null) {
                return noDataRes;
            }
            bar = lastBar;
            lastIndex = lastBar.index;
        }
        else {
            var endBar = this._data.search(visibleBars.right(), -1 /* NearestLeft */);
            if (endBar === null) {
                return noDataRes;
            }
            bar = this._data.valueAt(endBar.index);
            if (bar === null) {
                return noDataRes;
            }
            lastIndex = endBar.index;
        }
        var price = bar.value[3 /* Close */];
        var barColorer = this.barColorer();
        var style = barColorer.barStyle(lastIndex, { value: bar });
        var coordinate = priceScale.priceToCoordinate(price, firstValue.value);
        return {
            noData: false,
            price: withRawPrice ? price : undefined,
            text: priceScale.formatPrice(price, firstValue.value),
            formattedPriceAbsolute: priceScale.formatPriceAbsolute(price),
            formattedPricePercentage: priceScale.formatPricePercentage(price, firstValue.value),
            color: style.barColor,
            coordinate: coordinate,
            index: lastIndex,
        };
    };
    Series.prototype.barColorer = function () {
        if (this._barColorerCache !== null) {
            return this._barColorerCache;
        }
        this._barColorerCache = new SeriesBarColorer(this);
        return this._barColorerCache;
    };
    Series.prototype.options = function () {
        return this._options;
    };
    Series.prototype.applyOptions = function (options) {
        var targetPriceScaleId = options.priceScaleId;
        if (targetPriceScaleId !== undefined && targetPriceScaleId !== this._options.priceScaleId) {
            // series cannot do it itself, ask model
            this.model().moveSeriesToScale(this, targetPriceScaleId);
        }
        merge(this._options, options);
        // eslint-disable-next-line deprecation/deprecation
        if (this._priceScale !== null && options.scaleMargins !== undefined) {
            this._priceScale.applyOptions({
                // eslint-disable-next-line deprecation/deprecation
                scaleMargins: options.scaleMargins,
            });
        }
        if (options.priceFormat !== undefined) {
            this._recreateFormatter();
        }
        this.model().updateSource(this);
        // a series might affect crosshair by some options (like crosshair markers)
        // that's why we need to update crosshair as well
        this.model().updateCrosshair();
        this._paneView.update('options');
    };
    Series.prototype.clearData = function () {
        this._data.clear();
        // we must either re-create pane view on clear data
        // or clear all caches inside pane views
        // but currently we can't separate update/append last bar and full data replacement (update vs setData) in pane views invalidation
        // so let's just re-create all views
        this._recreatePaneViews();
    };
    Series.prototype.updateData = function (data, clearData) {
        var _a;
        if (clearData) {
            this._data.clear();
        }
        this._data.merge(data);
        this._recalculateMarkers();
        this._paneView.update('data');
        this._markersPaneView.update('data');
        (_a = this._lastPriceAnimationPaneView) === null || _a === void 0 ? void 0 : _a.update('data');
        var sourcePane = this.model().paneForSource(this);
        this.model().recalculatePane(sourcePane);
        this.model().updateSource(this);
        this.model().updateCrosshair();
        this.model().lightUpdate();
    };
    Series.prototype.setMarkers = function (data) {
        this._markers = data.map(function (item) { return (__assign({}, item)); });
        this._recalculateMarkers();
        var sourcePane = this.model().paneForSource(this);
        this._markersPaneView.update('data');
        this.model().recalculatePane(sourcePane);
        this.model().updateSource(this);
        this.model().updateCrosshair();
        this.model().lightUpdate();
    };
    Series.prototype.indexedMarkers = function () {
        return this._indexedMarkers;
    };
    Series.prototype.createPriceLine = function (options) {
        var result = new CustomPriceLine(this, options);
        this._customPriceLines.push(result);
        this.model().updateSource(this);
        return result;
    };
    Series.prototype.removePriceLine = function (line) {
        var index = this._customPriceLines.indexOf(line);
        if (index !== -1) {
            this._customPriceLines.splice(index, 1);
        }
        this.model().updateSource(this);
    };
    Series.prototype.seriesType = function () {
        return this._seriesType;
    };
    Series.prototype.firstValue = function () {
        var bar = this.firstBar();
        if (bar === null) {
            return null;
        }
        return {
            value: bar.value[3 /* Close */],
            timePoint: bar.time,
        };
    };
    Series.prototype.firstBar = function () {
        var visibleBars = this.model().timeScale().visibleStrictRange();
        if (visibleBars === null) {
            return null;
        }
        var startTimePoint = visibleBars.left();
        return this._data.search(startTimePoint, 1 /* NearestRight */);
    };
    Series.prototype.bars = function () {
        return this._data;
    };
    Series.prototype.dataAt = function (time) {
        var prices = this._data.valueAt(time);
        if (prices === null) {
            return null;
        }
        if (this._seriesType === 'Bar' || this._seriesType === 'Candlestick') {
            return {
                open: prices.value[0 /* Open */],
                high: prices.value[1 /* High */],
                low: prices.value[2 /* Low */],
                close: prices.value[3 /* Close */],
            };
        }
        else {
            return prices.value[3 /* Close */];
        }
    };
    Series.prototype.topPaneViews = function (pane) {
        var _this = this;
        var animationPaneView = this._lastPriceAnimationPaneView;
        if (animationPaneView === null || !animationPaneView.visible()) {
            return [];
        }
        if (this._animationTimeoutId === null && animationPaneView.animationActive()) {
            this._animationTimeoutId = setTimeout(function () {
                _this._animationTimeoutId = null;
                _this.model().cursorUpdate();
            }, 0);
        }
        animationPaneView.invalidateStage();
        return [animationPaneView];
    };
    Series.prototype.paneViews = function () {
        var res = [];
        if (!this._isOverlay()) {
            res.push(this._baseHorizontalLineView);
        }
        for (var _i = 0, _a = this._customPriceLines; _i < _a.length; _i++) {
            var customPriceLine = _a[_i];
            res.push.apply(res, customPriceLine.paneViews());
        }
        res.push(this._paneView, this._priceLineView, this._panePriceAxisView, this._markersPaneView);
        return res;
    };
    Series.prototype.priceAxisViews = function (pane, priceScale) {
        if (priceScale !== this._priceScale && !this._isOverlay()) {
            return [];
        }
        var result = __spreadArray([], this._priceAxisViews, true);
        for (var _i = 0, _a = this._customPriceLines; _i < _a.length; _i++) {
            var customPriceLine = _a[_i];
            result.push(customPriceLine.priceAxisView());
        }
        return result;
    };
    Series.prototype.autoscaleInfo = function (startTimePoint, endTimePoint) {
        var _this = this;
        if (this._options.autoscaleInfoProvider !== undefined) {
            var autoscaleInfo = this._options.autoscaleInfoProvider(function () {
                var res = _this._autoscaleInfoImpl(startTimePoint, endTimePoint);
                return (res === null) ? null : res.toRaw();
            });
            return AutoscaleInfoImpl.fromRaw(autoscaleInfo);
        }
        return this._autoscaleInfoImpl(startTimePoint, endTimePoint);
    };
    Series.prototype.minMove = function () {
        return this._options.priceFormat.minMove;
    };
    Series.prototype.formatter = function () {
        return this._formatter;
    };
    Series.prototype.updateAllViews = function () {
        var _a;
        this._paneView.update();
        this._markersPaneView.update();
        for (var _i = 0, _b = this._priceAxisViews; _i < _b.length; _i++) {
            var priceAxisView = _b[_i];
            priceAxisView.update();
        }
        for (var _c = 0, _d = this._customPriceLines; _c < _d.length; _c++) {
            var customPriceLine = _d[_c];
            customPriceLine.update();
        }
        this._priceLineView.update();
        this._baseHorizontalLineView.update();
        (_a = this._lastPriceAnimationPaneView) === null || _a === void 0 ? void 0 : _a.update();
    };
    Series.prototype.priceScale = function () {
        return ensureNotNull(this._priceScale);
    };
    Series.prototype.markerDataAtIndex = function (index) {
        var getValue = (this._seriesType === 'Line' || this._seriesType === 'Area') &&
            this._options.crosshairMarkerVisible;
        if (!getValue) {
            return null;
        }
        var bar = this._data.valueAt(index);
        if (bar === null) {
            return null;
        }
        var price = bar.value[3 /* Close */];
        var radius = this._markerRadius();
        var borderColor = this._markerBorderColor();
        var backgroundColor = this._markerBackgroundColor(index);
        return { price: price, radius: radius, borderColor: borderColor, backgroundColor: backgroundColor };
    };
    Series.prototype.title = function () {
        return this._options.title;
    };
    Series.prototype.visible = function () {
        return this._options.visible;
    };
    Series.prototype._isOverlay = function () {
        var priceScale = this.priceScale();
        return !isDefaultPriceScale(priceScale.id());
    };
    Series.prototype._autoscaleInfoImpl = function (startTimePoint, endTimePoint) {
        if (!isInteger(startTimePoint) || !isInteger(endTimePoint) || this._data.isEmpty()) {
            return null;
        }
        // TODO: refactor this
        // series data is strongly hardcoded to keep bars
        var plots = this._seriesType === 'Line' || this._seriesType === 'Area' || this._seriesType === 'Histogram'
            ? [3 /* Close */]
            : [2 /* Low */, 1 /* High */];
        var barsMinMax = this._data.minMaxOnRangeCached(startTimePoint, endTimePoint, plots);
        var range = barsMinMax !== null ? new PriceRangeImpl(barsMinMax.min, barsMinMax.max) : null;
        if (this.seriesType() === 'Histogram') {
            var base = this._options.base;
            var rangeWithBase = new PriceRangeImpl(base, base);
            range = range !== null ? range.merge(rangeWithBase) : rangeWithBase;
        }
        return new AutoscaleInfoImpl(range, this._markersPaneView.autoScaleMargins());
    };
    Series.prototype._markerRadius = function () {
        switch (this._seriesType) {
            case 'Line':
            case 'Area':
                return this._options.crosshairMarkerRadius;
        }
        return 0;
    };
    Series.prototype._markerBorderColor = function () {
        switch (this._seriesType) {
            case 'Line':
            case 'Area': {
                var crosshairMarkerBorderColor = this._options.crosshairMarkerBorderColor;
                if (crosshairMarkerBorderColor.length !== 0) {
                    return crosshairMarkerBorderColor;
                }
            }
        }
        return null;
    };
    Series.prototype._markerBackgroundColor = function (index) {
        switch (this._seriesType) {
            case 'Line':
            case 'Area': {
                var crosshairMarkerBackgroundColor = this._options.crosshairMarkerBackgroundColor;
                if (crosshairMarkerBackgroundColor.length !== 0) {
                    return crosshairMarkerBackgroundColor;
                }
            }
        }
        return this.barColorer().barStyle(index).barColor;
    };
    Series.prototype._recreateFormatter = function () {
        switch (this._options.priceFormat.type) {
            case 'custom': {
                this._formatter = { format: this._options.priceFormat.formatter };
                break;
            }
            case 'volume': {
                this._formatter = new VolumeFormatter(this._options.priceFormat.precision);
                break;
            }
            case 'percent': {
                this._formatter = new PercentageFormatter(this._options.priceFormat.precision);
                break;
            }
            default: {
                var priceScale = Math.pow(10, this._options.priceFormat.precision);
                this._formatter = new PriceFormatter(priceScale, this._options.priceFormat.minMove * priceScale);
            }
        }
        if (this._priceScale !== null) {
            this._priceScale.updateFormatter();
        }
    };
    Series.prototype._recalculateMarkers = function () {
        var _this = this;
        var timeScale = this.model().timeScale();
        if (timeScale.isEmpty() || this._data.size() === 0) {
            this._indexedMarkers = [];
            return;
        }
        var firstDataIndex = ensureNotNull(this._data.firstIndex());
        this._indexedMarkers = this._markers.map(function (marker, index) {
            // the first find index on the time scale (across all series)
            var timePointIndex = ensureNotNull(timeScale.timeToIndex(marker.time, true));
            // and then search that index inside the series data
            var searchMode = timePointIndex < firstDataIndex ? 1 /* NearestRight */ : -1 /* NearestLeft */;
            var seriesDataIndex = ensureNotNull(_this._data.search(timePointIndex, searchMode)).index;
            return {
                time: seriesDataIndex,
                position: marker.position,
                shape: marker.shape,
                color: marker.color,
                id: marker.id,
                internalId: index,
                text: marker.text,
                size: marker.size,
            };
        });
    };
    Series.prototype._recreatePaneViews = function () {
        this._markersPaneView = new SeriesMarkersPaneView(this, this.model());
        switch (this._seriesType) {
            case 'Bar': {
                this._paneView = new SeriesBarsPaneView(this, this.model());
                break;
            }
            case 'Candlestick': {
                this._paneView = new SeriesCandlesticksPaneView(this, this.model());
                break;
            }
            case 'Line': {
                this._paneView = new SeriesLinePaneView(this, this.model());
                break;
            }
            case 'Area': {
                this._paneView = new SeriesAreaPaneView(this, this.model());
                break;
            }
            case 'Histogram': {
                this._paneView = new SeriesHistogramPaneView(this, this.model());
                break;
            }
            default: throw Error('Unknown chart style assigned: ' + this._seriesType);
        }
    };
    return Series;
}(PriceDataSource));
export { Series };
