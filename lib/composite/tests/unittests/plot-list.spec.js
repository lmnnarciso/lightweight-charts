"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var assertions_1 = require("../../src/helpers/assertions");
var plot_list_1 = require("../../src/model/plot-list");
function timePoint(val) {
    return { timestamp: val };
}
function row(i, val) {
    return { index: i, value: val !== undefined ? [val, val, val, val] : [i * 3, i * 3 + 1, i * 3 + 2, i * 3 + 3], time: timePoint(0) };
}
(0, mocha_1.describe)('PlotList', function () {
    var p = new plot_list_1.PlotList();
    beforeEach(function () {
        p.clear();
        p.merge([
            { index: -3, time: timePoint(2), value: [1, 2, 3, 4] },
            { index: 0, time: timePoint(3), value: [10, 20, 30, 40] },
            { index: 3, time: timePoint(4), value: [100, 200, 300, 500] },
        ]);
    });
    (0, mocha_1.it)('should contain all plot values that was previously added', function () {
        (0, chai_1.expect)(p.size()).to.be.equal(3);
        (0, chai_1.expect)(p.contains(-3)).to.be.equal(true);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(-3)).value).to.include.ordered.members([1, 2, 3]);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(-3)).time).to.have.deep.equal(timePoint(2));
        (0, chai_1.expect)(p.contains(0)).to.be.equal(true);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(0)).value).to.include.ordered.members([10, 20, 30]);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(0)).time).to.have.deep.equal(timePoint(3));
        (0, chai_1.expect)(p.contains(3)).to.be.equal(true);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(3)).value).to.include.ordered.members([100, 200, 300]);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(3)).time).to.have.deep.equal(timePoint(4));
    });
    (0, mocha_1.it)('should not contain any extraneous plot values', function () {
        (0, chai_1.expect)(p.contains(1)).to.be.equal(false);
    });
    (0, mocha_1.it)('should remove all plot values after calling \'clear\'', function () {
        p.clear();
        (0, chai_1.expect)(p.isEmpty()).to.be.equal(true);
        (0, chai_1.expect)(p.size()).to.be.equal(0);
    });
    (0, mocha_1.describe)('merge', function () {
        (0, mocha_1.it)('should correctly insert new and update existing plot values', function () {
            var plotList = new plot_list_1.PlotList();
            // first merge
            plotList.merge([
                row(0),
                row(1),
                row(2),
            ]);
            // second merge
            plotList.merge([
                row(2),
            ]);
            // third merge
            plotList.merge([
                row(-5),
                row(0),
                row(25),
            ]);
            // final result
            var items = plotList.rows();
            (0, chai_1.expect)(items.length).to.be.equal(5);
            (0, chai_1.expect)(items[0].value).to.include.ordered.members([-15, -14, -13]);
            (0, chai_1.expect)(items[1].value).to.include.ordered.members([0, 1, 2]);
            (0, chai_1.expect)(items[2].value).to.include.ordered.members([3, 4, 5]);
            (0, chai_1.expect)(items[3].value).to.include.ordered.members([6, 7, 8]);
            (0, chai_1.expect)(items[4].value).to.include.ordered.members([75, 76, 77]);
        });
        (0, mocha_1.it)('should correctly prepend new plot values', function () {
            var plotList = new plot_list_1.PlotList();
            plotList.merge([
                row(0),
                row(1),
                row(2),
            ]);
            plotList.merge([
                row(-2),
                row(-1),
            ]);
            (0, chai_1.expect)(plotList.size()).to.be.equal(5);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(-2)).value).to.include.ordered.members(row(-2).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(-1)).value).to.include.ordered.members(row(-1).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(0)).value).to.include.ordered.members(row(0).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(1)).value).to.include.ordered.members(row(1).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(2)).value).to.include.ordered.members(row(2).value);
        });
        (0, mocha_1.it)('should correctly append new plot values', function () {
            var plotList = new plot_list_1.PlotList();
            plotList.merge([
                row(0),
                row(1),
                row(2),
            ]);
            plotList.merge([
                row(3),
                row(4),
            ]);
            (0, chai_1.expect)(plotList.size()).to.be.equal(5);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(0)).value).to.include.ordered.members(row(0).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(1)).value).to.include.ordered.members(row(1).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(2)).value).to.include.ordered.members(row(2).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(3)).value).to.include.ordered.members(row(3).value);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(plotList.valueAt(4)).value).to.include.ordered.members(row(4).value);
        });
    });
    (0, mocha_1.describe)('search', function () {
        var p1 = new plot_list_1.PlotList();
        beforeEach(function () {
            p1.clear();
            p1.merge([
                { index: -5, time: timePoint(1), value: [1, 2, 3, 4] },
                { index: 0, time: timePoint(2), value: [10, 20, 30, 40] },
                { index: 5, time: timePoint(3), value: [100, 200, 300, 400] },
            ]);
        });
        (0, mocha_1.it)('should find respective values by given index and search strategy', function () {
            (0, chai_1.expect)(p1.search(-10, -1 /* NearestLeft */)).to.be.equal(null);
            (0, chai_1.expect)(p1.search(-5, -1 /* NearestLeft */)).to.deep.include({ index: -5, value: [1, 2, 3, 4] });
            (0, chai_1.expect)(p1.search(3, -1 /* NearestLeft */)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(1, -1 /* NearestLeft */)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(-6, 0 /* Exact */)).to.be.equal(null);
            (0, chai_1.expect)(p1.search(-5)).to.deep.include({ index: -5, value: [1, 2, 3, 4] });
            (0, chai_1.expect)(p1.search(0)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(5)).to.deep.include({ index: 5, value: [100, 200, 300, 400] });
            (0, chai_1.expect)(p1.search(6)).to.be.equal(null);
            (0, chai_1.expect)(p1.search(-3, 1 /* NearestRight */)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(3, 1 /* NearestRight */)).to.deep.include({ index: 5, value: [100, 200, 300, 400] });
            (0, chai_1.expect)(p1.search(5, 1 /* NearestRight */)).to.deep.include({ index: 5, value: [100, 200, 300, 400] });
            (0, chai_1.expect)(p1.search(6, 1 /* NearestRight */)).to.be.equal(null);
        });
    });
    (0, mocha_1.describe)('minMaxOnRangeCached', function () {
        var pl = new plot_list_1.PlotList();
        beforeEach(function () {
            pl.clear();
            pl.merge([
                { index: 0, time: timePoint(1), value: [0, 0, 0, 1] },
                { index: 1, time: timePoint(2), value: [0, 0, 0, 2] },
                { index: 2, time: timePoint(3), value: [0, 0, 0, 3] },
                { index: 3, time: timePoint(4), value: [0, 0, 0, 4] },
                { index: 4, time: timePoint(5), value: [0, 0, 0, 5] },
            ]);
        });
        (0, mocha_1.it)('should find minMax in numbers', function () {
            var plots = [3 /* Close */];
            var minMax = pl.minMaxOnRangeCached(0, 4, plots);
            (0, chai_1.expect)(minMax).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(1);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(5);
        });
        (0, mocha_1.it)('should find minMax with non subsequent indices', function () {
            pl.clear();
            pl.merge([
                { index: 0, time: timePoint(1), value: [0, 0, 0, 1] },
                { index: 2, time: timePoint(2), value: [0, 0, 0, 2] },
                { index: 4, time: timePoint(3), value: [0, 0, 0, 3] },
                { index: 6, time: timePoint(4), value: [0, 0, 0, 4] },
                { index: 20, time: timePoint(5), value: [0, 0, 0, 10] },
                { index: 100, time: timePoint(6), value: [0, 0, 0, 5] },
            ]);
            var plots = [3 /* Close */];
            var minMax = pl.minMaxOnRangeCached(0, 100, plots);
            (0, chai_1.expect)(minMax).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(1);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(10);
        });
        (0, mocha_1.it)('should return correct values if the data has gaps and we start search with second-to-last chunk', function () {
            pl.clear();
            pl.merge([
                { index: 29, time: timePoint(1), value: [1, 1, 1, 1] },
                { index: 31, time: timePoint(2), value: [2, 2, 2, 2] },
                { index: 55, time: timePoint(3), value: [3, 3, 3, 3] },
                { index: 65, time: timePoint(4), value: [4, 4, 4, 4] },
            ]);
            var plots = [1 /* High */];
            var minMax = pl.minMaxOnRangeCached(30, 200, plots);
            (0, chai_1.expect)(minMax).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(2);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(4);
            var minMax2 = pl.minMaxOnRangeCached(30, 60, plots);
            (0, chai_1.expect)(minMax2).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax2).min).to.be.equal(2);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax2).max).to.be.equal(3);
        });
    });
    (0, mocha_1.describe)('minMaxOnRangeByPlotFunction and minMaxOnRangeByPlotFunctionCached', function () {
        var pl = new plot_list_1.PlotList();
        beforeEach(function () {
            pl.clear();
            pl.merge([
                { index: 0, time: timePoint(1), value: [5, 7, 3, 6] },
                { index: 1, time: timePoint(2), value: [10, 12, 8, 11] },
                { index: 2, time: timePoint(3), value: [15, 17, 13, 16] },
                { index: 3, time: timePoint(4), value: [20, 22, 18, 21] },
                { index: 4, time: timePoint(5), value: [25, 27, 23, 26] },
            ]);
        });
        (0, mocha_1.it)('should return correct min max for open', function () {
            var minMax = pl.minMaxOnRangeCached(0, 4, [0 /* Open */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(5);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(25);
            var minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [0 /* Open */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(5);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(25);
        });
        (0, mocha_1.it)('should return correct min max for high', function () {
            var minMax = pl.minMaxOnRangeCached(0, 4, [1 /* High */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(7);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(27);
            var minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [1 /* High */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(7);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(27);
        });
        (0, mocha_1.it)('should return correct min max for low', function () {
            var minMax = pl.minMaxOnRangeCached(0, 4, [2 /* Low */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(3);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(23);
            var minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [2 /* Low */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(3);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(23);
        });
        (0, mocha_1.it)('should return correct min max for close', function () {
            var minMax = pl.minMaxOnRangeCached(0, 4, [3 /* Close */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(6);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(26);
            var minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [3 /* Close */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(6);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(26);
        });
    });
});
(0, mocha_1.describe)('mergePlotRows', function () {
    (0, mocha_1.describe)('(correctness)', function () {
        (0, mocha_1.it)('should merge disjoint arrays', function () {
            var firstArray = [row(1), row(3), row(5)];
            var secondArray = [row(2), row(4)];
            var merged = (0, plot_list_1.mergePlotRows)(firstArray, secondArray);
            (0, chai_1.expect)(merged).to.eql([row(1), row(2), row(3), row(4), row(5)]);
        });
        (0, mocha_1.it)('should merge arrays with one overlapped item', function () {
            var firstArray = [row(3), row(4), row(5)];
            var secondArray = [row(1), row(2), row(3)];
            var merged = (0, plot_list_1.mergePlotRows)(firstArray, secondArray);
            (0, chai_1.expect)(merged).to.eql([row(1), row(2), row(3), row(4), row(5)]);
        });
        (0, mocha_1.it)('should merge array with sub-array', function () {
            var array = [row(1), row(2), row(3), row(4), row(5)];
            var merged = (0, plot_list_1.mergePlotRows)(array, array.slice(1, 3));
            (0, chai_1.expect)(merged).to.eql(array, 'Merged array must be equals superset\'s array');
        });
        (0, mocha_1.it)('should merge fully overlapped arrays', function () {
            var array = [row(1), row(2), row(3), row(4), row(5)];
            var merged = (0, plot_list_1.mergePlotRows)(array, array);
            (0, chai_1.expect)(merged).to.eql(array, 'Merged array must be equals to one of overlapped array');
        });
        (0, mocha_1.it)('should merge arrays with primitive types regardless of arrays\' order in args', function () {
            var firstArray = [row(0), row(2), row(4), row(6)];
            var secondArray = [row(1), row(3), row(5)];
            var firstSecondMerged = (0, plot_list_1.mergePlotRows)(firstArray, secondArray);
            var secondFirstMerged = (0, plot_list_1.mergePlotRows)(secondArray, firstArray);
            (0, chai_1.expect)(firstSecondMerged).to.eql(secondFirstMerged);
        });
        (0, mocha_1.it)('should merge arrays with non-primitive types dependent of order in args', function () {
            var firstArray = [
                row(0, 1000),
                row(1, 2000),
                row(2, 3000),
            ];
            var secondArray = [
                row(1, 4000),
                row(2, 5000),
                row(3, 6000),
            ];
            var firstSecondMerged = (0, plot_list_1.mergePlotRows)(firstArray, secondArray);
            var secondFirstMerged = (0, plot_list_1.mergePlotRows)(secondArray, firstArray);
            (0, chai_1.expect)(firstSecondMerged).not.to.be.equal(secondFirstMerged);
            (0, chai_1.expect)(firstSecondMerged.length).to.be.equal(4);
            (0, chai_1.expect)(firstSecondMerged).to.include.ordered.members((0, tslib_1.__spreadArray)([firstArray[0]], secondArray, true));
            (0, chai_1.expect)(secondFirstMerged.length).to.be.equal(4);
            (0, chai_1.expect)(secondFirstMerged).to.include.ordered.members((0, tslib_1.__spreadArray)((0, tslib_1.__spreadArray)([], firstArray, true), [secondArray[2]], false));
        });
    });
    xdescribe('(perf)', function () {
        function isSorted(array) {
            for (var i = 1; i < array.length; ++i) {
                if (array[i - 1].index > array[i].index) {
                    return false;
                }
            }
            return true;
        }
        function generateSortedPlotRows(size) {
            var startIndex = (Math.random() * 1000) | 0;
            var array = new Array(size);
            for (var i = 0; i < size; ++i) {
                array[i] = row(startIndex + i);
            }
            return array;
        }
        function measure(func) {
            var startTime = Date.now();
            var res = func();
            return [Date.now() - startTime, res];
        }
        (0, mocha_1.it)('should have linear complexity', function () {
            var first1MArray = generateSortedPlotRows(1000000);
            var second1MArray = generateSortedPlotRows(1000000);
            var total2MTime = measure(function () { return (0, plot_list_1.mergePlotRows)(first1MArray, second1MArray); })[0];
            var first3MArray = generateSortedPlotRows(3000000);
            var second3MArray = generateSortedPlotRows(3000000);
            var _a = measure(function () { return (0, plot_list_1.mergePlotRows)(first3MArray, second3MArray); }), total6MTime = _a[0], merged6MArray = _a[1];
            // we need to check that execution time for `N + M = 2 Millions` is more than
            // execution time for `N + M = 6 Millions` divided by 3 (and minus some delay to decrease false positive)
            // and if it is so - we have get linear complexity (approx.)
            (0, chai_1.expect)(total2MTime).to.be.greaterThan((total6MTime / 3) - total2MTime * 0.3);
            (0, chai_1.expect)(isSorted(merged6MArray)).to.be.true('Merged array must be sorted');
        });
    });
});
