"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screenshoter = void 0;
var tslib_1 = require("tslib");
var pngjs_1 = require("pngjs");
var puppeteer_1 = (0, tslib_1.__importDefault)(require("puppeteer"));
var viewportWidth = 600;
var viewportHeight = 600;
var Screenshoter = /** @class */ (function () {
    function Screenshoter(noSandbox, devicePixelRatio) {
        if (devicePixelRatio === void 0) { devicePixelRatio = 1; }
        var puppeteerOptions = {
            defaultViewport: {
                deviceScaleFactor: devicePixelRatio,
                width: viewportWidth,
                height: viewportHeight,
            },
        };
        if (noSandbox) {
            puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
        }
        // note that we cannot use launchPuppeteer here as soon it wrong typing in puppeteer
        // see https://github.com/puppeteer/puppeteer/issues/7529
        this._browserPromise = puppeteer_1.default.launch(puppeteerOptions);
    }
    Screenshoter.prototype.close = function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var browser;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._browserPromise];
                    case 1:
                        browser = _a.sent();
                        return [4 /*yield*/, browser.close()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Screenshoter.prototype.generateScreenshot = function (pageContent) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var page, browser, errors_1, _a, _b;
            return (0, tslib_1.__generator)(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, , 8, 11]);
                        return [4 /*yield*/, this._browserPromise];
                    case 1:
                        browser = _c.sent();
                        return [4 /*yield*/, browser.newPage()];
                    case 2:
                        page = _c.sent();
                        errors_1 = [];
                        page.on('pageerror', function (error) {
                            errors_1.push(error.message);
                        });
                        page.on('console', function (message) {
                            var type = message.type();
                            if (type === 'error' || type === 'assert') {
                                errors_1.push("Console " + type + ": " + message.text());
                            }
                        });
                        page.on('response', function (response) {
                            if (!response.ok()) {
                                errors_1.push("Network error: " + response.url() + " status=" + response.status());
                            }
                        });
                        return [4 /*yield*/, page.setContent(pageContent, { waitUntil: 'load' })];
                    case 3:
                        _c.sent();
                        // wait for test case is ready
                        return [4 /*yield*/, page.evaluate(function () {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
                                return window.testCaseReady;
                            })];
                    case 4:
                        // wait for test case is ready
                        _c.sent();
                        // to avoid random cursor position
                        return [4 /*yield*/, page.mouse.move(viewportWidth / 2, viewportHeight / 2)];
                    case 5:
                        // to avoid random cursor position
                        _c.sent();
                        // let's wait until the next af to make sure that everything is repainted
                        return [4 /*yield*/, page.evaluate(function () {
                                return new Promise(function (resolve) {
                                    window.requestAnimationFrame(function () {
                                        // and a little more time after af :)
                                        setTimeout(resolve, 50);
                                    });
                                });
                            })];
                    case 6:
                        // let's wait until the next af to make sure that everything is repainted
                        _c.sent();
                        if (errors_1.length !== 0) {
                            throw new Error(errors_1.join('\n'));
                        }
                        _b = (_a = pngjs_1.PNG.sync).read;
                        return [4 /*yield*/, page.screenshot({ encoding: 'binary' })];
                    case 7: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
                    case 8:
                        if (!(page !== undefined)) return [3 /*break*/, 10];
                        return [4 /*yield*/, page.close()];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10: return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return Screenshoter;
}());
exports.Screenshoter = Screenshoter;
