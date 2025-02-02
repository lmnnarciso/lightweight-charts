import { fillRectInnerBorder } from '../helpers/canvas-helpers';
import { optimalCandlestickWidth } from './optimal-bar-width';
var Constants;
(function (Constants) {
    Constants[Constants["BarBorderWidth"] = 1] = "BarBorderWidth";
})(Constants || (Constants = {}));
var PaneRendererCandlesticks = /** @class */ (function () {
    function PaneRendererCandlesticks() {
        this._data = null;
        // scaled with pixelRatio
        this._barWidth = 0;
    }
    PaneRendererCandlesticks.prototype.setData = function (data) {
        this._data = data;
    };
    PaneRendererCandlesticks.prototype.draw = function (ctx, pixelRatio, isHovered, hitTestData) {
        if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
            return;
        }
        // now we know pixelRatio and we could calculate barWidth effectively
        this._barWidth = optimalCandlestickWidth(this._data.barSpacing, pixelRatio);
        // grid and crosshair have line width = Math.floor(pixelRatio)
        // if this value is odd, we have to make candlesticks' width odd
        // if this value is even, we have to make candlesticks' width even
        // in order of keeping crosshair-over-candlesticks drawing symmetric
        if (this._barWidth >= 2) {
            var wickWidth = Math.floor(pixelRatio);
            if ((wickWidth % 2) !== (this._barWidth % 2)) {
                this._barWidth--;
            }
        }
        var bars = this._data.bars;
        if (this._data.wickVisible) {
            this._drawWicks(ctx, bars, this._data.visibleRange, pixelRatio);
        }
        if (this._data.borderVisible) {
            this._drawBorder(ctx, bars, this._data.visibleRange, this._data.barSpacing, pixelRatio);
        }
        var borderWidth = this._calculateBorderWidth(pixelRatio);
        if (!this._data.borderVisible || this._barWidth > borderWidth * 2) {
            this._drawCandles(ctx, bars, this._data.visibleRange, pixelRatio);
        }
    };
    PaneRendererCandlesticks.prototype._drawWicks = function (ctx, bars, visibleRange, pixelRatio) {
        if (this._data === null) {
            return;
        }
        var prevWickColor = '';
        var wickWidth = Math.min(Math.floor(pixelRatio), Math.floor(this._data.barSpacing * pixelRatio));
        wickWidth = Math.max(Math.floor(pixelRatio), Math.min(wickWidth, this._barWidth));
        var wickOffset = Math.floor(wickWidth * 0.5);
        var prevEdge = null;
        for (var i = visibleRange.from; i < visibleRange.to; i++) {
            var bar = bars[i];
            if (bar.wickColor !== prevWickColor) {
                ctx.fillStyle = bar.wickColor;
                prevWickColor = bar.wickColor;
            }
            var top_1 = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
            var bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);
            var high = Math.round(bar.highY * pixelRatio);
            var low = Math.round(bar.lowY * pixelRatio);
            var scaledX = Math.round(pixelRatio * bar.x);
            var left = scaledX - wickOffset;
            var right = left + wickWidth - 1;
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            var width = right - left + 1;
            ctx.fillRect(left, high, width, top_1 - high);
            ctx.fillRect(left, bottom + 1, width, low - bottom);
            prevEdge = right;
        }
    };
    PaneRendererCandlesticks.prototype._calculateBorderWidth = function (pixelRatio) {
        var borderWidth = Math.floor(1 /* BarBorderWidth */ * pixelRatio);
        if (this._barWidth <= 2 * borderWidth) {
            borderWidth = Math.floor((this._barWidth - 1) * 0.5);
        }
        var res = Math.max(Math.floor(pixelRatio), borderWidth);
        if (this._barWidth <= res * 2) {
            // do not draw bodies, restore original value
            return Math.max(Math.floor(pixelRatio), Math.floor(1 /* BarBorderWidth */ * pixelRatio));
        }
        return res;
    };
    PaneRendererCandlesticks.prototype._drawBorder = function (ctx, bars, visibleRange, barSpacing, pixelRatio) {
        if (this._data === null) {
            return;
        }
        var prevBorderColor = '';
        var borderWidth = this._calculateBorderWidth(pixelRatio);
        var prevEdge = null;
        for (var i = visibleRange.from; i < visibleRange.to; i++) {
            var bar = bars[i];
            if (bar.borderColor !== prevBorderColor) {
                ctx.fillStyle = bar.borderColor;
                prevBorderColor = bar.borderColor;
            }
            var left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
            // this is important to calculate right before patching left
            var right = left + this._barWidth - 1;
            var top_2 = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
            var bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            if (this._data.barSpacing * pixelRatio > 2 * borderWidth) {
                fillRectInnerBorder(ctx, left, top_2, right - left + 1, bottom - top_2 + 1, borderWidth);
            }
            else {
                var width = right - left + 1;
                ctx.fillRect(left, top_2, width, bottom - top_2 + 1);
            }
            prevEdge = right;
        }
    };
    PaneRendererCandlesticks.prototype._drawCandles = function (ctx, bars, visibleRange, pixelRatio) {
        if (this._data === null) {
            return;
        }
        var prevBarColor = '';
        var borderWidth = this._calculateBorderWidth(pixelRatio);
        for (var i = visibleRange.from; i < visibleRange.to; i++) {
            var bar = bars[i];
            var top_3 = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
            var bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);
            var left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
            var right = left + this._barWidth - 1;
            if (bar.color !== prevBarColor) {
                var barColor = bar.color;
                ctx.fillStyle = barColor;
                prevBarColor = barColor;
            }
            if (this._data.borderVisible) {
                left += borderWidth;
                top_3 += borderWidth;
                right -= borderWidth;
                bottom -= borderWidth;
            }
            if (top_3 > bottom) {
                continue;
            }
            ctx.fillRect(left, top_3, right - left + 1, bottom - top_3 + 1);
        }
    };
    return PaneRendererCandlesticks;
}());
export { PaneRendererCandlesticks };
