import { PriceAxisViewRenderer } from '../../renderers/price-axis-view-renderer';
var PriceAxisView = /** @class */ (function () {
    function PriceAxisView(ctor) {
        this._commonRendererData = {
            coordinate: 0,
            color: '#FFF',
            background: '#000',
        };
        this._axisRendererData = {
            text: '',
            visible: false,
            tickVisible: true,
            moveTextToInvisibleTick: false,
            borderColor: '',
        };
        this._paneRendererData = {
            text: '',
            visible: false,
            tickVisible: false,
            moveTextToInvisibleTick: true,
            borderColor: '',
        };
        this._invalidated = true;
        this._axisRenderer = new (ctor || PriceAxisViewRenderer)(this._axisRendererData, this._commonRendererData);
        this._paneRenderer = new (ctor || PriceAxisViewRenderer)(this._paneRendererData, this._commonRendererData);
    }
    PriceAxisView.prototype.text = function () {
        return this._axisRendererData.text;
    };
    PriceAxisView.prototype.coordinate = function () {
        this._updateRendererDataIfNeeded();
        return this._commonRendererData.coordinate;
    };
    PriceAxisView.prototype.update = function () {
        this._invalidated = true;
    };
    PriceAxisView.prototype.height = function (rendererOptions, useSecondLine) {
        if (useSecondLine === void 0) { useSecondLine = false; }
        return Math.max(this._axisRenderer.height(rendererOptions, useSecondLine), this._paneRenderer.height(rendererOptions, useSecondLine));
    };
    PriceAxisView.prototype.getFixedCoordinate = function () {
        return this._commonRendererData.fixedCoordinate || 0;
    };
    PriceAxisView.prototype.setFixedCoordinate = function (value) {
        this._commonRendererData.fixedCoordinate = value;
    };
    PriceAxisView.prototype.isVisible = function () {
        this._updateRendererDataIfNeeded();
        return this._axisRendererData.visible || this._paneRendererData.visible;
    };
    PriceAxisView.prototype.isAxisLabelVisible = function () {
        this._updateRendererDataIfNeeded();
        return this._axisRendererData.visible;
    };
    PriceAxisView.prototype.renderer = function (priceScale) {
        this._updateRendererDataIfNeeded();
        // force update tickVisible state from price scale options
        // because we don't have and we can't have price axis in other methods
        // (like paneRenderer or any other who call _updateRendererDataIfNeeded)
        this._axisRendererData.tickVisible = this._axisRendererData.tickVisible && priceScale.options().drawTicks;
        this._paneRendererData.tickVisible = this._paneRendererData.tickVisible && priceScale.options().drawTicks;
        this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
        this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);
        return this._axisRenderer;
    };
    PriceAxisView.prototype.paneRenderer = function () {
        this._updateRendererDataIfNeeded();
        this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
        this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);
        return this._paneRenderer;
    };
    PriceAxisView.prototype._updateRendererDataIfNeeded = function () {
        if (this._invalidated) {
            this._axisRendererData.tickVisible = true;
            this._paneRendererData.tickVisible = false;
            this._updateRendererData(this._axisRendererData, this._paneRendererData, this._commonRendererData);
        }
    };
    return PriceAxisView;
}());
export { PriceAxisView };
