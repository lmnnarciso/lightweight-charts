import { ensureDefined } from '../helpers/assertions';
var TickMarks = /** @class */ (function () {
    function TickMarks() {
        this._private__marksByWeight = new Map();
        this._private__cache = null;
    }
    TickMarks.prototype._internal_setTimeScalePoints = function (newPoints) {
        var _this = this;
        this._private__cache = null;
        this._private__marksByWeight.clear();
        // TODO: it looks like this is quite fast even with thousands of points
        // but there might be point of improvements by providing the only changed points
        newPoints.forEach(function (point, index) {
            var marksForWeight = _this._private__marksByWeight.get(point._internal_timeWeight);
            if (marksForWeight === undefined) {
                marksForWeight = [];
                _this._private__marksByWeight.set(point._internal_timeWeight, marksForWeight);
            }
            marksForWeight.push({
                _internal_index: index,
                _internal_time: point._internal_time,
                _internal_weight: point._internal_timeWeight,
            });
        });
    };
    TickMarks.prototype._internal_build = function (spacing, maxWidth) {
        var maxIndexesPerMark = Math.ceil(maxWidth / spacing);
        if (this._private__cache === null || this._private__cache._internal_maxIndexesPerMark !== maxIndexesPerMark) {
            this._private__cache = {
                _internal_marks: this._private__buildMarksImpl(maxIndexesPerMark),
                _internal_maxIndexesPerMark: maxIndexesPerMark,
            };
        }
        return this._private__cache._internal_marks;
    };
    TickMarks.prototype._private__buildMarksImpl = function (maxIndexesPerMark) {
        var marks = [];
        for (var _i = 0, _a = Array.from(this._private__marksByWeight.keys()).sort(function (a, b) { return b - a; }); _i < _a.length; _i++) {
            var weight = _a[_i];
            if (!this._private__marksByWeight.get(weight)) {
                continue;
            }
            // Built tickMarks are now prevMarks, and marks it as new array
            var prevMarks = marks;
            marks = [];
            var prevMarksLength = prevMarks.length;
            var prevMarksPointer = 0;
            var currentWeight = ensureDefined(this._private__marksByWeight.get(weight));
            var currentWeightLength = currentWeight.length;
            var rightIndex = Infinity;
            var leftIndex = -Infinity;
            for (var i = 0; i < currentWeightLength; i++) {
                var mark = currentWeight[i];
                var currentIndex = mark._internal_index;
                // Determine indexes with which current index will be compared
                // All marks to the right is moved to new array
                while (prevMarksPointer < prevMarksLength) {
                    var lastMark = prevMarks[prevMarksPointer];
                    var lastIndex = lastMark._internal_index;
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
