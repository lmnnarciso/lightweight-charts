"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = (0, tslib_1.__importStar)(require("fs"));
var path = (0, tslib_1.__importStar)(require("path"));
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var puppeteer_1 = (0, tslib_1.__importDefault)(require("puppeteer"));
var get_test_cases_1 = require("./helpers/get-test-cases");
var dummyContent = fs.readFileSync(path.join(__dirname, 'helpers', 'test-page-dummy.html'), { encoding: 'utf-8' });
function generatePageContent(standaloneBundlePath, testCaseCode) {
    return dummyContent
        .replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
        .replace('TEST_CASE_SCRIPT', testCaseCode);
}
var testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
var testStandalonePath = process.env[testStandalonePathEnvKey] || '';
function getReferencesCount(frame, prototypeReference) {
    var _a;
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var context, activeRefsHandle, activeRefsCount;
        return (0, tslib_1.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, frame.executionContext()];
                case 1:
                    context = _b.sent();
                    return [4 /*yield*/, context.queryObjects(prototypeReference)];
                case 2:
                    activeRefsHandle = _b.sent();
                    return [4 /*yield*/, (activeRefsHandle === null || activeRefsHandle === void 0 ? void 0 : activeRefsHandle.getProperty('length'))];
                case 3: return [4 /*yield*/, ((_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.jsonValue())];
                case 4:
                    activeRefsCount = _b.sent();
                    return [4 /*yield*/, activeRefsHandle.dispose()];
                case 5:
                    _b.sent();
                    return [2 /*return*/, activeRefsCount];
            }
        });
    });
}
function promisleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
(0, mocha_1.describe)('Memleaks tests', function () {
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
    var testCases = (0, get_test_cases_1.getTestCases)();
    (0, mocha_1.it)('number of test cases', function () {
        // we need to have at least 1 test to check it
        (0, chai_1.expect)(testCases.length).to.be.greaterThan(0, 'there should be at least 1 test case');
    });
    var _loop_1 = function (testCase) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        (0, mocha_1.it)(testCase.name, function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var pageContent, page, errors, getCanvasPrototype, frame, context, prototype, referencesCountBefore, referencesCountAfter;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pageContent = generatePageContent(testStandalonePath, testCase.caseContent);
                        return [4 /*yield*/, browser.newPage()];
                    case 1:
                        page = _a.sent();
                        return [4 /*yield*/, page.setViewport({ width: 600, height: 600 })];
                    case 2:
                        _a.sent();
                        // set empty page as a content to get initial number
                        // of references
                        return [4 /*yield*/, page.setContent('<html><body></body></html>', { waitUntil: 'load' })];
                    case 3:
                        // set empty page as a content to get initial number
                        // of references
                        _a.sent();
                        errors = [];
                        page.on('pageerror', function (error) {
                            errors.push(error.message);
                        });
                        page.on('response', function (response) {
                            if (!response.ok()) {
                                errors.push("Network error: " + response.url() + " status=" + response.status());
                            }
                        });
                        getCanvasPrototype = function () {
                            return Promise.resolve(CanvasRenderingContext2D.prototype);
                        };
                        frame = page.mainFrame();
                        return [4 /*yield*/, frame.executionContext()];
                    case 4:
                        context = _a.sent();
                        return [4 /*yield*/, context.evaluateHandle(getCanvasPrototype)];
                    case 5:
                        prototype = _a.sent();
                        return [4 /*yield*/, getReferencesCount(frame, prototype)];
                    case 6:
                        referencesCountBefore = _a.sent();
                        return [4 /*yield*/, page.setContent(pageContent, { waitUntil: 'load' })];
                    case 7:
                        _a.sent();
                        if (errors.length !== 0) {
                            throw new Error("Page has errors:\n" + errors.join('\n'));
                        }
                        // now remove chart
                        return [4 /*yield*/, page.evaluate(function () {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                                window.chart.remove();
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
                                delete window.chart;
                            })];
                    case 8:
                        // now remove chart
                        _a.sent();
                        // IMPORTANT: This timeout is important
                        // Browser could keep references to DOM elements several milliseconds after its actual removing
                        // So we have to wait to be sure all is clear
                        return [4 /*yield*/, promisleep(100)];
                    case 9:
                        // IMPORTANT: This timeout is important
                        // Browser could keep references to DOM elements several milliseconds after its actual removing
                        // So we have to wait to be sure all is clear
                        _a.sent();
                        return [4 /*yield*/, getReferencesCount(frame, prototype)];
                    case 10:
                        referencesCountAfter = _a.sent();
                        (0, chai_1.expect)(referencesCountAfter).to.be.equal(referencesCountBefore, 'There should not be extra references after removing a chart');
                        return [2 /*return*/];
                }
            });
        }); });
    };
    for (var _i = 0, testCases_1 = testCases; _i < testCases_1.length; _i++) {
        var testCase = testCases_1[_i];
        _loop_1(testCase);
    }
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
