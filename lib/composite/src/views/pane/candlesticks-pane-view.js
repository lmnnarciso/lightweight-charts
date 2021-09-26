import { __assign, __extends } from "tslib";
import { PaneRendererCandlesticks, } from '../../renderers/candlesticks-renderer';
import { BarsPaneViewBase } from './bars-pane-view-base';
var SeriesCandlesticksPaneView = /** @class */ (function (_super) {
    __extends(SeriesCandlesticksPaneView, _super);
    function SeriesCandlesticksPaneView() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._renderer = new PaneRendererCandlesticks();
        return _this;
    }
    SeriesCandlesticksPaneView.prototype.renderer = function (height, width) {
        if (!this._series.visible()) {
            return null;
        }
        var candlestickStyleProps = this._series.options();
        this._makeValid();
        var data = {
            bars: this._items,
            barSpacing: this._model.timeScale().barSpacing(),
            wickVisible: candlestickStyleProps.wickVisible,
            borderVisible: candlestickStyleProps.borderVisible,
            visibleRange: this._itemsVisibleRange,
        };
        this._renderer.setData(data);
        return this._renderer;
    };
    SeriesCandlesticksPaneView.prototype._updateOptions = function () {
        var _this = this;
        this._items.forEach(function (item) {
            var style = _this._series.barColorer().barStyle(item.time);
            item.color = style.barColor;
            item.wickColor = style.barWickColor;
            item.borderColor = style.barBorderColor;
        });
    };
    SeriesCandlesticksPaneView.prototype._createRawItem = function (time, bar, colorer) {
        var style = colorer.barStyle(time);
        return __assign(__assign({}, this._createDefaultItem(time, bar, colorer)), { color: style.barColor, wickColor: style.barWickColor, borderColor: style.barBorderColor });
    };
    return SeriesCandlesticksPaneView;
}(BarsPaneViewBase));
export { SeriesCandlesticksPaneView };
