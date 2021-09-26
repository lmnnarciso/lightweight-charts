import { __extends } from "tslib";
import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { SeriesPaneViewBase } from './series-pane-view-base';
var LinePaneViewBase = /** @class */ (function (_super) {
    __extends(LinePaneViewBase, _super);
    function LinePaneViewBase(series, model) {
        return _super.call(this, series, model, true) || this;
    }
    LinePaneViewBase.prototype._convertToCoordinates = function (priceScale, timeScale, firstValue) {
        timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
        priceScale.pointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
    };
    LinePaneViewBase.prototype._createRawItemBase = function (time, price) {
        return {
            time: time,
            price: price,
            x: NaN,
            y: NaN,
        };
    };
    LinePaneViewBase.prototype._updateOptions = function () { };
    LinePaneViewBase.prototype._fillRawPoints = function () {
        var _this = this;
        var colorer = this._series.barColorer();
        this._items = this._series.bars().rows().map(function (row) {
            var value = row.value[3 /* Close */];
            return _this._createRawItem(row.index, value, colorer);
        });
    };
    return LinePaneViewBase;
}(SeriesPaneViewBase));
export { LinePaneViewBase };
