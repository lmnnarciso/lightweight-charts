import { __assign } from "tslib";
import { lowerbound, upperbound } from '../helpers/algorithms';
import { assert, ensureNotNull } from '../helpers/assertions';
export var PlotRowSearchMode;
(function (PlotRowSearchMode) {
    PlotRowSearchMode[PlotRowSearchMode["NearestLeft"] = -1] = "NearestLeft";
    PlotRowSearchMode[PlotRowSearchMode["Exact"] = 0] = "Exact";
    PlotRowSearchMode[PlotRowSearchMode["NearestRight"] = 1] = "NearestRight";
})(PlotRowSearchMode || (PlotRowSearchMode = {}));
// TODO: think about changing it dynamically
var CHUNK_SIZE = 30;
/**
 * PlotList is an array of plot rows
 * each plot row consists of key (index in timescale) and plot value map
 */
var PlotList = /** @class */ (function () {
    function PlotList() {
        this._items = [];
        this._minMaxCache = new Map();
        this._rowSearchCache = new Map();
    }
    PlotList.prototype.clear = function () {
        this._items = [];
        this._minMaxCache.clear();
        this._rowSearchCache.clear();
    };
    // @returns Last row
    PlotList.prototype.last = function () {
        return this.size() > 0 ? this._items[this._items.length - 1] : null;
    };
    PlotList.prototype.firstIndex = function () {
        return this.size() > 0 ? this._indexAt(0) : null;
    };
    PlotList.prototype.lastIndex = function () {
        return this.size() > 0 ? this._indexAt((this._items.length - 1)) : null;
    };
    PlotList.prototype.size = function () {
        return this._items.length;
    };
    PlotList.prototype.isEmpty = function () {
        return this.size() === 0;
    };
    PlotList.prototype.contains = function (index) {
        return this._search(index, 0 /* Exact */) !== null;
    };
    PlotList.prototype.valueAt = function (index) {
        return this.search(index);
    };
    PlotList.prototype.search = function (index, searchMode) {
        if (searchMode === void 0) { searchMode = 0 /* Exact */; }
        var pos = this._search(index, searchMode);
        if (pos === null) {
            return null;
        }
        return __assign(__assign({}, this._valueAt(pos)), { index: this._indexAt(pos) });
    };
    PlotList.prototype.rows = function () {
        return this._items;
    };
    PlotList.prototype.minMaxOnRangeCached = function (start, end, plots) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this.isEmpty()) {
            return null;
        }
        var result = null;
        for (var _i = 0, plots_1 = plots; _i < plots_1.length; _i++) {
            var plot = plots_1[_i];
            var plotMinMax = this._minMaxOnRangeCachedImpl(start, end, plot);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    };
    PlotList.prototype.merge = function (plotRows) {
        if (plotRows.length === 0) {
            return;
        }
        // if we get a bunch of history - just prepend it
        if (this.isEmpty() || plotRows[plotRows.length - 1].index < this._items[0].index) {
            this._prepend(plotRows);
            return;
        }
        // if we get new rows - just append it
        if (plotRows[0].index > this._items[this._items.length - 1].index) {
            this._append(plotRows);
            return;
        }
        // if we get update for the last row - just replace it
        if (plotRows.length === 1 && plotRows[0].index === this._items[this._items.length - 1].index) {
            this._updateLast(plotRows[0]);
            return;
        }
        this._merge(plotRows);
    };
    PlotList.prototype._indexAt = function (offset) {
        return this._items[offset].index;
    };
    PlotList.prototype._valueAt = function (offset) {
        return this._items[offset];
    };
    PlotList.prototype._search = function (index, searchMode) {
        var exactPos = this._bsearch(index);
        if (exactPos === null && searchMode !== 0 /* Exact */) {
            switch (searchMode) {
                case -1 /* NearestLeft */:
                    return this._searchNearestLeft(index);
                case 1 /* NearestRight */:
                    return this._searchNearestRight(index);
                default:
                    throw new TypeError('Unknown search mode');
            }
        }
        return exactPos;
    };
    PlotList.prototype._searchNearestLeft = function (index) {
        var nearestLeftPos = this._lowerbound(index);
        if (nearestLeftPos > 0) {
            nearestLeftPos = nearestLeftPos - 1;
        }
        return (nearestLeftPos !== this._items.length && this._indexAt(nearestLeftPos) < index) ? nearestLeftPos : null;
    };
    PlotList.prototype._searchNearestRight = function (index) {
        var nearestRightPos = this._upperbound(index);
        return (nearestRightPos !== this._items.length && index < this._indexAt(nearestRightPos)) ? nearestRightPos : null;
    };
    PlotList.prototype._bsearch = function (index) {
        var start = this._lowerbound(index);
        if (start !== this._items.length && !(index < this._items[start].index)) {
            return start;
        }
        return null;
    };
    PlotList.prototype._lowerbound = function (index) {
        return lowerbound(this._items, index, function (a, b) { return a.index < b; });
    };
    PlotList.prototype._upperbound = function (index) {
        return upperbound(this._items, index, function (a, b) { return b.index > a; });
    };
    /**
     * @param endIndex - Non-inclusive end
     */
    PlotList.prototype._plotMinMax = function (startIndex, endIndex, plotIndex) {
        var result = null;
        for (var i = startIndex; i < endIndex; i++) {
            var values = this._items[i].value;
            var v = values[plotIndex];
            if (Number.isNaN(v)) {
                continue;
            }
            if (result === null) {
                result = { min: v, max: v };
            }
            else {
                if (v < result.min) {
                    result.min = v;
                }
                if (v > result.max) {
                    result.max = v;
                }
            }
        }
        return result;
    };
    PlotList.prototype._invalidateCacheForRow = function (row) {
        var chunkIndex = Math.floor(row.index / CHUNK_SIZE);
        this._minMaxCache.forEach(function (cacheItem) { return cacheItem.delete(chunkIndex); });
    };
    PlotList.prototype._prepend = function (plotRows) {
        assert(plotRows.length !== 0, 'plotRows should not be empty');
        this._rowSearchCache.clear();
        this._minMaxCache.clear();
        this._items = plotRows.concat(this._items);
    };
    PlotList.prototype._append = function (plotRows) {
        assert(plotRows.length !== 0, 'plotRows should not be empty');
        this._rowSearchCache.clear();
        this._minMaxCache.clear();
        this._items = this._items.concat(plotRows);
    };
    PlotList.prototype._updateLast = function (plotRow) {
        assert(!this.isEmpty(), 'plot list should not be empty');
        var currentLastRow = this._items[this._items.length - 1];
        assert(currentLastRow.index === plotRow.index, 'last row index should match new row index');
        this._invalidateCacheForRow(plotRow);
        this._rowSearchCache.delete(plotRow.index);
        this._items[this._items.length - 1] = plotRow;
    };
    PlotList.prototype._merge = function (plotRows) {
        assert(plotRows.length !== 0, 'plot rows should not be empty');
        this._rowSearchCache.clear();
        this._minMaxCache.clear();
        this._items = mergePlotRows(this._items, plotRows);
    };
    PlotList.prototype._minMaxOnRangeCachedImpl = function (start, end, plotIndex) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this.isEmpty()) {
            return null;
        }
        var result = null;
        // assume that bar indexes only increase
        var firstIndex = ensureNotNull(this.firstIndex());
        var lastIndex = ensureNotNull(this.lastIndex());
        var s = Math.max(start, firstIndex);
        var e = Math.min(end, lastIndex);
        var cachedLow = Math.ceil(s / CHUNK_SIZE) * CHUNK_SIZE;
        var cachedHigh = Math.max(cachedLow, Math.floor(e / CHUNK_SIZE) * CHUNK_SIZE);
        {
            var startIndex = this._lowerbound(s);
            var endIndex = this._upperbound(Math.min(e, cachedLow, end)); // non-inclusive end
            var plotMinMax = this._plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        var minMaxCache = this._minMaxCache.get(plotIndex);
        if (minMaxCache === undefined) {
            minMaxCache = new Map();
            this._minMaxCache.set(plotIndex, minMaxCache);
        }
        // now go cached
        for (var c = Math.max(cachedLow + 1, s); c < cachedHigh; c += CHUNK_SIZE) {
            var chunkIndex = Math.floor(c / CHUNK_SIZE);
            var chunkMinMax = minMaxCache.get(chunkIndex);
            if (chunkMinMax === undefined) {
                var chunkStart = this._lowerbound(chunkIndex * CHUNK_SIZE);
                var chunkEnd = this._upperbound((chunkIndex + 1) * CHUNK_SIZE - 1);
                chunkMinMax = this._plotMinMax(chunkStart, chunkEnd, plotIndex);
                minMaxCache.set(chunkIndex, chunkMinMax);
            }
            result = mergeMinMax(result, chunkMinMax);
        }
        // tail
        {
            var startIndex = this._lowerbound(cachedHigh);
            var endIndex = this._upperbound(e); // non-inclusive end
            var plotMinMax = this._plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    };
    return PlotList;
}());
export { PlotList };
function mergeMinMax(first, second) {
    if (first === null) {
        return second;
    }
    else {
        if (second === null) {
            return first;
        }
        else {
            // merge MinMax values
            var min = Math.min(first.min, second.min);
            var max = Math.max(first.max, second.max);
            return { min: min, max: max };
        }
    }
}
/**
 * Merges two ordered plot row arrays and returns result (ordered plot row array).
 *
 * BEWARE: If row indexes from plot rows are equal, the new plot row is used.
 *
 * NOTE: Time and memory complexity are O(N+M).
 */
