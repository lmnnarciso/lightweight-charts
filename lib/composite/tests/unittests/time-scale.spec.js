"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var time_scale_options_defaults_1 = require("../../src/api/options/time-scale-options-defaults");
var time_scale_1 = require("../../src/model/time-scale");
function chartModelMock() {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
        recalculateAllPanes: function () { },
        lightUpdate: function () { },
    };
}
function tsUpdate(to) {
    var points = [];
    var startIndex = 0;
    for (var i = startIndex; i <= to; ++i) {
        points.push({ time: { timestamp: i }, timeWeight: 20 });
    }
    return [points];
}
(0, mocha_1.describe)('TimeScale', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var fakeLocalizationOptions = {};
    (0, mocha_1.it)('indexToCoordinate and coordinateToIndex inverse', function () {
        var lastIndex = 499;
        var ts = new time_scale_1.TimeScale(chartModelMock(), (0, tslib_1.__assign)((0, tslib_1.__assign)({}, time_scale_options_defaults_1.timeScaleOptionsDefaults), { barSpacing: 1, rightOffset: 0 }), fakeLocalizationOptions);
        ts.setWidth(500);
        ts.update.apply(ts, tsUpdate(lastIndex));
        ts.setBaseIndex(lastIndex);
        (0, chai_1.expect)(ts.indexToCoordinate(ts.coordinateToIndex(499.5))).to.be.equal(499.5);
    });
    (0, mocha_1.it)('all *ToCoordinate functions should return same coordinate for the same index', function () {
        var lastIndex = 499;
        var ts = new time_scale_1.TimeScale(chartModelMock(), (0, tslib_1.__assign)((0, tslib_1.__assign)({}, time_scale_options_defaults_1.timeScaleOptionsDefaults), { barSpacing: 1, rightOffset: 0 }), fakeLocalizationOptions);
        ts.setWidth(500);
        ts.update.apply(ts, tsUpdate(lastIndex));
        ts.setBaseIndex(lastIndex);
        var index = 1;
        var expectedValue = 0.5;
        (0, chai_1.expect)(ts.indexToCoordinate(index)).to.be.equal(expectedValue, 'indexToCoordinate');
        {
            var indexes = [{ time: index, x: 0 }];
            ts.indexesToCoordinates(indexes);
            (0, chai_1.expect)(indexes[0].x).to.be.equal(expectedValue, 'indexesToCoordinates');
        }
    });
});
