export var InvalidationLevel;
(function (InvalidationLevel) {
    InvalidationLevel[InvalidationLevel["None"] = 0] = "None";
    InvalidationLevel[InvalidationLevel["Cursor"] = 1] = "Cursor";
    InvalidationLevel[InvalidationLevel["Light"] = 2] = "Light";
    InvalidationLevel[InvalidationLevel["Full"] = 3] = "Full";
})(InvalidationLevel || (InvalidationLevel = {}));
function mergePaneInvalidation(beforeValue, newValue) {
    if (beforeValue === undefined) {
        return newValue;
    }
    var level = Math.max(beforeValue.level, newValue.level);
    var autoScale = beforeValue.autoScale || newValue.autoScale;
    return { level: level, autoScale: autoScale };
}
export var TimeScaleInvalidationType;
(function (TimeScaleInvalidationType) {
    TimeScaleInvalidationType[TimeScaleInvalidationType["FitContent"] = 0] = "FitContent";
    TimeScaleInvalidationType[TimeScaleInvalidationType["ApplyRange"] = 1] = "ApplyRange";
    TimeScaleInvalidationType[TimeScaleInvalidationType["ApplyBarSpacing"] = 2] = "ApplyBarSpacing";
    TimeScaleInvalidationType[TimeScaleInvalidationType["ApplyRightOffset"] = 3] = "ApplyRightOffset";
    TimeScaleInvalidationType[TimeScaleInvalidationType["Reset"] = 4] = "Reset";
})(TimeScaleInvalidationType || (TimeScaleInvalidationType = {}));
var InvalidateMask = /** @class */ (function () {
    function InvalidateMask(globalLevel) {
        this._invalidatedPanes = new Map();
        this._force = false;
        this._timeScaleInvalidations = [];
        this._globalLevel = globalLevel;
    }
    InvalidateMask.prototype.invalidatePane = function (paneIndex, invalidation) {
        var prevValue = this._invalidatedPanes.get(paneIndex);
        var newValue = mergePaneInvalidation(prevValue, invalidation);
        this._invalidatedPanes.set(paneIndex, newValue);
    };
    InvalidateMask.prototype.fullInvalidation = function () {
        return this._globalLevel;
    };
    InvalidateMask.prototype.invalidateForPane = function (paneIndex) {
        var paneInvalidation = this._invalidatedPanes.get(paneIndex);
        if (paneInvalidation === undefined) {
            return {
                level: this._globalLevel,
            };
        }
        return {
            level: Math.max(this._globalLevel, paneInvalidation.level),
            autoScale: paneInvalidation.autoScale,
        };
    };
    InvalidateMask.prototype.setFitContent = function () {
        // modifies both bar spacing and right offset
        this._timeScaleInvalidations = [{ type: 0 /* FitContent */ }];
    };
    InvalidateMask.prototype.applyRange = function (range) {
        // modifies both bar spacing and right offset
        this._timeScaleInvalidations = [{ type: 1 /* ApplyRange */, value: range }];
    };
    InvalidateMask.prototype.resetTimeScale = function () {
        // modifies both bar spacing and right offset
        this._timeScaleInvalidations = [{ type: 4 /* Reset */ }];
    };
    InvalidateMask.prototype.setBarSpacing = function (barSpacing) {
        this._timeScaleInvalidations.push({ type: 2 /* ApplyBarSpacing */, value: barSpacing });
    };
    InvalidateMask.prototype.setRightOffset = function (offset) {
        this._timeScaleInvalidations.push({ type: 3 /* ApplyRightOffset */, value: offset });
    };
    InvalidateMask.prototype.timeScaleInvalidations = function () {
        return this._timeScaleInvalidations;
    };
    InvalidateMask.prototype.merge = function (other) {
        var _this = this;
        this._force = this._force || other._force;
        this._timeScaleInvalidations = this._timeScaleInvalidations.concat(other._timeScaleInvalidations);
        for (var _i = 0, _a = other._timeScaleInvalidations; _i < _a.length; _i++) {
            var tsInvalidation = _a[_i];
            this._applyTimeScaleInvalidation(tsInvalidation);
        }
        this._globalLevel = Math.max(this._globalLevel, other._globalLevel);
        other._invalidatedPanes.forEach(function (invalidation, index) {
            _this.invalidatePane(index, invalidation);
        });
    };
    InvalidateMask.prototype._applyTimeScaleInvalidation = function (invalidation) {
        switch (invalidation.type) {
            case 0 /* FitContent */:
                this.setFitContent();
                break;
            case 1 /* ApplyRange */:
                this.applyRange(invalidation.value);
                break;
            case 2 /* ApplyBarSpacing */:
                this.setBarSpacing(invalidation.value);
                break;
            case 3 /* ApplyRightOffset */:
                this.setRightOffset(invalidation.value);
                break;
            case 4 /* Reset */:
                this.resetTimeScale();
                break;
        }
    };
    return InvalidateMask;
}());
export { InvalidateMask };
