import { __extends } from "tslib";
import { DataSource } from './data-source';
var PriceDataSource = /** @class */ (function (_super) {
    __extends(PriceDataSource, _super);
    function PriceDataSource(model) {
        var _this = _super.call(this) || this;
        _this._model = model;
        return _this;
    }
    PriceDataSource.prototype.model = function () {
        return this._model;
    };
    return PriceDataSource;
}(DataSource));
export { PriceDataSource };
