import { assert } from '../../helpers/assertions';
import { applyAlpha } from '../../helpers/color';
import { SeriesLastPriceAnimationRenderer } from '../../renderers/series-last-price-animation-renderer';
var Constants;
(function (Constants) {
    Constants[Constants["AnimationPeriod"] = 2600] = "AnimationPeriod";
    Constants[Constants["Stage1Period"] = 0.25] = "Stage1Period";
    Constants[Constants["Stage2Period"] = 0.275] = "Stage2Period";
    Constants[Constants["Stage3Period"] = 0.475] = "Stage3Period";
    Constants[Constants["Stage1StartCircleRadius"] = 4] = "Stage1StartCircleRadius";
    Constants[Constants["Stage1EndCircleRadius"] = 10] = "Stage1EndCircleRadius";
    Constants[Constants["Stage1StartFillAlpha"] = 0.25] = "Stage1StartFillAlpha";
    Constants[Constants["Stage1EndFillAlpha"] = 0] = "Stage1EndFillAlpha";
    Constants[Constants["Stage1StartStrokeAlpha"] = 0.4] = "Stage1StartStrokeAlpha";
    Constants[Constants["Stage1EndStrokeAlpha"] = 0.8] = "Stage1EndStrokeAlpha";
    Constants[Constants["Stage2StartCircleRadius"] = 10] = "Stage2StartCircleRadius";
    Constants[Constants["Stage2EndCircleRadius"] = 14] = "Stage2EndCircleRadius";
    Constants[Constants["Stage2StartFillAlpha"] = 0] = "Stage2StartFillAlpha";
    Constants[Constants["Stage2EndFillAlpha"] = 0] = "Stage2EndFillAlpha";
    Constants[Constants["Stage2StartStrokeAlpha"] = 0.8] = "Stage2StartStrokeAlpha";
    Constants[Constants["Stage2EndStrokeAlpha"] = 0] = "Stage2EndStrokeAlpha";
    Constants[Constants["Stage3StartCircleRadius"] = 14] = "Stage3StartCircleRadius";
    Constants[Constants["Stage3EndCircleRadius"] = 14] = "Stage3EndCircleRadius";
    Constants[Constants["Stage3StartFillAlpha"] = 0] = "Stage3StartFillAlpha";
    Constants[Constants["Stage3EndFillAlpha"] = 0] = "Stage3EndFillAlpha";
    Constants[Constants["Stage3StartStrokeAlpha"] = 0] = "Stage3StartStrokeAlpha";
    Constants[Constants["Stage3EndStrokeAlpha"] = 0] = "Stage3EndStrokeAlpha";
})(Constants || (Constants = {}));
var animationStagesData = [
    {
        start: 0,
        end: 0.25 /* Stage1Period */,
        startRadius: 4 /* Stage1StartCircleRadius */,
        endRadius: 10 /* Stage1EndCircleRadius */,
        startFillAlpha: 0.25 /* Stage1StartFillAlpha */,
        endFillAlpha: 0 /* Stage1EndFillAlpha */,
        startStrokeAlpha: 0.4 /* Stage1StartStrokeAlpha */,
        endStrokeAlpha: 0.8 /* Stage1EndStrokeAlpha */,
    },
    {
        start: 0.25 /* Stage1Period */,
        end: 0.25 /* Stage1Period */ + 0.275 /* Stage2Period */,
        startRadius: 10 /* Stage2StartCircleRadius */,
        endRadius: 14 /* Stage2EndCircleRadius */,
        startFillAlpha: 0 /* Stage2StartFillAlpha */,
        endFillAlpha: 0 /* Stage2EndFillAlpha */,
        startStrokeAlpha: 0.8 /* Stage2StartStrokeAlpha */,
        endStrokeAlpha: 0 /* Stage2EndStrokeAlpha */,
    },
    {
        start: 0.25 /* Stage1Period */ + 0.275 /* Stage2Period */,
        end: 0.25 /* Stage1Period */ + 0.275 /* Stage2Period */ + 0.475 /* Stage3Period */,
        startRadius: 14 /* Stage3StartCircleRadius */,
        endRadius: 14 /* Stage3EndCircleRadius */,
        startFillAlpha: 0 /* Stage3StartFillAlpha */,
        endFillAlpha: 0 /* Stage3EndFillAlpha */,
        startStrokeAlpha: 0 /* Stage3StartStrokeAlpha */,
        endStrokeAlpha: 0 /* Stage3EndStrokeAlpha */,
    },
];
function color(seriesLineColor, stage, startAlpha, endAlpha) {
    var alpha = startAlpha + (endAlpha - startAlpha) * stage;
    return applyAlpha(seriesLineColor, alpha);
}
function radius(stage, startRadius, endRadius) {
    return startRadius + (endRadius - startRadius) * stage;
}
function animationData(durationSinceStart, lineColor) {
    var globalStage = (durationSinceStart % 2600 /* AnimationPeriod */) / 2600 /* AnimationPeriod */;
    var currentStageData;
    for (var _i = 0, animationStagesData_1 = animationStagesData; _i < animationStagesData_1.length; _i++) {
        var stageData = animationStagesData_1[_i];
        if (globalStage >= stageData.start && globalStage <= stageData.end) {
            currentStageData = stageData;
            break;
        }
    }
    assert(currentStageData !== undefined, 'Last price animation internal logic error');
    var subStage = (globalStage - currentStageData.start) / (currentStageData.end - currentStageData.start);
    return {
        fillColor: color(lineColor, subStage, currentStageData.startFillAlpha, currentStageData.endFillAlpha),
        strokeColor: color(lineColor, subStage, currentStageData.startStrokeAlpha, currentStageData.endStrokeAlpha),
        radius: radius(subStage, currentStageData.startRadius, currentStageData.endRadius),
    };
}
var SeriesLastPriceAnimationPaneView = /** @class */ (function () {
    function SeriesLastPriceAnimationPaneView(series) {
        this._renderer = new SeriesLastPriceAnimationRenderer();
        this._invalidated = true;
        this._stageInvalidated = true;
        this._startTime = performance.now();
        this._endTime = this._startTime - 1;
        this._series = series;
    }
    SeriesLastPriceAnimationPaneView.prototype.update = function (updateType) {
        this._invalidated = true;
        if (updateType === 'data') {
            if (this._series.options().lastPriceAnimation === 2 /* OnDataUpdate */) {
                var now = performance.now();
                var timeToAnimationEnd = this._endTime - now;
                if (timeToAnimationEnd > 0) {
                    if (timeToAnimationEnd < 2600 /* AnimationPeriod */ / 4) {
                        this._endTime += 2600 /* AnimationPeriod */;
                    }
                    return;
                }
                this._startTime = now;
                this._endTime = now + 2600 /* AnimationPeriod */;
            }
        }
    };
    SeriesLastPriceAnimationPaneView.prototype.invalidateStage = function () {
        this._stageInvalidated = true;
    };
    SeriesLastPriceAnimationPaneView.prototype.visible = function () {
        // center point is always visible if lastPriceAnimation is not LastPriceAnimationMode.Disabled
        return this._series.options().lastPriceAnimation !== 0 /* Disabled */;
    };
    SeriesLastPriceAnimationPaneView.prototype.animationActive = function () {
        switch (this._series.options().lastPriceAnimation) {
            case 0 /* Disabled */:
                return false;
            case 1 /* Continuous */:
                return true;
            case 2 /* OnDataUpdate */:
                return performance.now() <= this._endTime;
        }
    };
    SeriesLastPriceAnimationPaneView.prototype.renderer = function (height, width) {
        if (this._invalidated) {
            this._updateImpl(height, width);
            this._invalidated = false;
            this._stageInvalidated = false;
        }
        else if (this._stageInvalidated) {
            this._updateRendererDataStage();
            this._stageInvalidated = false;
        }
        return this._renderer;
    };
    SeriesLastPriceAnimationPaneView.prototype._updateImpl = function (height, width) {
        this._renderer.setData(null);
        var timeScale = this._series.model().timeScale();
        var visibleRange = timeScale.visibleStrictRange();
        var firstValue = this._series.firstValue();
        if (visibleRange === null || firstValue === null) {
            return;
        }
        var lastValue = this._series.lastValueData(true, true);
        if (!visibleRange.contains(lastValue.index)) {
            return;
        }
        var lastValuePoint = {
            x: timeScale.indexToCoordinate(lastValue.index),
            y: this._series.priceScale().priceToCoordinate(lastValue.price, firstValue.value),
        };
        var seriesLineColor = lastValue.color;
        var seriesLineWidth = this._series.options().lineWidth;
        var data = animationData(this._duration(), seriesLineColor);
        this._renderer.setData({
            seriesLineColor: seriesLineColor,
            seriesLineWidth: seriesLineWidth,
            fillColor: data.fillColor,
            strokeColor: data.strokeColor,
            radius: data.radius,
            center: lastValuePoint,
        });
    };
    SeriesLastPriceAnimationPaneView.prototype._updateRendererDataStage = function () {
        var rendererData = this._renderer.data();
        if (rendererData !== null) {
            var data = animationData(this._duration(), rendererData.seriesLineColor);
            rendererData.fillColor = data.fillColor;
            rendererData.strokeColor = data.strokeColor;
            rendererData.radius = data.radius;
        }
    };
    SeriesLastPriceAnimationPaneView.prototype._duration = function () {
        return this.animationActive() ? performance.now() - this._startTime : 2600 /* AnimationPeriod */ - 1;
    };
    return SeriesLastPriceAnimationPaneView;
}());
export { SeriesLastPriceAnimationPaneView };
