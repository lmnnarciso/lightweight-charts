"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = (0, tslib_1.__importStar)(require("fs"));
var path = (0, tslib_1.__importStar)(require("path"));
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var puppeteer_1 = (0, tslib_1.__importDefault)(require("puppeteer"));
var coverage_config_1 = require("./coverage-config");
var coverageScript = fs.readFileSync(path.join(__dirname, 'coverage-script.js'), { encoding: 'utf-8' });
var testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
var testStandalonePath = process.env[testStandalonePathEnvKey] || '';
function doMouseScrolls(element) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var client;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = element._client;
                    return [4 /*yield*/, client.send('Input.dispatchMouseEvent', {
                            type: 'mouseWheel',
                            x: 0,
                            y: 0,
                            deltaX: 10.0,
                            deltaY: 0,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, client.send('Input.dispatchMouseEvent', {
                            type: 'mouseWheel',
                            x: 0,
                            y: 0,
                            deltaX: 0,
                            deltaY: 10.0,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, client.send('Input.dispatchMouseEvent', {
                            type: 'mouseWheel',
                            x: 0,
                            y: 0,
                            deltaX: -10.0,
                            deltaY: 0,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, client.send('Input.dispatchMouseEvent', {
                            type: 'mouseWheel',
                            x: 0,
                            y: 0,
                            deltaX: 0,
                            deltaY: -10.0,
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, client.send('Input.dispatchMouseEvent', {
                            type: 'mouseWheel',
                            x: 0,
                            y: 0,
                            deltaX: 10.0,
                            deltaY: 10.0,
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, client.send('Input.dispatchMouseEvent', {
                            type: 'mouseWheel',
                            x: 0,
                            y: 0,
                            deltaX: -10.0,
                            deltaY: -10.0,
                        })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function doZoomInZoomOut(page) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var prevViewport;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prevViewport = page.viewport();
                    return [4 /*yield*/, page.setViewport((0, tslib_1.__assign)((0, tslib_1.__assign)({}, prevViewport), { deviceScaleFactor: 2 }))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.setViewport(prevViewport)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function doVerticalDrag(page, element) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var elBox, elMiddleX, elMiddleY;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, element.boundingBox()];
                case 1:
                    elBox = _a.sent();
                    elMiddleX = elBox.x + elBox.width / 2;
                    elMiddleY = elBox.y + elBox.height / 2;
                    // move mouse to the middle of element
                    return [4 /*yield*/, page.mouse.move(elMiddleX, elMiddleY)];
                case 2:
                    // move mouse to the middle of element
                    _a.sent();
                    return [4 /*yield*/, page.mouse.down({ button: 'left' })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX, elMiddleY - 20)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX, elMiddleY + 40)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.up({ button: 'left' })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function doHorizontalDrag(page, element) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var elBox, elMiddleX, elMiddleY;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, element.boundingBox()];
                case 1:
                    elBox = _a.sent();
                    elMiddleX = elBox.x + elBox.width / 2;
                    elMiddleY = elBox.y + elBox.height / 2;
                    // move mouse to the middle of element
                    return [4 /*yield*/, page.mouse.move(elMiddleX, elMiddleY)];
                case 2:
                    // move mouse to the middle of element
                    _a.sent();
                    return [4 /*yield*/, page.mouse.down({ button: 'left' })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX - 20, elMiddleY)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX + 40, elMiddleY)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.up({ button: 'left' })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function doKineticAnimation(page, element) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var elBox, elMiddleX, elMiddleY;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, element.boundingBox()];
                case 1:
                    elBox = _a.sent();
                    elMiddleX = elBox.x + elBox.width / 2;
                    elMiddleY = elBox.y + elBox.height / 2;
                    // move mouse to the middle of element
                    return [4 /*yield*/, page.mouse.move(elMiddleX, elMiddleY)];
                case 2:
                    // move mouse to the middle of element
                    _a.sent();
                    return [4 /*yield*/, page.mouse.down({ button: 'left' })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(50)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX - 40, elMiddleY)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX - 55, elMiddleY)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX - 105, elMiddleY)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX - 155, elMiddleY)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX - 205, elMiddleY)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.move(elMiddleX - 255, elMiddleY)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, page.mouse.up({ button: 'left' })];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(200)];
                case 12:
                    _a.sent();
                    // stop animation
                    return [4 /*yield*/, page.mouse.down({ button: 'left' })];
                case 13:
                    // stop animation
                    _a.sent();
                    return [4 /*yield*/, page.mouse.up({ button: 'left' })];
                case 14:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function doUserInteractions(page) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var chartContainer, chartBox, leftPriceAxis, paneWidget, rightPriceAxis, timeAxis;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.$('#container')];
                case 1:
                    chartContainer = _a.sent();
                    return [4 /*yield*/, chartContainer.boundingBox()];
                case 2:
                    chartBox = _a.sent();
                    // move cursor to the middle of the chart
                    return [4 /*yield*/, page.mouse.move(chartBox.width / 2, chartBox.height / 2)];
                case 3:
                    // move cursor to the middle of the chart
                    _a.sent();
                    return [4 /*yield*/, chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(1) div canvas')];
                case 4:
                    leftPriceAxis = (_a.sent())[0];
                    return [4 /*yield*/, chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(2) div canvas')];
                case 5:
                    paneWidget = (_a.sent())[0];
                    return [4 /*yield*/, chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(3) div canvas')];
                case 6:
                    rightPriceAxis = (_a.sent())[0];
                    return [4 /*yield*/, chartContainer.$$('tr:nth-of-type(2) td:nth-of-type(2) div canvas')];
                case 7:
                    timeAxis = (_a.sent())[0];
                    // mouse scroll
                    return [4 /*yield*/, doMouseScrolls(chartContainer)];
                case 8:
                    // mouse scroll
                    _a.sent();
                    // outside click
                    return [4 /*yield*/, page.mouse.click(chartBox.x + chartBox.width + 20, chartBox.y + chartBox.height + 50, { button: 'left' })];
                case 9:
                    // outside click
                    _a.sent();
                    // change viewport zoom
                    return [4 /*yield*/, doZoomInZoomOut(page)];
                case 10:
                    // change viewport zoom
                    _a.sent();
                    // drag price scale
                    return [4 /*yield*/, doVerticalDrag(page, leftPriceAxis)];
                case 11:
                    // drag price scale
                    _a.sent();
                    return [4 /*yield*/, doVerticalDrag(page, rightPriceAxis)];
                case 12:
                    _a.sent();
                    // drag time scale
                    return [4 /*yield*/, doHorizontalDrag(page, timeAxis)];
                case 13:
                    // drag time scale
                    _a.sent();
                    // drag pane
                    return [4 /*yield*/, doVerticalDrag(page, paneWidget)];
                case 14:
                    // drag pane
                    _a.sent();
                    return [4 /*yield*/, doVerticalDrag(page, paneWidget)];
                case 15:
                    _a.sent();
                    // clicks on scales
                    return [4 /*yield*/, leftPriceAxis.click({ button: 'left' })];
                case 16:
                    // clicks on scales
                    _a.sent();
                    return [4 /*yield*/, leftPriceAxis.click({ button: 'left', clickCount: 2 })];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, rightPriceAxis.click({ button: 'left' })];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, rightPriceAxis.click({ button: 'left', clickCount: 2 })];
                case 19:
                    _a.sent();
                    return [4 /*yield*/, timeAxis.click({ button: 'left' })];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, timeAxis.click({ button: 'left', clickCount: 2 })];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, doKineticAnimation(page, timeAxis)];
                case 22:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getCoverageResult(page) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var coverageEntries, result, _i, coverageEntries_1, entry, entryRes, _a, _b, range;
        return (0, tslib_1.__generator)(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.coverage.stopJSCoverage()];
                case 1:
                    coverageEntries = _c.sent();
                    result = new Map();
                    for (_i = 0, coverageEntries_1 = coverageEntries; _i < coverageEntries_1.length; _i++) {
                        entry = coverageEntries_1[_i];
                        entryRes = result.get(entry.url);
                        if (entryRes === undefined) {
                            entryRes = {
                                totalBytes: 0,
                                usedBytes: 0,
                            };
                            result.set(entry.url, entryRes);
                        }
                        entryRes.totalBytes += entry.text.length;
                        for (_a = 0, _b = entry.ranges; _a < _b.length; _a++) {
                            range = _b[_a];
                            entryRes.usedBytes += range.end - range.start;
                        }
                        result.set(entry.url, entryRes);
                    }
                    return [2 /*return*/, result];
            }
        });
    });
}
(0, mocha_1.describe)('Coverage tests', function () {
    var puppeteerOptions = {};
    if (process.env.NO_SANDBOX) {
        puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    }
    var browser;
    before(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
        var browserPromise;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, chai_1.expect)(testStandalonePath, "path to test standalone module must be passed via " + testStandalonePathEnvKey + " env var")
                        .to.have.length.greaterThan(0);
                    browserPromise = puppeteer_1.default.launch(puppeteerOptions);
                    return [4 /*yield*/, browserPromise];
                case 1:
                    browser = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    function runTest(onError) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var page, result, libraryRes, currentCoverage;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, browser.newPage()];
                    case 1:
                        page = _a.sent();
                        return [4 /*yield*/, page.coverage.startJSCoverage()];
                    case 2:
                        _a.sent();
                        page.on('pageerror', function (error) {
                            onError("Page error: " + error.message);
                        });
                        page.on('console', function (message) {
                            var type = message.type();
                            if (type === 'error' || type === 'assert') {
                                onError("Console " + type + ": " + message.text());
                            }
                        });
                        page.on('response', function (response) {
                            if (!response.ok()) {
                                onError("Network error: " + response.url() + " status=" + response.status());
                            }
                        });
                        return [4 /*yield*/, page.setContent("\n\t\t\t<!DOCTYPE html>\n\t\t\t<html>\n\t\t\t\t<head>\n\t\t\t\t\t<meta charset=\"UTF-8\">\n\t\t\t\t\t<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0\">\n\t\t\t\t\t<title>Test case page</title>\n\t\t\t\t</head>\n\n\t\t\t\t<body style=\"padding: 0; margin: 0;\">\n\t\t\t\t\t<div id=\"container\" style=\"position: absolute; width: 100%; height: 100%;\"></div>\n\n\t\t\t\t\t<script type=\"text/javascript\" src=\"" + testStandalonePath + "\"></script>\n\t\t\t\t\t<script type=\"text/javascript\">" + coverageScript + "</script>\n\n\t\t\t\t\t<script type=\"text/javascript\">\n\t\t\t\t\t\twindow.finishTestCasePromise = runTestCase(document.getElementById('container'));\n\t\t\t\t\t</script>\n\t\t\t\t</body>\n\t\t\t</html>\n\t\t")];
                    case 3:
                        _a.sent();
                        // first, wait until test case is ready
                        return [4 /*yield*/, page.evaluate(function () {
                                return window.finishTestCasePromise;
                            })];
                    case 4:
                        // first, wait until test case is ready
                        _a.sent();
                        // now let's do some user's interactions
                        return [4 /*yield*/, doUserInteractions(page)];
                    case 5:
                        // now let's do some user's interactions
                        _a.sent();
                        // finish test case
                        return [4 /*yield*/, page.evaluate(function () {
                                return window.finishTestCasePromise.then(function (finishTestCase) { return finishTestCase(); });
                            })];
                    case 6:
                        // finish test case
                        _a.sent();
                        return [4 /*yield*/, getCoverageResult(page)];
                    case 7:
                        result = _a.sent();
                        libraryRes = result.get(testStandalonePath);
                        (0, chai_1.expect)(libraryRes).not.to.be.equal(undefined);
                        currentCoverage = parseFloat((libraryRes.usedBytes / libraryRes.totalBytes * 100).toFixed(1));
                        (0, chai_1.expect)(currentCoverage).to.be.closeTo(coverage_config_1.expectedCoverage, coverage_config_1.threshold, "Please either update config to pass the test or improve coverage");
                        console.log("Current coverage is " + currentCoverage.toFixed(1) + "% (" + formatChange(currentCoverage - coverage_config_1.expectedCoverage) + "%)");
                        return [2 /*return*/];
                }
            });
        });
    }
    (0, mocha_1.it)("should have coverage around " + coverage_config_1.expectedCoverage.toFixed(1) + "% (\u00B1" + coverage_config_1.threshold.toFixed(1) + "%)", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    runTest(reject).then(resolve).catch(reject);
                })];
        });
    }); });
    after(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.close()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
function formatChange(change) {
    return change < 0 ? change.toFixed(1) : "+" + change.toFixed(1);
}
