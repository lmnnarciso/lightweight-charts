import { isWhitespaceData } from './data-consumer';
function getLineBasedSeriesPlotRow(time, index, item) {
    var val = item.value;
    var res = { index: index, time: time, value: [val, val, val, val] };
    // 'color' here is public property (from API) so we can use `in` here safely
    // eslint-disable-next-line no-restricted-syntax
    if ('color' in item && item.color !== undefined) {
        res.color = item.color;
    }
    return res;
}
function getOHLCBasedSeriesPlotRow(time, index, item) {
    return { index: index, time: time, value: [item.open, item.high, item.low, item.close] };
}
export function isSeriesPlotRow(row) {
    return row.value !== undefined;
}
function wrapWhitespaceData(createPlotRowFn) {
    return function (time, index, bar) {
        if (isWhitespaceData(bar)) {
            return { time: time, index: index };
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
