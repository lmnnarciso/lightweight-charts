import { __extends } from "tslib";
import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
var CustomPriceLinePriceAxisView = /** @class */ (function (_super) {
    __extends(CustomPriceLinePriceAxisView, _super);
    function CustomPriceLinePriceAxisView(series, priceLine) {
        var _this = _super.call(this) || this;
        _this._series = series;
        _this._priceLine = priceLine;
        return _this;
    }
    CustomPriceLinePriceAxisView.prototype._updateRendererData = function (axisRendererData, paneRendererData, commonData) {
        axisRendererData.visible = false;
        paneRendererData.visible = false;
        var options = this._priceLine.options();
        var labelVisible = options.axisLabelVisible;
        var showPaneLabel = options.title !== '';
        var series = this._series;
        if (!labelVisible || !series.visible()) {
            return;
        }
        var y = this._priceLine.yCoord();
        if (y === null) {
            return;
        }
        if (showPaneLabel) {
            paneRendererData.text = options.title;
            paneRendererData.visible = true;
        }
        paneRendererData.borderColor = series.model().backgroundColorAtYPercentFromTop(y / series.priceScale().height());
        axisRendererData.text = series.priceScale().formatPriceAbsolute(options.price);
        axisRendererData.visible = true;
        var colors = generateContrastColors(options.color);
        commonData.background = colors.background;
        commonData.color = colors.foreground;
        commonData.coordinate = y;
    };
    return CustomPriceLinePriceAxisView;
}(PriceAxisView));
export { CustomPriceLinePriceAxisView };
