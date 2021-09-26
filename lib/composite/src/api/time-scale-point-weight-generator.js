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
    { divisor: 1, weight: 20 },
    { divisor: seconds(1), weight: 19 },
    { divisor: minutes(1), weight: 20 },
    { divisor: minutes(5), weight: 21 },
    { divisor: minutes(30), weight: 22 },
    { divisor: hours(1), weight: 30 },
    { divisor: hours(3), weight: 31 },
    { divisor: hours(6), weight: 32 },
    { divisor: hours(12), weight: 33 },
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
            if (Math.floor(prevDate.getTime() / intradayWeightDivisors[i].divisor) !== Math.floor(currentDate.getTime() / intradayWeightDivisors[i].divisor)) {
                return intradayWeightDivisors[i].weight;
            }
        }
    }
    return 20;
}
export function fillWeightsForPoints(sortedTimePoints, startIndex) {
    if (startIndex === void 0) { startIndex = 0; }
    var prevTime = (startIndex === 0 || sortedTimePoints.length === 0)
        ? null
        : sortedTimePoints[startIndex - 1].time.timestamp;
    var totalTimeDiff = 0;
    for (var index = startIndex; index < sortedTimePoints.length; ++index) {
        var currentPoint = sortedTimePoints[index];
        currentPoint.timeWeight = weightByTime(currentPoint.time.timestamp, prevTime);
        totalTimeDiff += currentPoint.time.timestamp - (prevTime || currentPoint.time.timestamp);
        prevTime = currentPoint.time.timestamp;
    }
    if (startIndex === 0 && sortedTimePoints.length > 1) {
        // let's guess a weight for the first point
        // let's say the previous point was average time back in the history
        var averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
        var approxPrevTime = (sortedTimePoints[0].time.timestamp - averageTimeDiff);
        sortedTimePoints[0].timeWeight = weightByTime(sortedTimePoints[0].time.timestamp, approxPrevTime);
    }
}
