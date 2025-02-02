import { DateFormatter } from '../formatters/date-formatter';
import { DateTimeFormatter } from '../formatters/date-time-formatter';
import { ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { clamp } from '../helpers/mathex';
import { isInteger, merge } from '../helpers/strict-type-checks';
import { defaultTickMarkFormatter } from './default-tick-mark-formatter';
import { FormattedLabelsCache } from './formatted-labels-cache';
import { areRangesEqual, RangeImpl } from './range-impl';
import { TickMarks } from './tick-marks';
import { TimeScaleVisibleRange } from './time-scale-visible-range';
var Constants;
(function (Constants) {
    Constants[Constants["DefaultAnimationDuration"] = 400] = "DefaultAnimationDuration";
    // make sure that this (1 / MinVisibleBarsCount) >= coeff in max bar spacing
    Constants[Constants["MinVisibleBarsCount"] = 2] = "MinVisibleBarsCount";
})(Constants || (Constants = {}));
var MarkWeightBorder;
(function (MarkWeightBorder) {
    MarkWeightBorder[MarkWeightBorder["Minute"] = 20] = "Minute";
    MarkWeightBorder[MarkWeightBorder["Hour"] = 30] = "Hour";
    MarkWeightBorder[MarkWeightBorder["Day"] = 40] = "Day";
    MarkWeightBorder[MarkWeightBorder["Week"] = 50] = "Week";
    MarkWeightBorder[MarkWeightBorder["Month"] = 60] = "Month";
    MarkWeightBorder[MarkWeightBorder["Year"] = 70] = "Year";
})(MarkWeightBorder || (MarkWeightBorder = {}));
export var TickMarkType;
(function (TickMarkType) {
    TickMarkType[TickMarkType["Year"] = 0] = "Year";
    TickMarkType[TickMarkType["Month"] = 1] = "Month";
    TickMarkType[TickMarkType["DayOfMonth"] = 2] = "DayOfMonth";
    TickMarkType[TickMarkType["Time"] = 3] = "Time";
    TickMarkType[TickMarkType["TimeWithSeconds"] = 4] = "TimeWithSeconds";
})(TickMarkType || (TickMarkType = {}));
var TimeScale = /** @class */ (function () {
    function TimeScale(model, options, localizationOptions) {
        this._width = 0;
        this._baseIndexOrNull = null;
        this._points = [];
        this._scrollStartPoint = null;
        this._scaleStartPoint = null;
        this._tickMarks = new TickMarks();
        this._formattedByWeight = new Map();
        this._visibleRange = TimeScaleVisibleRange.invalid();
        this._visibleRangeInvalidated = true;
        this._visibleBarsChanged = new Delegate();
        this._logicalRangeChanged = new Delegate();
        this._optionsApplied = new Delegate();
        this._commonTransitionStartState = null;
        this._timeMarksCache = null;
        this._labels = [];
        this._options = options;
        this._localizationOptions = localizationOptions;
        this._rightOffset = options.rightOffset;
        this._barSpacing = options.barSpacing;
        this._model = model;
        this._updateDateTimeFormatter();
    }
    TimeScale.prototype.options = function () {
        return this._options;
    };
    TimeScale.prototype.applyLocalizationOptions = function (localizationOptions) {
        merge(this._localizationOptions, localizationOptions);
        this._invalidateTickMarks();
        this._updateDateTimeFormatter();
    };
    TimeScale.prototype.applyOptions = function (options, localizationOptions) {
        var _a;
        merge(this._options, options);
        if (this._options.fixLeftEdge) {
            this._doFixLeftEdge();
        }
        if (this._options.fixRightEdge) {
            this._doFixRightEdge();
        }
        // note that bar spacing should be applied before right offset
        // because right offset depends on bar spacing
        if (options.barSpacing !== undefined) {
            this._model.setBarSpacing(options.barSpacing);
        }
        if (options.rightOffset !== undefined) {
            this._model.setRightOffset(options.rightOffset);
        }
        if (options.minBarSpacing !== undefined) {
            // yes, if we apply min bar spacing then we need to correct bar spacing
            // the easiest way is to apply it once again
            this._model.setBarSpacing((_a = options.barSpacing) !== null && _a !== void 0 ? _a : this._barSpacing);
        }
        this._invalidateTickMarks();
        this._updateDateTimeFormatter();
        this._optionsApplied.fire();
    };
    TimeScale.prototype.indexToTime = function (index) {
        var _a;
        return ((_a = this._points[index]) === null || _a === void 0 ? void 0 : _a.time) || null;
    };
    TimeScale.prototype.timeToIndex = function (time, findNearest) {
        if (this._points.length < 1) {
            // no time points available
            return null;
        }
        if (time.timestamp > this._points[this._points.length - 1].time.timestamp) {
            // special case
            return findNearest ? this._points.length - 1 : null;
        }
        for (var i = 0; i < this._points.length; ++i) {
            if (time.timestamp === this._points[i].time.timestamp) {
                return i;
            }
            if (time.timestamp < this._points[i].time.timestamp) {
                return findNearest ? i : null;
            }
        }
        return null;
    };
    TimeScale.prototype.isEmpty = function () {
        return this._width === 0 || this._points.length === 0;
    };
    // strict range: integer indices of the bars in the visible range rounded in more wide direction
    TimeScale.prototype.visibleStrictRange = function () {
        this._updateVisibleRange();
        return this._visibleRange.strictRange();
    };
    TimeScale.prototype.visibleLogicalRange = function () {
        this._updateVisibleRange();
        return this._visibleRange.logicalRange();
    };
    TimeScale.prototype.visibleTimeRange = function () {
        var visibleBars = this.visibleStrictRange();
        if (visibleBars === null) {
            return null;
        }
        var range = {
            from: visibleBars.left(),
            to: visibleBars.right(),
        };
        return this.timeRangeForLogicalRange(range);
    };
    TimeScale.prototype.timeRangeForLogicalRange = function (range) {
        var from = Math.round(range.from);
        var to = Math.round(range.to);
        var firstIndex = ensureNotNull(this._firstIndex());
        var lastIndex = ensureNotNull(this._lastIndex());
        return {
            from: ensureNotNull(this.indexToTime(Math.max(firstIndex, from))),
            to: ensureNotNull(this.indexToTime(Math.min(lastIndex, to))),
        };
    };
    TimeScale.prototype.logicalRangeForTimeRange = function (range) {
        return {
            from: ensureNotNull(this.timeToIndex(range.from, true)),
            to: ensureNotNull(this.timeToIndex(range.to, true)),
        };
    };
    TimeScale.prototype.tickMarks = function () {
        return this._tickMarks;
    };
    TimeScale.prototype.width = function () {
        return this._width;
    };
    TimeScale.prototype.setWidth = function (width) {
        if (!isFinite(width) || width <= 0) {
            return;
        }
        if (this._width === width) {
            return;
        }
        if (this._options.lockVisibleTimeRangeOnResize && this._width) {
            // recalculate bar spacing
            var newBarSpacing = this._barSpacing * width / this._width;
            this._barSpacing = newBarSpacing;
        }
        // if time scale is scrolled to the end of data and we have fixed right edge
        // keep left edge instead of right
        // we need it to avoid "shaking" if the last bar visibility affects time scale width
        if (this._options.fixLeftEdge) {
            var visibleRange = this.visibleStrictRange();
            if (visibleRange !== null) {
                var firstVisibleBar = visibleRange.left();
                // firstVisibleBar could be less than 0
                // since index is a center of bar
                if (firstVisibleBar <= 0) {
                    var delta = this._width - width;
                    // reduce  _rightOffset means move right
                    // we could move more than required - this will be fixed by _correctOffset()
                    this._rightOffset -= Math.round(delta / this._barSpacing) + 1;
                }
            }
        }
        this._width = width;
        this._visibleRangeInvalidated = true;
        // updating bar spacing should be first because right offset depends on it
        this._correctBarSpacing();
        this._correctOffset();
    };
    TimeScale.prototype.indexToCoordinate = function (index) {
        if (this.isEmpty() || !isInteger(index)) {
            return 0;
        }
        var baseIndex = this.baseIndex();
        var deltaFromRight = baseIndex + this._rightOffset - index;
        var coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing - 1;
        return coordinate;
    };
    TimeScale.prototype.indexesToCoordinates = function (points, visibleRange) {
        var baseIndex = this.baseIndex();
        var indexFrom = (visibleRange === undefined) ? 0 : visibleRange.from;
        var indexTo = (visibleRange === undefined) ? points.length : visibleRange.to;
        for (var i = indexFrom; i < indexTo; i++) {
            var index = points[i].time;
            var deltaFromRight = baseIndex + this._rightOffset - index;
            var coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing - 1;
            points[i].x = coordinate;
        }
    };
    TimeScale.prototype.coordinateToIndex = function (x) {
        return Math.ceil(this._coordinateToFloatIndex(x));
    };
    TimeScale.prototype.setRightOffset = function (offset) {
        this._visibleRangeInvalidated = true;
        this._rightOffset = offset;
        this._correctOffset();
        this._model.recalculateAllPanes();
        this._model.lightUpdate();
    };
    TimeScale.prototype.barSpacing = function () {
        return this._barSpacing;
    };
    TimeScale.prototype.setBarSpacing = function (newBarSpacing) {
        this._setBarSpacing(newBarSpacing);
        // do not allow scroll out of visible bars
        this._correctOffset();
        this._model.recalculateAllPanes();
        this._model.lightUpdate();
    };
    TimeScale.prototype.rightOffset = function () {
        return this._rightOffset;
    };
    TimeScale.prototype.marks = function () {
        if (this.isEmpty()) {
            return null;
        }
        if (this._timeMarksCache !== null) {
            return this._timeMarksCache;
        }
        var spacing = this._barSpacing;
        var fontSize = this._model.options().layout.fontSize;
        var maxLabelWidth = (fontSize + 4) * 5;
        var indexPerLabel = Math.round(maxLabelWidth / spacing);
        var visibleBars = ensureNotNull(this.visibleStrictRange());
        var firstBar = Math.max(visibleBars.left(), visibleBars.left() - indexPerLabel);
        var lastBar = Math.max(visibleBars.right(), visibleBars.right() - indexPerLabel);
        var items = this._tickMarks.build(spacing, maxLabelWidth);
        // according to indexPerLabel value this value means "earliest index which _might be_ used as the second label on time scale"
        var earliestIndexOfSecondLabel = this._firstIndex() + indexPerLabel;
        // according to indexPerLabel value this value means "earliest index which _might be_ used as the second last label on time scale"
        var indexOfSecondLastLabel = this._lastIndex() - indexPerLabel;
        var targetIndex = 0;
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var tm = items_1[_i];
            if (!(firstBar <= tm.index && tm.index <= lastBar)) {
                continue;
            }
            var time = this.indexToTime(tm.index);
            if (time === null) {
                continue;
            }
            var label = void 0;
            if (targetIndex < this._labels.length) {
                label = this._labels[targetIndex];
                label.coord = this.indexToCoordinate(tm.index);
                label.label = this._formatLabel(time, tm.weight);
                label.weight = tm.weight;
            }
            else {
                label = {
                    needAlignCoordinate: false,
                    coord: this.indexToCoordinate(tm.index),
                    label: this._formatLabel(time, tm.weight),
                    weight: tm.weight,
                };
                this._labels.push(label);
            }
            if (this._barSpacing > (maxLabelWidth / 2)) {
                // if there is enough space then let's show all tick marks as usual
                label.needAlignCoordinate = false;
            }
            else {
                // if a user is able to scroll after a tick mark then show it as usual, otherwise the coordinate might be aligned
                // if the index is for the second (last) label or later (earlier) then most likely this label might be displayed without correcting the coordinate
                label.needAlignCoordinate = this._options.fixLeftEdge && tm.index <= earliestIndexOfSecondLabel || this._options.fixRightEdge && tm.index >= indexOfSecondLastLabel;
            }
            targetIndex++;
        }
        this._labels.length = targetIndex;
        this._timeMarksCache = this._labels;
        return this._labels;
    };
    TimeScale.prototype.restoreDefault = function () {
        this._visibleRangeInvalidated = true;
        this.setBarSpacing(this._options.barSpacing);
        this.setRightOffset(this._options.rightOffset);
    };
    TimeScale.prototype.setBaseIndex = function (baseIndex) {
        this._visibleRangeInvalidated = true;
        this._baseIndexOrNull = baseIndex;
        this._correctOffset();
        this._doFixLeftEdge();
    };
    /**
     * Zoom in/out the scale around a `zoomPoint` on `scale` value.
     *
     * @param zoomPoint - X coordinate of the point to apply the zoom.
     * If `rightBarStaysOnScroll` option is disabled, then will be used to restore right offset.
     * @param scale - Zoom value (in 1/10 parts of current bar spacing).
     * Negative value means zoom out, positive - zoom in.
     */
    TimeScale.prototype.zoom = function (zoomPoint, scale) {
        var floatIndexAtZoomPoint = this._coordinateToFloatIndex(zoomPoint);
        var barSpacing = this.barSpacing();
        var newBarSpacing = barSpacing + scale * (barSpacing / 10);
        // zoom in/out bar spacing
        this.setBarSpacing(newBarSpacing);
        if (!this._options.rightBarStaysOnScroll) {
            // and then correct right offset to move index under zoomPoint back to its coordinate
            this.setRightOffset(this.rightOffset() + (floatIndexAtZoomPoint - this._coordinateToFloatIndex(zoomPoint)));
        }
    };
    TimeScale.prototype.startScale = function (x) {
        if (this._scrollStartPoint) {
            this.endScroll();
        }
        if (this._scaleStartPoint !== null || this._commonTransitionStartState !== null) {
            return;
        }
        if (this.isEmpty()) {
            return;
        }
        this._scaleStartPoint = x;
        this._saveCommonTransitionsStartState();
    };
    TimeScale.prototype.scaleTo = function (x) {
        if (this._commonTransitionStartState === null) {
            return;
        }
        var startLengthFromRight = clamp(this._width - x, 0, this._width);
        var currentLengthFromRight = clamp(this._width - ensureNotNull(this._scaleStartPoint), 0, this._width);
        if (startLengthFromRight === 0 || currentLengthFromRight === 0) {
            return;
        }
        this.setBarSpacing(this._commonTransitionStartState.barSpacing * startLengthFromRight / currentLengthFromRight);
    };
    TimeScale.prototype.endScale = function () {
        if (this._scaleStartPoint === null) {
            return;
        }
        this._scaleStartPoint = null;
        this._clearCommonTransitionsStartState();
    };
    TimeScale.prototype.startScroll = function (x) {
        if (this._scrollStartPoint !== null || this._commonTransitionStartState !== null) {
            return;
        }
        if (this.isEmpty()) {
            return;
        }
        this._scrollStartPoint = x;
        this._saveCommonTransitionsStartState();
    };
    TimeScale.prototype.scrollTo = function (x) {
        if (this._scrollStartPoint === null) {
            return;
        }
        var shiftInLogical = (this._scrollStartPoint - x) / this.barSpacing();
        this._rightOffset = ensureNotNull(this._commonTransitionStartState).rightOffset + shiftInLogical;
        this._visibleRangeInvalidated = true;
        // do not allow scroll out of visible bars
        this._correctOffset();
    };
    TimeScale.prototype.endScroll = function () {
        if (this._scrollStartPoint === null) {
            return;
        }
        this._scrollStartPoint = null;
        this._clearCommonTransitionsStartState();
    };
    TimeScale.prototype.scrollToRealTime = function () {
        this.scrollToOffsetAnimated(this._options.rightOffset);
    };
    TimeScale.prototype.scrollToOffsetAnimated = function (offset, animationDuration) {
        var _this = this;
        if (animationDuration === void 0) { animationDuration = 400 /* DefaultAnimationDuration */; }
        if (!isFinite(offset)) {
            throw new RangeError('offset is required and must be finite number');
        }
        if (!isFinite(animationDuration) || animationDuration <= 0) {
            throw new RangeError('animationDuration (optional) must be finite positive number');
        }
        var source = this._rightOffset;
        var animationStart = performance.now();
        var animationFn = function () {
            var animationProgress = (performance.now() - animationStart) / animationDuration;
            var finishAnimation = animationProgress >= 1;
            var rightOffset = finishAnimation ? offset : source + (offset - source) * animationProgress;
            _this.setRightOffset(rightOffset);
            if (!finishAnimation) {
                setTimeout(animationFn, 20);
            }
        };
        animationFn();
    };
    TimeScale.prototype.update = function (newPoints) {
        this._visibleRangeInvalidated = true;
        this._points = newPoints;
        this._tickMarks.setTimeScalePoints(newPoints);
        this._correctOffset();
    };
    TimeScale.prototype.visibleBarsChanged = function () {
        return this._visibleBarsChanged;
    };
    TimeScale.prototype.logicalRangeChanged = function () {
        return this._logicalRangeChanged;
    };
    TimeScale.prototype.optionsApplied = function () {
        return this._optionsApplied;
    };
    TimeScale.prototype.baseIndex = function () {
        // null is used to known that baseIndex is not set yet
        // so in methods which should known whether it is set or not
        // we should check field `_baseIndexOrNull` instead of getter `baseIndex()`
        // see minRightOffset for example
        return this._baseIndexOrNull || 0;
    };
    TimeScale.prototype.setVisibleRange = function (range) {
        var length = range.count();
        this._setBarSpacing(this._width / length);
        this._rightOffset = range.right() - this.baseIndex();
        this._correctOffset();
        this._visibleRangeInvalidated = true;
        this._model.recalculateAllPanes();
        this._model.lightUpdate();
    };
    TimeScale.prototype.fitContent = function () {
        var first = this._firstIndex();
        var last = this._lastIndex();
        if (first === null || last === null) {
            return;
        }
        this.setVisibleRange(new RangeImpl(first, last + this._options.rightOffset));
    };
    TimeScale.prototype.setLogicalRange = function (range) {
        var barRange = new RangeImpl(range.from, range.to);
        this.setVisibleRange(barRange);
    };
    TimeScale.prototype.formatDateTime = function (time) {
        if (this._localizationOptions.timeFormatter !== undefined) {
            return this._localizationOptions.timeFormatter(time.businessDay || time.timestamp);
        }
        return this._dateTimeFormatter.format(new Date(time.timestamp * 1000));
    };
    TimeScale.prototype._firstIndex = function () {
        return this._points.length === 0 ? null : 0;
    };
    TimeScale.prototype._lastIndex = function () {
        return this._points.length === 0 ? null : (this._points.length - 1);
    };
    TimeScale.prototype._rightOffsetForCoordinate = function (x) {
        return (this._width - 1 - x) / this._barSpacing;
    };
    TimeScale.prototype._coordinateToFloatIndex = function (x) {
        var deltaFromRight = this._rightOffsetForCoordinate(x);
        var baseIndex = this.baseIndex();
        var index = baseIndex + this._rightOffset - deltaFromRight;
        // JavaScript uses very strange rounding
        // we need rounding to avoid problems with calculation errors
        return Math.round(index * 1000000) / 1000000;
    };
    TimeScale.prototype._setBarSpacing = function (newBarSpacing) {
        var oldBarSpacing = this._barSpacing;
        this._barSpacing = newBarSpacing;
        this._correctBarSpacing();
        // this._barSpacing might be changed in _correctBarSpacing
        if (oldBarSpacing !== this._barSpacing) {
            this._visibleRangeInvalidated = true;
            this._resetTimeMarksCache();
        }
    };
    TimeScale.prototype._updateVisibleRange = function () {
        if (!this._visibleRangeInvalidated) {
            return;
        }
        this._visibleRangeInvalidated = false;
        if (this.isEmpty()) {
            this._setVisibleRange(TimeScaleVisibleRange.invalid());
            return;
        }
        var baseIndex = this.baseIndex();
        var newBarsLength = this._width / this._barSpacing;
        var rightBorder = this._rightOffset + baseIndex;
        var leftBorder = rightBorder - newBarsLength + 1;
        var logicalRange = new RangeImpl(leftBorder, rightBorder);
        this._setVisibleRange(new TimeScaleVisibleRange(logicalRange));
    };
    TimeScale.prototype._correctBarSpacing = function () {
        var minBarSpacing = this._minBarSpacing();
        if (this._barSpacing < minBarSpacing) {
            this._barSpacing = minBarSpacing;
            this._visibleRangeInvalidated = true;
        }
        if (this._width !== 0) {
            // make sure that this (1 / Constants.MinVisibleBarsCount) >= coeff in max bar spacing (it's 0.5 here)
            var maxBarSpacing = this._width * 0.5;
            if (this._barSpacing > maxBarSpacing) {
                this._barSpacing = maxBarSpacing;
                this._visibleRangeInvalidated = true;
            }
        }
    };
    TimeScale.prototype._minBarSpacing = function () {
        // if both options are enabled then limit bar spacing so that zooming-out is not possible
        // if it would cause either the first or last points to move too far from an edge
        if (this._options.fixLeftEdge && this._options.fixRightEdge && this._points.length !== 0) {
            return this._width / this._points.length;
        }
        return this._options.minBarSpacing;
    };
    TimeScale.prototype._correctOffset = function () {
        // block scrolling of to future
        var maxRightOffset = this._maxRightOffset();
        if (this._rightOffset > maxRightOffset) {
            this._rightOffset = maxRightOffset;
            this._visibleRangeInvalidated = true;
        }
        // block scrolling of to past
        var minRightOffset = this._minRightOffset();
        if (minRightOffset !== null && this._rightOffset < minRightOffset) {
            this._rightOffset = minRightOffset;
            this._visibleRangeInvalidated = true;
        }
    };
    TimeScale.prototype._minRightOffset = function () {
        var firstIndex = this._firstIndex();
        var baseIndex = this._baseIndexOrNull;
        if (firstIndex === null || baseIndex === null) {
            return null;
        }
        var barsEstimation = this._options.fixLeftEdge
            ? this._width / this._barSpacing
            : Math.min(2 /* MinVisibleBarsCount */, this._points.length);
        return firstIndex - baseIndex - 1 + barsEstimation;
    };
    TimeScale.prototype._maxRightOffset = function () {
        return this._options.fixRightEdge
            ? 0
            : (this._width / this._barSpacing) - Math.min(2 /* MinVisibleBarsCount */, this._points.length);
    };
    TimeScale.prototype._saveCommonTransitionsStartState = function () {
        this._commonTransitionStartState = {
            barSpacing: this.barSpacing(),
            rightOffset: this.rightOffset(),
        };
    };
    TimeScale.prototype._clearCommonTransitionsStartState = function () {
        this._commonTransitionStartState = null;
    };
    TimeScale.prototype._formatLabel = function (time, weight) {
        var _this = this;
        var formatter = this._formattedByWeight.get(weight);
        if (formatter === undefined) {
            formatter = new FormattedLabelsCache(function (timePoint) {
                return _this._formatLabelImpl(timePoint, weight);
            });
            this._formattedByWeight.set(weight, formatter);
        }
        return formatter.format(time);
    };
    TimeScale.prototype._formatLabelImpl = function (timePoint, weight) {
        var _a;
        var tickMarkType;
        var timeVisible = this._options.timeVisible;
        if (weight < 20 /* Minute */ && timeVisible) {
            tickMarkType = this._options.secondsVisible ? 4 /* TimeWithSeconds */ : 3 /* Time */;
        }
        else if (weight < 40 /* Day */ && timeVisible) {
            tickMarkType = 3 /* Time */;
        }
        else if (weight < 50 /* Week */) {
            tickMarkType = 2 /* DayOfMonth */;
        }
        else if (weight < 60 /* Month */) {
            tickMarkType = 2 /* DayOfMonth */;
        }
        else if (weight < 70 /* Year */) {
            tickMarkType = 1 /* Month */;
        }
        else {
            tickMarkType = 0 /* Year */;
        }
        if (this._options.tickMarkFormatter !== undefined) {
            // this is temporary solution to make more consistency API
            // it looks like that all time types in API should have the same form
            // but for know defaultTickMarkFormatter is on model level and can't determine whether passed time is business day or UTCTimestamp
            // because type guards are declared on API level
            // in other hand, type guards couldn't be declared on model level so far
            // because they are know about string representation of business day ¯\_(ツ)_/¯
            // let's fix in for all cases for the whole API
            return this._options.tickMarkFormatter((_a = timePoint.businessDay) !== null && _a !== void 0 ? _a : timePoint.timestamp, tickMarkType, this._localizationOptions.locale);
        }
        return defaultTickMarkFormatter(timePoint, tickMarkType, this._localizationOptions.locale);
    };
    TimeScale.prototype._setVisibleRange = function (newVisibleRange) {
        var oldVisibleRange = this._visibleRange;
        this._visibleRange = newVisibleRange;
        if (!areRangesEqual(oldVisibleRange.strictRange(), this._visibleRange.strictRange())) {
            this._visibleBarsChanged.fire();
        }
        if (!areRangesEqual(oldVisibleRange.logicalRange(), this._visibleRange.logicalRange())) {
            this._logicalRangeChanged.fire();
        }
        // TODO: reset only coords in case when this._visibleBars has not been changed
        this._resetTimeMarksCache();
    };
    TimeScale.prototype._resetTimeMarksCache = function () {
        this._timeMarksCache = null;
    };
    TimeScale.prototype._invalidateTickMarks = function () {
        this._resetTimeMarksCache();
        this._formattedByWeight.clear();
    };
    TimeScale.prototype._updateDateTimeFormatter = function () {
        var dateFormat = this._localizationOptions.dateFormat;
        if (this._options.timeVisible) {
            this._dateTimeFormatter = new DateTimeFormatter({
                dateFormat: dateFormat,
                timeFormat: this._options.secondsVisible ? '%h:%m:%s' : '%h:%m',
                dateTimeSeparator: '   ',
                locale: this._localizationOptions.locale,
            });
        }
        else {
            this._dateTimeFormatter = new DateFormatter(dateFormat, this._localizationOptions.locale);
        }
    };
    TimeScale.prototype._doFixLeftEdge = function () {
        if (!this._options.fixLeftEdge) {
            return;
        }
        var firstIndex = this._firstIndex();
        if (firstIndex === null) {
            return;
        }
        var visibleRange = this.visibleStrictRange();
        if (visibleRange === null) {
            return;
        }
        var delta = visibleRange.left() - firstIndex;
        if (delta < 0) {
            var leftEdgeOffset = this._rightOffset - delta - 1;
            this.setRightOffset(leftEdgeOffset);
        }
        this._correctBarSpacing();
    };
    TimeScale.prototype._doFixRightEdge = function () {
        this._correctOffset();
        this._correctBarSpacing();
    };
    return TimeScale;
}());
export { TimeScale };
