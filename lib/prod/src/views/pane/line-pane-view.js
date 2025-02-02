import { __extends } from "tslib";
import { PaneRendererLine } from '../../renderers/line-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
var SeriesLinePaneView = /** @class */ (function (_super) {
    __extends(SeriesLinePaneView, _super);
    // eslint-disable-next-line no-useless-constructor
    function SeriesLinePaneView(series, model) {
        var _this = _super.call(this, series, model) || this;
        _this._private__lineRenderer = new PaneRendererLine();
        return _this;
    }
    SeriesLinePaneView.prototype._internal_renderer = function (height, width) {
        if (!this._internal__series._internal_visible()) {
            return null;
        }
        var lineStyleProps = this._internal__series._internal_options();
        this._internal__makeValid();
        var data = {
            _internal_items: this._internal__items,
            _internal_lineColor: lineStyleProps.color,
            _internal_lineStyle: lineStyleProps.lineStyle,
            _internal_lineType: lineStyleProps.lineType,
            _internal_lineWidth: lineStyleProps.lineWidth,
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_barWidth: this._internal__model._internal_timeScale()._internal_barSpacing(),
        };
        this._private__lineRenderer._internal_setData(data);
        return this._private__lineRenderer;
    };
    SeriesLinePaneView.prototype._internal__createRawItem = function (time, price) {
        return this._internal__createRawItemBase(time, price);
    };
    return SeriesLinePaneView;
}(LinePaneViewBase));
export { SeriesLinePaneView };
