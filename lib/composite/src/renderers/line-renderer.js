import { __extends } from "tslib";
import { setLineStyle } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';
var PaneRendererLine = /** @class */ (function (_super) {
    __extends(PaneRendererLine, _super);
    function PaneRendererLine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._data = null;
        return _this;
    }
    PaneRendererLine.prototype.setData = function (data) {
        this._data = data;
    };
    PaneRendererLine.prototype._drawImpl = function (ctx) {
        if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
            return;
        }
        ctx.lineCap = 'butt';
        ctx.lineWidth = this._data.lineWidth;
        setLineStyle(ctx, this._data.lineStyle);
        ctx.strokeStyle = this._data.lineColor;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (this._data.items.length === 1) {
            var point = this._data.items[0];
            ctx.moveTo(point.x - this._data.barWidth / 2, point.y);
            ctx.lineTo(point.x + this._data.barWidth / 2, point.y);
        }
        else {
            walkLine(ctx, this._data.items, this._data.lineType, this._data.visibleRange);
        }
        ctx.stroke();
    };
    return PaneRendererLine;
}(ScaledRenderer));
export { PaneRendererLine };
