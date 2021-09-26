import { ensureNotNull } from '../helpers/assertions';
import { optimalBarWidth } from './optimal-bar-width';
var PaneRendererBars = /** @class */ (function () {
    function PaneRendererBars() {
        this._data = null;
        this._barWidth = 0;
        this._barLineWidth = 0;
    }
    PaneRendererBars.prototype.setData = function (data) {
        this._data = data;
    };
    // eslint-disable-next-line complexity
    PaneRendererBars.prototype.draw = function (ctx, pixelRatio, isHovered, hitTestData) {
        if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
            return;
        }
        this._barWidth = this._calcBarWidth(pixelRatio);
        // grid and crosshair have line width = Math.floor(pixelRatio)
        // if this value is odd, we have to make bars' width odd
        // if this value is even, we have to make bars' width even
        // in order of keeping crosshair-over-bar drawing symmetric
        if (this._barWidth >= 2) {
            var lineWidth = Math.max(1, Math.floor(pixelRatio));
            if ((lineWidth % 2) !== (this._barWidth % 2)) {
                this._barWidth--;
            }
        }
        // if scale is compressed, bar could become less than 1 CSS pixel
        this._barLineWidth = this._data.thinBars ? Math.min(this._barWidth, Math.floor(pixelRatio)) : this._barWidth;
        var prevColor = null;
        var drawOpenClose = this._barLineWidth <= this._barWidth && this._data.barSpacing >= Math.floor(1.5 * pixelRatio);
        for (var i = this._data.visibleRange.from; i < this._data.visibleRange.to; ++i) {
            var bar = this._data.bars[i];
            if (prevColor !== bar.color) {
                ctx.fillStyle = bar.color;
                prevColor = bar.color;
            }
            var bodyWidthHalf = Math.floor(this._barLineWidth * 0.5);
            var bodyCenter = Math.round(bar.x * pixelRatio);
            var bodyLeft = bodyCenter - bodyWidthHalf;
            var bodyWidth = this._barLineWidth;
            var bodyRight = bodyLeft + bodyWidth - 1;
            var high = Math.min(bar.highY, bar.lowY);
            var low = Math.max(bar.highY, bar.lowY);
            var bodyTop = Math.round(high * pixelRatio) - bodyWidthHalf;
            var bodyBottom = Math.round(low * pixelRatio) + bodyWidthHalf;
            var bodyHeight = Math.max((bodyBottom - bodyTop), this._barLineWidth);
            ctx.fillRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);
            var sideWidth = Math.ceil(this._barWidth * 1.5);
            if (drawOpenClose) {
                if (this._data.openVisible) {
                    var openLeft = bodyCenter - sideWidth;
                    var openTop = Math.max(bodyTop, Math.round(bar.openY * pixelRatio) - bodyWidthHalf);
                    var openBottom = openTop + bodyWidth - 1;
                    if (openBottom > bodyTop + bodyHeight - 1) {
                        openBottom = bodyTop + bodyHeight - 1;
                        openTop = openBottom - bodyWidth + 1;
                    }
                    ctx.fillRect(openLeft, openTop, bodyLeft - openLeft, openBottom - openTop + 1);
                }
                var closeRight = bodyCenter + sideWidth;
                var closeTop = Math.max(bodyTop, Math.round(bar.closeY * pixelRatio) - bodyWidthHalf);
                var closeBottom = closeTop + bodyWidth - 1;
                if (closeBottom > bodyTop + bodyHeight - 1) {
                    closeBottom = bodyTop + bodyHeight - 1;
                    closeTop = closeBottom - bodyWidth + 1;
                }
                ctx.fillRect(bodyRight + 1, closeTop, closeRight - bodyRight, closeBottom - closeTop + 1);
            }
        }
    };
    PaneRendererBars.prototype._calcBarWidth = function (pixelRatio) {
        var limit = Math.floor(pixelRatio);
        return Math.max(limit, Math.floor(optimalBarWidth(ensureNotNull(this._data).barSpacing, pixelRatio)));
    };
    return PaneRendererBars;
}());
export { PaneRendererBars };
