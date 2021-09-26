import { __assign, __extends } from "tslib";
import { PaneRendererBars, } from '../../renderers/bars-renderer';
import { BarsPaneViewBase } from './bars-pane-view-base';
var SeriesBarsPaneView = /** @class */ (function (_super) {
    __extends(SeriesBarsPaneView, _super);
    function SeriesBarsPaneView() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._renderer = new PaneRendererBars();
        return _this;
    }
    SeriesBarsPaneView.prototype.renderer = function (height, width) {
        if (!this._series.visible()) {
            return null;
        }
        var barStyleProps = this._series.options();
        this._makeValid();
        var data = {
            bars: this._items,
            barSpacing: this._model.timeScale().barSpacing(),
            openVisible: barStyleProps.openVisible,
            thinBars: barStyleProps.thinBars,
            visibleRange: this._itemsVisibleRange,
        };
        this._renderer.setData(data);
        return this._renderer;
    };
    SeriesBarsPaneView.prototype._updateOptions = function () {
        var _this = this;
        this._items.forEach(function (item) {
            item.color = _this._series.barColorer().barStyle(item.time).barColor;
        });
    };
    SeriesBarsPaneView.prototype._createRawItem = function (time, bar, colorer) {
        return __assign(__assign({}, this._createDefaultItem(time, bar, colorer)), { color: colorer.barStyle(time).barColor });
    };
    return SeriesBarsPaneView;
}(BarsPaneViewBase));
export { SeriesBarsPaneView };
