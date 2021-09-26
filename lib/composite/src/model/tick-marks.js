import { ensureDefined } from '../helpers/assertions';
var TickMarks = /** @class */ (function () {
    function TickMarks() {
        this._marksByWeight = new Map();
        this._cache = null;
    }
    TickMarks.prototype.setTimeScalePoints = function (newPoints) {
        var _this = this;
        this._cache = null;
        this._marksByWeight.clear();
        // TODO: it looks like this is quite fast even with thousands of points
        // but there might be point of improvements by providing the only changed points
        newPoints.forEach(function (point, index) {
            var marksForWeight = _this._marksByWeight.get(point.timeWeight);
            if (marksForWeight === undefined) {
                marksForWeight = [];
                _this._marksByWeight.set(point.timeWeight, marksForWeight);
            }
            marksForWeight.push({
                index: index,
                time: point.time,
                weight: point.timeWeight,
            });
        });
    };
    TickMarks.prototype.build = function (spacing, maxWidth) {
        var maxIndexesPerMark = Math.ceil(maxWidth / spacing);
        if (this._cache === null || this._cache.maxIndexesPerMark !== maxIndexesPerMark) {
            this._cache = {
                marks: this._buildMarksImpl(maxIndexesPerMark),
                maxIndexesPerMark: maxIndexesPerMark,
            };
        }
        return this._cache.marks;
    };
    TickMarks.prototype._buildMarksImpl = function (maxIndexesPerMark) {
        var marks = [];
        for (var _i = 0, _a = Array.from(this._marksByWeight.keys()).sort(function (a, b) { return b - a; }); _i < _a.length; _i++) {
            var weight = _a[_i];
            if (!this._marksByWeight.get(weight)) {
                continue;
            }
            // Built tickMarks are now prevMarks, and marks it as new array
            var prevMarks = marks;
            marks = [];
            var prevMarksLength = prevMarks.length;
            var prevMarksPointer = 0;
            var currentWeight = ensureDefined(this._marksByWeight.get(weight));
            var currentWeightLength = currentWeight.length;
            var rightIndex = Infinity;
            var leftIndex = -Infinity;
            for (var i = 0; i < currentWeightLength; i++) {
                var mark = currentWeight[i];
                var currentIndex = mark.index;
                // Determine indexes with which current index will be compared
                // All marks to the right is moved to new array
                while (prevMarksPointer < prevMarksLength) {
                    var lastMark = prevMarks[prevMarksPointer];
                    var lastIndex = lastMark.index;
                    if (lastIndex < currentIndex) {
                        prevMarksPointer++;
                        marks.push(lastMark);
                        leftIndex = lastIndex;
                        rightIndex = Infinity;
                    }
                    else {
                        rightIndex = lastIndex;
                        break;
                    }
                }
                if (rightIndex - currentIndex >= maxIndexesPerMark && currentIndex - leftIndex >= maxIndexesPerMark) {
                    // TickMark fits. Place it into new array
                    marks.push(mark);
                    leftIndex = currentIndex;
                }
            }
            // Place all unused tickMarks into new array;
            for (; prevMarksPointer < prevMarksLength; prevMarksPointer++) {
                marks.push(prevMarks[prevMarksPointer]);
            }
        }
        return marks;
    };
    return TickMarks;
}());
export { TickMarks };
