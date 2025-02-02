import { __extends } from "tslib";
import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { SeriesPaneViewBase } from './series-pane-view-base';
var BarsPaneViewBase = /** @class */ (function (_super) {
    __extends(BarsPaneViewBase, _super);
    function BarsPaneViewBase(series, model) {
        return _super.call(this, series, model, false) || this;
    }
    BarsPaneViewBase.prototype._convertToCoordinates = function (priceScale, timeScale, firstValue) {
        timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
        priceScale.barPricesToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
    };
    BarsPaneViewBase.prototype._createDefaultItem = function (time, bar, colorer) {
        return {
            time: time,
            open: bar.value[0 /* Open */],
            high: bar.value[1 /* High */],
            low: bar.value[2 /* Low */],
            close: bar.value[3 /* Close */],
            x: NaN,
            openY: NaN,
            highY: NaN,
            lowY: NaN,
            closeY: NaN,
        };
    };
    BarsPaneViewBase.prototype._fillRawPoints = function () {
        var _this = this;
        var colorer = this._series.barColorer();
        this._items = this._series.bars().rows().map(function (row) { return _this._createRawItem(row.index, row, colorer); });
    };
    return BarsPaneViewBase;
}(SeriesPaneViewBase));
export { BarsPaneViewBase };
