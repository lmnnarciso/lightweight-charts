import { isWhitespaceData } from './data-consumer';
function getLineBasedSeriesPlotRow(time, index, item) {
    var val = item.value;
    var res = { _internal_index: index, _internal_time: time, _internal_value: [val, val, val, val] };
    // 'color' here is public property (from API) so we can use `in` here safely
    // eslint-disable-next-line no-restricted-syntax
    if ('color' in item && item.color !== undefined) {
        res._internal_color = item.color;
    }
    return res;
}
function getOHLCBasedSeriesPlotRow(time, index, item) {
    return { _internal_index: index, _internal_time: time, _internal_value: [item.open, item.high, item.low, item.close] };
}
export function isSeriesPlotRow(row) {
    return row._internal_value !== undefined;
}
function wrapWhitespaceData(createPlotRowFn) {
    return function (time, index, bar) {
        if (isWhitespaceData(bar)) {
            return { _internal_time: time, _internal_index: index };
        }
        return createPlotRowFn(time, index, bar);
    };
}
var seriesPlotRowFnMap = {
    Candlestick: wrapWhitespaceData(getOHLCBasedSeriesPlotRow),
    Bar: wrapWhitespaceData(getOHLCBasedSeriesPlotRow),
    Area: wrapWhitespaceData(getLineBasedSeriesPlotRow),
    Histogram: wrapWhitespaceData(getLineBasedSeriesPlotRow),
    Line: wrapWhitespaceData(getLineBasedSeriesPlotRow),
};
export function getSeriesPlotRowCreator(seriesType) {
    return seriesPlotRowFnMap[seriesType];
}
