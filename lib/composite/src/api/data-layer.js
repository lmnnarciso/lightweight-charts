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
        timestamp: Math.round(date.getTime() / 1000),
        businessDay: time,
    };
}
function timestampConverter(time) {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        timestamp: time,
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
    return { index: 0, mapping: new Map(), timePoint: timePoint };
}
var DataLayer = /** @class */ (function () {
    function DataLayer() {
        // note that _pointDataByTimePoint and _seriesRowsBySeries shares THE SAME objects in their values between each other
        // it's just different kind of maps to make usages/perf better
        this._pointDataByTimePoint = new Map();
        this._seriesRowsBySeries = new Map();
        this._seriesLastTimePoint = new Map();
        // this is kind of "dest" values (in opposite to "source" ones) - we don't need to modify it manually, the only by calling _syncIndexesAndApplyChanges method
        this._sortedTimePoints = [];
    }
    DataLayer.prototype.destroy = function () {
        this._pointDataByTimePoint.clear();
        this._seriesRowsBySeries.clear();
        this._seriesLastTimePoint.clear();
        this._sortedTimePoints = [];
    };
    DataLayer.prototype.setSeriesData = function (series, data) {
        var _this = this;
        // first, remove the series from data mappings if we have any data for that series
        // note we can't use _seriesRowsBySeries here because we might don't have the data there in case of whitespaces
        if (this._seriesLastTimePoint.has(series)) {
            this._pointDataByTimePoint.forEach(function (pointData) { return pointData.mapping.delete(series); });
        }
        var seriesRows = [];
        if (data.length !== 0) {
            convertStringsToBusinessDays(data);
            var timeConverter_1 = ensureNotNull(selectTimeConverter(data));
            var createPlotRow_1 = getSeriesPlotRowCreator(series.seriesType());
            seriesRows = data.map(function (item) {
                var time = timeConverter_1(item.time);
                var timePointData = _this._pointDataByTimePoint.get(time.timestamp);
                if (timePointData === undefined) {
                    // the indexes will be sync later
                    timePointData = createEmptyTimePointData(time);
                    _this._pointDataByTimePoint.set(time.timestamp, timePointData);
                }
                var row = createPlotRow_1(time, timePointData.index, item);
                timePointData.mapping.set(series, row);
                return row;
            });
        }
        // we delete the old data from mapping and add the new ones
        // so there might be empty points, let's remove them first
        this._cleanupPointsData();
        this._setRowsToSeries(series, seriesRows);
        return this._syncIndexesAndApplyChanges(series);
    };
    DataLayer.prototype.removeSeries = function (series) {
        return this.setSeriesData(series, []);
    };
    DataLayer.prototype.updateSeriesData = function (series, data) {
        convertStringToBusinessDay(data);
        var time = ensureNotNull(selectTimeConverter([data]))(data.time);
        var lastSeriesTime = this._seriesLastTimePoint.get(series);
        if (lastSeriesTime !== undefined && time.timestamp < lastSeriesTime.timestamp) {
            throw new Error("Cannot update oldest data, last time=" + lastSeriesTime.timestamp + ", new time=" + time.timestamp);
        }
        var pointDataAtTime = this._pointDataByTimePoint.get(time.timestamp);
        // if no point data found for the new data item
        // that means that we need to update scale
        var affectsTimeScale = pointDataAtTime === undefined;
        if (pointDataAtTime === undefined) {
            // the indexes will be sync later
            pointDataAtTime = createEmptyTimePointData(time);
            this._pointDataByTimePoint.set(time.timestamp, pointDataAtTime);
        }
        var createPlotRow = getSeriesPlotRowCreator(series.seriesType());
        var plotRow = createPlotRow(time, pointDataAtTime.index, data);
        pointDataAtTime.mapping.set(series, plotRow);
        var seriesChanges = this._updateLastSeriesRow(series, plotRow);
        // if point already exist on the time scale - we don't need to make a full update and just make an incremental one
        if (!affectsTimeScale) {
            var seriesUpdate = new Map();
            if (seriesChanges !== null) {
                seriesUpdate.set(series, seriesChanges);
            }
            return {
                series: seriesUpdate,
                timeScale: {
                    // base index might be updated even if no time scale point is changed
                    baseIndex: this._getBaseIndex(),
                },
            };
        }
        // but if we don't have such point on the time scale - we need to generate "full" update (including time scale update)
        return this._syncIndexesAndApplyChanges(series);
    };
    DataLayer.prototype._updateLastSeriesRow = function (series, plotRow) {
        var seriesData = this._seriesRowsBySeries.get(series);
        if (seriesData === undefined) {
            seriesData = [];
            this._seriesRowsBySeries.set(series, seriesData);
        }
        var lastSeriesRow = seriesData.length !== 0 ? seriesData[seriesData.length - 1] : null;
        var result = null;
        if (lastSeriesRow === null || plotRow.time.timestamp > lastSeriesRow.time.timestamp) {
            if (isSeriesPlotRow(plotRow)) {
                seriesData.push(plotRow);
                result = {
                    fullUpdate: false,
                    data: [plotRow],
                };
            }
        }
        else {
            if (isSeriesPlotRow(plotRow)) {
                seriesData[seriesData.length - 1] = plotRow;
                result = {
                    fullUpdate: false,
                    data: [plotRow],
                };
            }
            else {
                seriesData.splice(-1, 1);
                // we just removed point from series - needs generate full update
                result = {
                    fullUpdate: true,
                    data: seriesData,
                };
            }
        }
        this._seriesLastTimePoint.set(series, plotRow.time);
        return result;
    };
    DataLayer.prototype._setRowsToSeries = function (series, seriesRows) {
        if (seriesRows.length !== 0) {
            this._seriesRowsBySeries.set(series, seriesRows.filter(isSeriesPlotRow));
            this._seriesLastTimePoint.set(series, seriesRows[seriesRows.length - 1].time);
        }
        else {
            this._seriesRowsBySeries.delete(series);
            this._seriesLastTimePoint.delete(series);
        }
    };
    DataLayer.prototype._cleanupPointsData = function () {
        // create a copy remove from points items without series
        // _pointDataByTimePoint is kind of "inbound" (or "source") value
        // which should be used to update other dest values like _sortedTimePoints
        var newPointsData = new Map();
        this._pointDataByTimePoint.forEach(function (pointData, key) {
            if (pointData.mapping.size > 0) {
                newPointsData.set(key, pointData);
            }
        });
        this._pointDataByTimePoint = newPointsData;
    };
    /**
     * Sets new time scale and make indexes valid for all series
     *
     * @returns An index of the first changed point
     */
    DataLayer.prototype._updateTimeScalePoints = function (newTimePoints) {
        var firstChangedPointIndex = -1;
        // search the first different point and "syncing" time weight by the way
        for (var index = 0; index < this._sortedTimePoints.length && index < newTimePoints.length; ++index) {
            var oldPoint = this._sortedTimePoints[index];
            var newPoint = newTimePoints[index];
            if (oldPoint.time.timestamp !== newPoint.time.timestamp) {
                firstChangedPointIndex = index;
                break;
            }
            // re-assign point's time weight for points if time is the same (and all prior times was the same)
            newPoint.timeWeight = oldPoint.timeWeight;
        }
        if (firstChangedPointIndex === -1 && this._sortedTimePoints.length !== newTimePoints.length) {
            // the common part of the prev and the new points are the same
            // so the first changed point is the next after the common part
            firstChangedPointIndex = Math.min(this._sortedTimePoints.length, newTimePoints.length);
        }
        if (firstChangedPointIndex === -1) {
            // if no time scale changed, then do nothing
            return -1;
        }
        var _loop_1 = function (index) {
            var pointData = ensureDefined(this_1._pointDataByTimePoint.get(newTimePoints[index].time.timestamp));
            // first, nevertheless update index of point data ("make it valid")
            pointData.index = index;
            // and then we need to sync indexes for all series
            pointData.mapping.forEach(function (seriesRow) {
                seriesRow.index = index;
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
        this._sortedTimePoints = newTimePoints;
        return firstChangedPointIndex;
    };
    DataLayer.prototype._getBaseIndex = function () {
        if (this._seriesRowsBySeries.size === 0) {
            // if we have no data then 'reset' the base index to null
            return null;
        }
        var baseIndex = 0;
        this._seriesRowsBySeries.forEach(function (data) {
            if (data.length !== 0) {
                baseIndex = Math.max(baseIndex, data[data.length - 1].index);
            }
        });
        return baseIndex;
    };
    /**
     * Methods syncs indexes (recalculates them applies them to point/series data) between time scale, point data and series point
     * and returns generated update for applied change.
     */
    DataLayer.prototype._syncIndexesAndApplyChanges = function (series) {
        // then generate the time scale points
        // timeWeight will be updates in _updateTimeScalePoints later
        var newTimeScalePoints = Array.from(this._pointDataByTimePoint.values()).map(function (d) { return ({ timeWeight: 0, time: d.timePoint }); });
        newTimeScalePoints.sort(function (t1, t2) { return t1.time.timestamp - t2.time.timestamp; });
        var firstChangedPointIndex = this._updateTimeScalePoints(newTimeScalePoints);
        var dataUpdateResponse = {
            series: new Map(),
            timeScale: {
                baseIndex: this._getBaseIndex(),
            },
        };
        if (firstChangedPointIndex !== -1) {
            // time scale is changed, so we need to make "full" update for every series
            // TODO: it's possible to make perf improvements by checking what series has data after firstChangedPointIndex
            // but let's skip for now
            this._seriesRowsBySeries.forEach(function (data, s) {
                dataUpdateResponse.series.set(s, { data: data, fullUpdate: true });
            });
            // if the seires data was set to [] it will have already been removed from _seriesRowBySeries
            // meaning the forEach above won't add the series to the data update response
            // so we handle that case here
            if (!this._seriesRowsBySeries.has(series)) {
                dataUpdateResponse.series.set(series, { data: [], fullUpdate: true });
            }
            dataUpdateResponse.timeScale.points = this._sortedTimePoints;
        }
        else {
            var seriesData = this._seriesRowsBySeries.get(series);
            // if no seriesData found that means that we just removed the series
            dataUpdateResponse.series.set(series, { data: seriesData || [], fullUpdate: true });
        }
        return dataUpdateResponse;
    };
    return DataLayer;
}());
export { DataLayer };
