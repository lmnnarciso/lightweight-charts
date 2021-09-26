import { ensureNotNull } from '../../helpers/assertions';
import { generateContrastColors } from '../../helpers/color';
import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';
var CrosshairTimeAxisView = /** @class */ (function () {
    function CrosshairTimeAxisView(crosshair, model, valueProvider) {
        this._invalidated = true;
        this._renderer = new TimeAxisViewRenderer();
        this._rendererData = {
            visible: false,
            background: '#4c525e',
            color: 'white',
            text: '',
            width: 0,
            coordinate: NaN,
        };
        this._crosshair = crosshair;
        this._model = model;
        this._valueProvider = valueProvider;
    }
    CrosshairTimeAxisView.prototype.update = function () {
        this._invalidated = true;
    };
    CrosshairTimeAxisView.prototype.renderer = function () {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        this._renderer.setData(this._rendererData);
        return this._renderer;
    };
    CrosshairTimeAxisView.prototype._updateImpl = function () {
        var data = this._rendererData;
        data.visible = false;
        var options = this._crosshair.options().vertLine;
        if (!options.labelVisible) {
            return;
        }
        var timeScale = this._model.timeScale();
        if (timeScale.isEmpty()) {
            return;
        }
        var currentTime = timeScale.indexToTime(this._crosshair.appliedIndex());
        data.width = timeScale.width();
        var value = this._valueProvider();
        if (!value.time) {
            return;
        }
        data.coordinate = value.coordinate;
        data.text = timeScale.formatDateTime(ensureNotNull(currentTime));
        data.visible = true;
        var colors = generateContrastColors(options.labelBackgroundColor);
        data.background = colors.background;
        data.color = colors.foreground;
    };
    return CrosshairTimeAxisView;
}());
export { CrosshairTimeAxisView };
