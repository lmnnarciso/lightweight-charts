/// <reference types="_build-time-constants" />
import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { isString } from '../helpers/strict-type-checks';
import { isBusinessDay, isUTCTimestamp, } from './data-consumer';
import { getSeriesPlotRowCreator, isSeriesPlotRow } from './get-series-plot-row-creator';
import { fillWeightsForPoints } from './time-scale-point-weight-generator';
function businessDayConverter(time) {
    if (!isBusinessDay(time)) {
        throw new Error('time must be of type BusinessDay');
    }
    var date = new Date(Date.UTC(time.year, time.month - 1, time.day, 0, 0, 0, 0));
    return {
        _internal_timestamp: Math.round(date.getTime() / 1000),
        _internal_businessDay: time,
    };
}
function timestampConverter(time) {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        _internal_timestamp: time,
    };
}
function selectTimeConverter(data) {
    if (data.length === 0) {
        return null;
    }
    if (isBusinessDay(data[0].time)) {
        return businessDayConverter;
    }
    return timestampConverter;
}
export function convertTime(time) {
    if (isUTCTimestamp(time)) {
        return timestampConverter(time);
    }
    if (!isBusinessDay(time)) {
        return businessDayConverter(stringToBusinessDay(time));
    }
    return businessDayConverter(time);
}
var validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;
export function stringToBusinessDay(value) {
    if (process.env.NODE_ENV === 'development') {
        // in some browsers (I look at your Chrome) the Date constructor may accept invalid date string
        // but parses them in "implementation specific" way
        // for example 2019-1-1 isn't the same as 2019-01-01 (for Chrome both are "valid" date strings)
        // see https://bugs.chromium.org/p/chromium/issues/detail?id=968939
        // so, we need to be sure that date has valid format to avoid strange behavior and hours of debugging
        // but let's do this in development build only because of perf
        if (!validDateRegex.test(value)) {
            throw new Error("Invalid date string=" + value + ", expected format=yyyy-mm-dd");
        }
    }
    var d = new Date(value);
    if (isNaN(d.getTime())) {
        throw new Error("Invalid date string=" + value + ", expected format=yyyy-mm-dd");
    }
    return {
        day: d.getUTCDate(),
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
    };
}
function convertStringToBusinessDay(value) {
    if (isString(value.time)) {
        value.time = stringToBusinessDay(value.time);
    }
}
function convertStringsToBusinessDays(data) {
    return data.forEach(convertStringToBusinessDay);
}
function createEmptyTimePointData(timePoint) {
    return { _internal_index: 0, _internal_mapping: new Map(), _internal_timePoint: timePoint };
}
var DataLayer = /** @class */ (function () {
    function DataLayer() {
        // note that _pointDataByTimePoint and _seriesRowsBySeries shares THE SAME objects in their values between each other
        // it's just different kind of maps to make usages/perf better
        this._private__pointDataByTimePoint = new Map();
        this._private__seriesRowsBySeries = new Map();
        this._private__seriesLastTimePoint = new Map();
        // this is kind of "dest" values (in opposite to "source" ones) - we don't need to modify it manually, the only by calling _syncIndexesAndApplyChanges method
        this._private__sortedTimePoints = [];
    }
    DataLayer.prototype._internal_destroy = function () {
        this._private__pointDataByTimePoint.clear();
        this._private__seriesRowsBySeries.clear();
        this._private__seriesLastTimePoint.clear();
        this._private__sortedTimePoints = [];
    };
    DataLayer.prototype._internal_setSeriesData = function (series, data) {
        var _this = this;
        // first, remove the series from data mappings if we have any data for that series
        // note we can't use _seriesRowsBySeries here because we might don't have the data there in case of whitespaces
        if (this._private__seriesLastTimePoint.has(series)) {
            this._private__pointDataByTimePoint.forEach(function (pointData) { return pointData._internal_mapping.delete(series); });
        }
        var seriesRows = [];
        if (data.length !== 0) {
            convertStringsToBusinessDays(data);
            var timeConverter_1 = ensureNotNull(selectTimeConverter(data));
            var createPlotRow_1 = getSeriesPlotRowCreator(series._internal_seriesType());
            seriesRows = data.map(function (item) {
                var time = timeConverter_1(item.time);
                var timePointData = _this._private__pointDataByTimePoint.get(time._internal_timestamp);
                if (timePointData === undefined) {
                    // the indexes will be sync later
                    timePointData = createEmptyTimePointData(time);
                    _this._private__pointDataByTimePoint.set(time._internal_timestamp, timePointData);
                }
                var row = createPlotRow_1(time, timePointData._internal_index, item);
                timePointData._internal_mapping.set(series, row);
                return row;
            });
        }
        // we delete the old data from mapping and add the new ones
        // so there might be empty points, let's remove them first
        this._private__cleanupPointsData();
        this._private__setRowsToSeries(series, seriesRows);
        return this._private__syncIndexesAndApplyChanges(series);
    };
    DataLayer.prototype._internal_removeSeries = function (series) {
        return this._internal_setSeriesData(series, []);
    };
    DataLayer.prototype._internal_updateSeriesData = function (series, data) {
        convertStringToBusinessDay(data);
        var time = ensureNotNull(selectTimeConverter([data]))(data.time);
        var lastSeriesTime = this._private__seriesLastTimePoint.get(series);
        if (lastSeriesTime !== undefined && time._internal_timestamp < lastSeriesTime._internal_timestamp) {
            throw new Error("Cannot update oldest data, last time=" + lastSeriesTime._internal_timestamp + ", new time=" + time._internal_timestamp);
        }
        var pointDataAtTime = this._private__pointDataByTimePoint.get(time._internal_timestamp);
        // if no point data found for the new data item
        // that means that we need to update scale
        var affectsTimeScale = pointDataAtTime === undefined;
        if (pointDataAtTime === undefined) {
            // the indexes will be sync later
            pointDataAtTime = createEmptyTimePointData(time);
            this._private__pointDataByTimePoint.set(time._internal_timestamp, pointDataAtTime);
        }
        var createPlotRow = getSeriesPlotRowCreator(series._internal_seriesType());
        var plotRow = createPlotRow(time, pointDataAtTime._internal_index, data);
        pointDataAtTime._internal_mapping.set(series, plotRow);
        var seriesChanges = this._private__updateLastSeriesRow(series, plotRow);
        // if point already exist on the time scale - we don't need to make a full update and just make an incremental one
        if (!affectsTimeScale) {
            var seriesUpdate = new Map();
            if (seriesChanges !== null) {
                seriesUpdate.set(series, seriesChanges);
            }
            return {
                _internal_series: seriesUpdate,
                _internal_timeScale: {
                    // base index might be updated even if no time scale point is changed
                    _internal_baseIndex: this._private__getBaseIndex(),
                },
            };
        }
        // but if we don't have such point on the time scale - we need to generate "full" update (including time scale update)
        return this._private__syncIndexesAndApplyChanges(series);
    };
    DataLayer.prototype._private__updateLastSeriesRow = function (series, plotRow) {
        var seriesData = this._private__seriesRowsBySeries.get(series);
        if (seriesData === undefined) {
            seriesData = [];
            this._private__seriesRowsBySeries.set(series, seriesData);
        }
        var lastSeriesRow = seriesData.length !== 0 ? seriesData[seriesData.length - 1] : null;
        var result = null;
        if (lastSeriesRow === null || plotRow._internal_time._internal_timestamp > lastSeriesRow._internal_time._internal_timestamp) {
            if (isSeriesPlotRow(plotRow)) {
                seriesData.push(plotRow);
                result = {
                    _internal_fullUpdate: false,
                    _internal_data: [plotRow],
                };
            }
        }
        else {
            if (isSeriesPlotRow(plotRow)) {
                seriesData[seriesData.length - 1] = plotRow;
                result = {
                    _internal_fullUpdate: false,
                    _internal_data: [plotRow],
                };
            }
            else {
                seriesData.splice(-1, 1);
                // we just removed point from series - needs generate full update
                result = {
                    _internal_fullUpdate: true,
                    _internal_data: seriesData,
                };
            }
        }
        this._private__seriesLastTimePoint.set(series, plotRow._internal_time);
        return result;
    };
    DataLayer.prototype._private__setRowsToSeries = function (series, seriesRows) {
        if (seriesRows.length !== 0) {
            this._private__seriesRowsBySeries.set(series, seriesRows.filter(isSeriesPlotRow));
            this._private__seriesLastTimePoint.set(series, seriesRows[seriesRows.length - 1]._internal_time);
        }
        else {
            this._private__seriesRowsBySeries.delete(series);
            this._private__seriesLastTimePoint.delete(series);
        }
    };
    DataLayer.prototype._private__cleanupPointsData = function () {
        // create a copy remove from points items without series
        // _pointDataByTimePoint is kind of "inbound" (or "source") value
        // which should be used to update other dest values like _sortedTimePoints
        var newPointsData = new Map();
        this._private__pointDataByTimePoint.forEach(function (pointData, key) {
            if (pointData._internal_mapping.size > 0) {
                newPointsData.set(key, pointData);
            }
        });
        this._private__pointDataByTimePoint = newPointsData;
    };
    /**
     * Sets new time scale and make indexes valid for all series
     *
     * @returns An index of the first changed point
     */
    DataLayer.prototype._private__updateTimeScalePoints = function (newTimePoints) {
        var firstChangedPointIndex = -1;
        // search the first different point and "syncing" time weight by the way
        for (var index = 0; index < this._private__sortedTimePoints.length && index < newTimePoints.length; ++index) {
            var oldPoint = this._private__sortedTimePoints[index];
            var newPoint = newTimePoints[index];
            if (oldPoint._internal_time._internal_timestamp !== newPoint._internal_time._internal_timestamp) {
                firstChangedPointIndex = index;
                break;
            }
            // re-assign point's time weight for points if time is the same (and all prior times was the same)
            newPoint._internal_timeWeight = oldPoint._internal_timeWeight;
        }
        if (firstChangedPointIndex === -1 && this._private__sortedTimePoints.length !== newTimePoints.length) {
            // the common part of the prev and the new points are the same
            // so the first changed point is the next after the common part
            firstChangedPointIndex = Math.min(this._private__sortedTimePoints.length, newTimePoints.length);
        }
        if (firstChangedPointIndex === -1) {
            // if no time scale changed, then do nothing
            return -1;
        }
        var _loop_1 = function (index) {
            var pointData = ensureDefined(this_1._private__pointDataByTimePoint.get(newTimePoints[index]._internal_time._internal_timestamp));
            // first, nevertheless update index of point data ("make it valid")
            pointData._internal_index = index;
            // and then we need to sync indexes for all series
            pointData._internal_mapping.forEach(function (seriesRow) {
                seriesRow._internal_index = index;
            });
        };
        var this_1 = this;
        // if time scale points are changed that means that we need to make full update to all series (with clearing points)
        // but first we need to synchronize indexes and re-fill time weights
        for (var index = firstChangedPointIndex; index < newTimePoints.length; ++index) {
            _loop_1(index);
        }
        // re-fill time weights for point after the first changed one
        fillWeightsForPoints(newTimePoints, firstChangedPointIndex);
        this._private__sortedTimePoints = newTimePoints;
        return firstChangedPointIndex;
    };
    DataLayer.prototype._private__getBaseIndex = function () {
        if (this._private__seriesRowsBySeries.size === 0) {
            // if we have no data then 'reset' the base index to null
            return null;
        }
        var baseIndex = 0;
        this._private__seriesRowsBySeries.forEach(function (data) {
            if (data.length !== 0) {
                baseIndex = Math.max(baseIndex, data[data.length - 1]._internal_index);
            }
        });
        return baseIndex;
    };
    /**
     * Methods syncs indexes (recalculates them applies them to point/series data) between time scale, point data and series point
     * and returns generated update for applied change.
     */
    DataLayer.prototype._private__syncIndexesAndApplyChanges = function (series) {
        // then generate the time scale points
        // timeWeight will be updates in _updateTimeScalePoints later
        var newTimeScalePoints = Array.from(this._private__pointDataByTimePoint.values()).map(function (d) { return ({ _internal_timeWeight: 0, _internal_time: d._internal_timePoint }); });
        newTimeScalePoints.sort(function (t1, t2) { return t1._internal_time._internal_timestamp - t2._internal_time._internal_timestamp; });
        var firstChangedPointIndex = this._private__updateTimeScalePoints(newTimeScalePoints);
        var dataUpdateResponse = {
            _internal_series: new Map(),
            _internal_timeScale: {
                _internal_baseIndex: this._private__getBaseIndex(),
            },
        };
        if (firstChangedPointIndex !== -1) {
            // time scale is changed, so we need to make "full" update for every series
            // TODO: it's possible to make perf improvements by checking what series has data after firstChangedPointIndex
            // but let's skip for now
            this._private__seriesRowsBySeries.forEach(function (data, s) {
                dataUpdateResponse._internal_series.set(s, { _internal_data: data, _internal_fullUpdate: true });
            });
            // if the seires data was set to [] it will have already been removed from _seriesRowBySeries
            // meaning the forEach above won't add the series to the data update response
            // so we handle that case here
            if (!this._private__seriesRowsBySeries.has(series)) {
                dataUpdateResponse._internal_series.set(series, { _internal_data: [], _internal_fullUpdate: true });
            }
            dataUpdateResponse._internal_timeScale._internal_points = this._private__sortedTimePoints;
        }
        else {
            var seriesData = this._private__seriesRowsBySeries.get(series);
            // if no seriesData found that means that we just removed the series
            dataUpdateResponse._internal_series.set(series, { _internal_data: seriesData || [], _internal_fullUpdate: true });
        }
        return dataUpdateResponse;
    };
    return DataLayer;
}());
export { DataLayer };
