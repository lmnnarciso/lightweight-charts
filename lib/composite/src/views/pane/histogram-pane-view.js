import { __extends } from "tslib";
import { ensureNotNull } from '../../helpers/assertions';
import { visibleTimedValues } from '../../model/time-data';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { PaneRendererHistogram } from '../../renderers/histogram-renderer';
import { SeriesPaneViewBase } from './series-pane-view-base';
function createEmptyHistogramData(barSpacing) {
    return {
        items: [],
        barSpacing: barSpacing,
        histogramBase: NaN,
        visibleRange: null,
    };
}
function createRawItem(time, price, color) {
    return {
        time: time,
        price: price,
        x: NaN,
        y: NaN,
        color: color,
    };
}
var SeriesHistogramPaneView = /** @class */ (function (_super) {
    __extends(SeriesHistogramPaneView, _super);
    function SeriesHistogramPaneView(series, model) {
        var _this = _super.call(this, series, model, false) || this;
        _this._compositeRenderer = new CompositeRenderer();
        _this._histogramData = createEmptyHistogramData(0);
        _this._renderer = new PaneRendererHistogram();
        return _this;
    }
    SeriesHistogramPaneView.prototype.renderer = function (height, width) {
        if (!this._series.visible()) {
            return null;
        }
        this._makeValid();
        return this._compositeRenderer;
    };
    SeriesHistogramPaneView.prototype._fillRawPoints = function () {
        var barSpacing = this._model.timeScale().barSpacing();
        this._histogramData = createEmptyHistogramData(barSpacing);
        var targetIndex = 0;
        var itemIndex = 0;
        var defaultColor = this._series.options().color;
        for (var _i = 0, _a = this._series.bars().rows(); _i < _a.length; _i++) {
            var row = _a[_i];
            var value = row.value[3 /* Close */];
            var color = row.color !== undefined ? row.color : defaultColor;
            var item = createRawItem(row.index, value, color);
            targetIndex++;
            if (targetIndex < this._histogramData.items.length) {
                this._histogramData.items[targetIndex] = item;
            }
            else {
                this._histogramData.items.push(item);
            }
            this._items[itemIndex++] = { time: row.index, x: 0 };
        }
        this._renderer.setData(this._histogramData);
        this._compositeRenderer.setRenderers([this._renderer]);
    };
    SeriesHistogramPaneView.prototype._updateOptions = function () { };
    SeriesHistogramPaneView.prototype._clearVisibleRange = function () {
        _super.prototype._clearVisibleRange.call(this);
        this._histogramData.visibleRange = null;
    };
    SeriesHistogramPaneView.prototype._convertToCoordinates = function (priceScale, timeScale, firstValue) {
        if (this._itemsVisibleRange === null) {
            return;
        }
        var barSpacing = timeScale.barSpacing();
        var visibleBars = ensureNotNull(timeScale.visibleStrictRange());
        var histogramBase = priceScale.priceToCoordinate(this._series.options().base, firstValue);
        timeScale.indexesToCoordinates(this._histogramData.items);
        priceScale.pointsArrayToCoordinates(this._histogramData.items, firstValue);
        this._histogramData.histogramBase = histogramBase;
        this._histogramData.visibleRange = visibleTimedValues(this._histogramData.items, visibleBars, false);
        this._histogramData.barSpacing = barSpacing;
        // need this to update cache
        this._renderer.setData(this._histogramData);
    };
    return SeriesHistogramPaneView;
}(SeriesPaneViewBase));
export { SeriesHistogramPaneView };
