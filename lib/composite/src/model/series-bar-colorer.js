import { __assign } from "tslib";
import { ensure, ensureNotNull } from '../helpers/assertions';
var emptyResult = {
    barColor: '',
    barBorderColor: '',
    barWickColor: '',
};
var SeriesBarColorer = /** @class */ (function () {
    function SeriesBarColorer(series) {
        this._series = series;
    }
    SeriesBarColorer.prototype.barStyle = function (barIndex, precomputedBars) {
        // precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
        // Used to avoid binary search if bars are already known
        var targetType = this._series.seriesType();
        var seriesOptions = this._series.options();
        switch (targetType) {
            case 'Line':
                return this._lineStyle(seriesOptions);
            case 'Area':
                return this._areaStyle(seriesOptions);
            case 'Bar':
                return this._barStyle(seriesOptions, barIndex, precomputedBars);
            case 'Candlestick':
                return this._candleStyle(seriesOptions, barIndex, precomputedBars);
            case 'Histogram':
                return this._histogramStyle(seriesOptions, barIndex, precomputedBars);
        }
        throw new Error('Unknown chart style');
    };
    SeriesBarColorer.prototype._barStyle = function (barStyle, barIndex, precomputedBars) {
        var result = __assign({}, emptyResult);
        var upColor = barStyle.upColor;
        var downColor = barStyle.downColor;
        var borderUpColor = upColor;
        var borderDownColor = downColor;
        var currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
        var isUp = ensure(currentBar.value[0 /* Open */]) <= ensure(currentBar.value[3 /* Close */]);
        result.barColor = isUp ? upColor : downColor;
        result.barBorderColor = isUp ? borderUpColor : borderDownColor;
        return result;
    };
    SeriesBarColorer.prototype._candleStyle = function (candlestickStyle, barIndex, precomputedBars) {
        var result = __assign({}, emptyResult);
        var upColor = candlestickStyle.upColor;
        var downColor = candlestickStyle.downColor;
        var borderUpColor = candlestickStyle.borderUpColor;
        var borderDownColor = candlestickStyle.borderDownColor;
        var wickUpColor = candlestickStyle.wickUpColor;
        var wickDownColor = candlestickStyle.wickDownColor;
        var currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
        var isUp = ensure(currentBar.value[0 /* Open */]) <= ensure(currentBar.value[3 /* Close */]);
        result.barColor = isUp ? upColor : downColor;
        result.barBorderColor = isUp ? borderUpColor : borderDownColor;
        result.barWickColor = isUp ? wickUpColor : wickDownColor;
        return result;
    };
    SeriesBarColorer.prototype._areaStyle = function (areaStyle) {
        return __assign(__assign({}, emptyResult), { barColor: areaStyle.lineColor });
    };
    SeriesBarColorer.prototype._lineStyle = function (lineStyle) {
        return __assign(__assign({}, emptyResult), { barColor: lineStyle.color });
    };
    SeriesBarColorer.prototype._histogramStyle = function (histogramStyle, barIndex, precomputedBars) {
        var result = __assign({}, emptyResult);
        var currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
        result.barColor = currentBar.color !== undefined ? currentBar.color : histogramStyle.color;
        return result;
    };
    SeriesBarColorer.prototype._findBar = function (barIndex, precomputedBars) {
        if (precomputedBars !== undefined) {
            return precomputedBars.value;
        }
        return this._series.bars().valueAt(barIndex);
    };
    return SeriesBarColorer;
}());
export { SeriesBarColorer };
