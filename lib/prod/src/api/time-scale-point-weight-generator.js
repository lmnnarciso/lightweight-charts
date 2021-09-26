function hours(count) {
    return count * 60 * 60 * 1000;
}
function minutes(count) {
    return count * 60 * 1000;
}
function seconds(count) {
    return count * 1000;
}
var intradayWeightDivisors = [
    // TODO: divisor=1 means 1ms and it's strange that weight for 1ms > weight for 1s
    { _internal_divisor: 1, _internal_weight: 20 },
    { _internal_divisor: seconds(1), _internal_weight: 19 },
    { _internal_divisor: minutes(1), _internal_weight: 20 },
    { _internal_divisor: minutes(5), _internal_weight: 21 },
    { _internal_divisor: minutes(30), _internal_weight: 22 },
    { _internal_divisor: hours(1), _internal_weight: 30 },
    { _internal_divisor: hours(3), _internal_weight: 31 },
    { _internal_divisor: hours(6), _internal_weight: 32 },
    { _internal_divisor: hours(12), _internal_weight: 33 },
];
function weightByTime(time, prevTime) {
    if (prevTime !== null) {
        var prevDate = new Date(prevTime * 1000);
        var currentDate = new Date(time * 1000);
        if (currentDate.getUTCFullYear() !== prevDate.getUTCFullYear()) {
            return 70;
        }
        else if (currentDate.getUTCMonth() !== prevDate.getUTCMonth()) {
            return 60;
        }
        else if (currentDate.getUTCDate() !== prevDate.getUTCDate()) {
            return 50;
        }
        for (var i = intradayWeightDivisors.length - 1; i >= 0; --i) {
            if (Math.floor(prevDate.getTime() / intradayWeightDivisors[i]._internal_divisor) !== Math.floor(currentDate.getTime() / intradayWeightDivisors[i]._internal_divisor)) {
                return intradayWeightDivisors[i]._internal_weight;
            }
        }
    }
    return 20;
}
export function fillWeightsForPoints(sortedTimePoints, startIndex) {
    if (startIndex === void 0) { startIndex = 0; }
    var prevTime = (startIndex === 0 || sortedTimePoints.length === 0)
        ? null
        : sortedTimePoints[startIndex - 1]._internal_time._internal_timestamp;
    var totalTimeDiff = 0;
    for (var index = startIndex; index < sortedTimePoints.length; ++index) {
        var currentPoint = sortedTimePoints[index];
        currentPoint._internal_timeWeight = weightByTime(currentPoint._internal_time._internal_timestamp, prevTime);
        totalTimeDiff += currentPoint._internal_time._internal_timestamp - (prevTime || currentPoint._internal_time._internal_timestamp);
        prevTime = currentPoint._internal_time._internal_timestamp;
    }
    if (startIndex === 0 && sortedTimePoints.length > 1) {
        // let's guess a weight for the first point
        // let's say the previous point was average time back in the history
        var averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
        var approxPrevTime = (sortedTimePoints[0]._internal_time._internal_timestamp - averageTimeDiff);
        sortedTimePoints[0]._internal_timeWeight = weightByTime(sortedTimePoints[0]._internal_time._internal_timestamp, approxPrevTime);
    }
}