export function mergePlotRows(originalPlotRows, newPlotRows) {
    var newArraySize = calcMergedArraySize(originalPlotRows, newPlotRows);
    var result = new Array(newArraySize);
    var originalRowsIndex = 0;
    var newRowsIndex = 0;
    var originalRowsSize = originalPlotRows.length;
    var newRowsSize = newPlotRows.length;
    var resultRowsIndex = 0;
    while (originalRowsIndex < originalRowsSize && newRowsIndex < newRowsSize) {
        if (originalPlotRows[originalRowsIndex].index < newPlotRows[newRowsIndex].index) {
            result[resultRowsIndex] = originalPlotRows[originalRowsIndex];
            originalRowsIndex++;
        }
        else if (originalPlotRows[originalRowsIndex].index > newPlotRows[newRowsIndex].index) {
            result[resultRowsIndex] = newPlotRows[newRowsIndex];
            newRowsIndex++;
        }
        else {
            result[resultRowsIndex] = newPlotRows[newRowsIndex];
            originalRowsIndex++;
            newRowsIndex++;
        }
        resultRowsIndex++;
    }
    while (originalRowsIndex < originalRowsSize) {
        result[resultRowsIndex] = originalPlotRows[originalRowsIndex];
        originalRowsIndex++;
        resultRowsIndex++;
    }
    while (newRowsIndex < newRowsSize) {
        result[resultRowsIndex] = newPlotRows[newRowsIndex];
        newRowsIndex++;
        resultRowsIndex++;
    }
    return result;
}
function calcMergedArraySize(firstPlotRows, secondPlotRows) {
    var firstPlotsSize = firstPlotRows.length;
    var secondPlotsSize = secondPlotRows.length;
    // new plot rows size is (first plot rows size) + (second plot rows size) - common part size
    // in this case we can just calculate common part size
    var result = firstPlotsSize + secondPlotsSize;
    // TODO: we can move first/second indexes to the right and first/second size to lower/upper bound of opposite array
    // to skip checking uncommon parts
    var firstIndex = 0;
    var secondIndex = 0;
    while (firstIndex < firstPlotsSize && secondIndex < secondPlotsSize) {
        if (firstPlotRows[firstIndex].index < secondPlotRows[secondIndex].index) {
            firstIndex++;
        }
        else if (firstPlotRows[firstIndex].index > secondPlotRows[secondIndex].index) {
            secondIndex++;
        }
        else {
            firstIndex++;
            secondIndex++;
            result--;
        }
    }
    return result;
}
