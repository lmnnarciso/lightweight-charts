import { equal, greaterOrEqual, isBaseDecimal, log10 } from '../helpers/mathex';
var TICK_SPAN_EPSILON = 1e-9;
var PriceTickSpanCalculator = /** @class */ (function () {
    function PriceTickSpanCalculator(base, integralDividers) {
        this._base = base;
        this._integralDividers = integralDividers;
        if (isBaseDecimal(this._base)) {
            this._fractionalDividers = [2, 2.5, 2];
        }
        else {
            this._fractionalDividers = [];
            for (var baseRest = this._base; baseRest !== 1;) {
                if ((baseRest % 2) === 0) {
                    this._fractionalDividers.push(2);
                    baseRest /= 2;
                }
                else if ((baseRest % 5) === 0) {
                    this._fractionalDividers.push(2, 2.5);
                    baseRest /= 5;
                }
                else {
                    throw new Error('unexpected base');
                }
                if (this._fractionalDividers.length > 100) {
                    throw new Error('something wrong with base');
                }
            }
        }
    }
    PriceTickSpanCalculator.prototype.tickSpan = function (high, low, maxTickSpan) {
        var minMovement = (this._base === 0) ? (0) : (1 / this._base);
        var tickSpanEpsilon = TICK_SPAN_EPSILON;
        var resultTickSpan = Math.pow(10, Math.max(0, Math.ceil(log10(high - low))));
        var index = 0;
        var c = this._integralDividers[0];
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // the second part is actual for small with very small values like 1e-10
            // greaterOrEqual fails for such values
            var resultTickSpanLargerMinMovement = greaterOrEqual(resultTickSpan, minMovement, tickSpanEpsilon) && resultTickSpan > (minMovement + tickSpanEpsilon);
            var resultTickSpanLargerMaxTickSpan = greaterOrEqual(resultTickSpan, maxTickSpan * c, tickSpanEpsilon);
            var resultTickSpanLarger1 = greaterOrEqual(resultTickSpan, 1, tickSpanEpsilon);
            var haveToContinue = resultTickSpanLargerMinMovement && resultTickSpanLargerMaxTickSpan && resultTickSpanLarger1;
            if (!haveToContinue) {
                break;
            }
            resultTickSpan /= c;
            c = this._integralDividers[++index % this._integralDividers.length];
        }
        if (resultTickSpan <= (minMovement + tickSpanEpsilon)) {
            resultTickSpan = minMovement;
        }
        resultTickSpan = Math.max(1, resultTickSpan);
        if ((this._fractionalDividers.length > 0) && equal(resultTickSpan, 1, tickSpanEpsilon)) {
            index = 0;
            c = this._fractionalDividers[0];
            while (greaterOrEqual(resultTickSpan, maxTickSpan * c, tickSpanEpsilon) && resultTickSpan > (minMovement + tickSpanEpsilon)) {
                resultTickSpan /= c;
                c = this._fractionalDividers[++index % this._fractionalDividers.length];
            }
        }
        return resultTickSpan;
    };
    return PriceTickSpanCalculator;
}());
export { PriceTickSpanCalculator };
