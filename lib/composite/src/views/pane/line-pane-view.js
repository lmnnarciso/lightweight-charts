import { __extends } from "tslib";
import { PaneRendererLine } from '../../renderers/line-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
var SeriesLinePaneView = /** @class */ (function (_super) {
    __extends(SeriesLinePaneView, _super);
    // eslint-disable-next-line no-useless-constructor
    function SeriesLinePaneView(series, model) {
        var _this = _super.call(this, series, model) || this;
        _this._lineRenderer = new PaneRendererLine();
        return _this;
    }
    SeriesLinePaneView.prototype.renderer = function (height, width) {
        if (!this._series.visible()) {
            return null;
        }
        var lineStyleProps = this._series.options();
        this._makeValid();
        var data = {
            items: this._items,
            lineColor: lineStyleProps.color,
            lineStyle: lineStyleProps.lineStyle,
            lineType: lineStyleProps.lineType,
            lineWidth: lineStyleProps.lineWidth,
            visibleRange: this._itemsVisibleRange,
            barWidth: this._model.timeScale().barSpacing(),
        };
        this._lineRenderer.setData(data);
        return this._lineRenderer;
    };
    SeriesLinePaneView.prototype._createRawItem = function (time, price) {
        return this._createRawItemBase(time, price);
    };
    return SeriesLinePaneView;
}(LinePaneViewBase));
export { SeriesLinePaneView };
