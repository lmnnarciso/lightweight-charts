import { __extends } from "tslib";
import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
var SeriesPriceAxisView = /** @class */ (function (_super) {
    __extends(SeriesPriceAxisView, _super);
    function SeriesPriceAxisView(source) {
        var _this = _super.call(this) || this;
        _this._source = source;
        return _this;
    }
    SeriesPriceAxisView.prototype._updateRendererData = function (axisRendererData, paneRendererData, commonRendererData) {
        axisRendererData.visible = false;
        paneRendererData.visible = false;
        var source = this._source;
        if (!source.visible()) {
            return;
        }
        var seriesOptions = source.options();
        var showSeriesLastValue = seriesOptions.lastValueVisible;
        var showSymbolLabel = source.title() !== '';
        var showPriceAndPercentage = seriesOptions.seriesLastValueMode === 0 /* LastPriceAndPercentageValue */;
        var lastValueData = source.lastValueData(false);
        if (lastValueData.noData) {
            return;
        }
        if (showSeriesLastValue) {
            axisRendererData.text = this._axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage);
            axisRendererData.visible = axisRendererData.text.length !== 0;
        }
        if (showSymbolLabel || showPriceAndPercentage) {
            paneRendererData.text = this._paneText(lastValueData, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage);
            paneRendererData.visible = paneRendererData.text.length > 0;
        }
        var lastValueColor = source.priceLineColor(lastValueData.color);
        var colors = generateContrastColors(lastValueColor);
        commonRendererData.background = colors.background;
        commonRendererData.color = colors.foreground;
        commonRendererData.coordinate = lastValueData.coordinate;
        paneRendererData.borderColor = source.model().backgroundColorAtYPercentFromTop(lastValueData.coordinate / source.priceScale().height());
        axisRendererData.borderColor = lastValueColor;
    };
    SeriesPriceAxisView.prototype._paneText = function (lastValue, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage) {
        var result = '';
        var title = this._source.title();
        if (showSymbolLabel && title.length !== 0) {
            result += title + " ";
        }
        if (showSeriesLastValue && showPriceAndPercentage) {
            result += this._source.priceScale().isPercentage() ?
                lastValue.formattedPriceAbsolute : lastValue.formattedPricePercentage;
        }
        return result.trim();
    };
    SeriesPriceAxisView.prototype._axisText = function (lastValueData, showSeriesLastValue, showPriceAndPercentage) {
        if (!showSeriesLastValue) {
            return '';
        }
        if (!showPriceAndPercentage) {
            return lastValueData.text;
        }
        return this._source.priceScale().isPercentage() ?
            lastValueData.formattedPricePercentage : lastValueData.formattedPriceAbsolute;
    };
    return SeriesPriceAxisView;
}(PriceAxisView));
export { SeriesPriceAxisView };
