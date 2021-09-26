var SeriesLastPriceAnimationRenderer = /** @class */ (function () {
    function SeriesLastPriceAnimationRenderer() {
        this._data = null;
    }
    SeriesLastPriceAnimationRenderer.prototype.setData = function (data) {
        this._data = data;
    };
    SeriesLastPriceAnimationRenderer.prototype.data = function () {
        return this._data;
    };
    SeriesLastPriceAnimationRenderer.prototype.draw = function (ctx, pixelRatio, isHovered, hitTestData) {
        var data = this._data;
        if (data === null) {
            return;
        }
        ctx.save();
        var tickWidth = Math.max(1, Math.floor(pixelRatio));
        var correction = (tickWidth % 2) / 2;
        var centerX = Math.round(data.center.x * pixelRatio) + correction; // correct x coordinate only
        var centerY = data.center.y * pixelRatio;
        ctx.fillStyle = data.seriesLineColor;
        ctx.beginPath();
        var centerPointRadius = Math.max(2, data.seriesLineWidth * 1.5) * pixelRatio;
        ctx.arc(centerX, centerY, centerPointRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.fillStyle = data.fillColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data.radius * pixelRatio, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = tickWidth;
        ctx.strokeStyle = data.strokeColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data.radius * pixelRatio + tickWidth / 2, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.restore();
    };
    return SeriesLastPriceAnimationRenderer;
}());
export { SeriesLastPriceAnimationRenderer };
