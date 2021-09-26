"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = (0, tslib_1.__importStar)(require("fs"));
var path = (0, tslib_1.__importStar)(require("path"));
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var pngjs_1 = require("pngjs");
var compare_screenshots_1 = require("./helpers/compare-screenshots");
var get_test_cases_1 = require("./helpers/get-test-cases");
var screenshoter_1 = require("./helpers/screenshoter");
var dummyContent = fs.readFileSync(path.join(__dirname, 'helpers', 'test-page-dummy.html'), { encoding: 'utf-8' });
var buildMode = process.env.PRODUCTION_BUILD === 'true' ? 'production' : 'development';
function generatePageContent(standaloneBundlePath, testCaseCode) {
    return dummyContent
        .replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
        .replace('TEST_CASE_SCRIPT', testCaseCode)
        .replace('{BUILD_MODE}', buildMode);
}
var goldenStandalonePathEnvKey = 'GOLDEN_STANDALONE_PATH';
var testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
var devicePixelRatio = process.env.DEVICE_PIXEL_RATIO ? parseFloat(process.env.DEVICE_PIXEL_RATIO) : 1;
if (isNaN(devicePixelRatio)) {
    devicePixelRatio = 1;
}
var devicePixelRatioStr = devicePixelRatio.toFixed(2);
var testResultsOutDir = path.resolve(process.env.CMP_OUT_DIR || path.join(__dirname, '.gendata'));
var goldenStandalonePath = process.env[goldenStandalonePathEnvKey] || '';
var testStandalonePath = process.env[testStandalonePathEnvKey] || '';
function rmRf(dir) {
    if (!fs.existsSync(dir)) {
        return;
    }
    fs.readdirSync(dir).forEach(function (file) {
        var filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            rmRf(filePath);
        }
        else {
            fs.unlinkSync(filePath);
        }
    });
    fs.rmdirSync(dir);
}
function removeEmptyDirsRecursive(rootDir) {
    if (!fs.existsSync(rootDir)) {
        return;
    }
    fs.readdirSync(rootDir).forEach(function (file) {
        var filePath = path.join(rootDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            removeEmptyDirsRecursive(filePath);
        }
    });
    if (fs.readdirSync(rootDir).length === 0) {
        fs.rmdirSync(rootDir);
    }
}
(0, mocha_1.describe)("Graphics tests with devicePixelRatio=" + devicePixelRatioStr + " (" + buildMode + " mode)", function () {
    var _this = this;
    // this tests are unstable sometimes :(
    this.retries(5);
    var testCases = (0, get_test_cases_1.getTestCases)();
    before(function () {
        rmRf(testResultsOutDir);
        fs.mkdirSync(testResultsOutDir, { recursive: true });
        (0, chai_1.expect)(goldenStandalonePath, "path to golden standalone module must be passed via " + goldenStandalonePathEnvKey + " env var")
            .to.have.length.greaterThan(0);
        (0, chai_1.expect)(testStandalonePath, "path to golden standalone module must be passed via " + testStandalonePathEnvKey + " env var")
            .to.have.length.greaterThan(0);
    });
    var screenshoter = new screenshoter_1.Screenshoter(Boolean(process.env.NO_SANDBOX), devicePixelRatio);
    var currentDprOutDir = path.join(testResultsOutDir, "devicePixelRatio=" + devicePixelRatioStr);
    var _loop_1 = function (groupName) {
        var currentGroupOutDir = path.join(currentDprOutDir, groupName);
        if (groupName.length === 0) {
            registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir);
        }
        else {
            (0, mocha_1.describe)(groupName, function () {
                registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir);
            });
        }
    };
    for (var _i = 0, _a = Object.keys(testCases); _i < _a.length; _i++) {
        var groupName = _a[_i];
        _loop_1(groupName);
    }
    (0, mocha_1.after)(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, screenshoter.close()];
                case 1:
                    _a.sent();
                    removeEmptyDirsRecursive(testResultsOutDir);
                    return [2 /*return*/];
            }
        });
    }); });
});
function registerTestCases(testCases, screenshoter, outDir) {
    var _this = this;
    var _loop_2 = function (testCase) {
        (0, mocha_1.it)(testCase.name, function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
            function writeTestDataItem(fileName, fileContent) {
                fs.writeFileSync(path.join(testCaseOutDir, fileName), fileContent);
            }
            var testCaseOutDir, goldenPageContent, testPageContent, goldenScreenshotPromise, testScreenshotPromise, errors, failedPages, goldenScreenshot, e_1, testScreenshot, e_2, compareResult;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testCaseOutDir = path.join(outDir, testCase.name);
                        rmRf(testCaseOutDir);
                        fs.mkdirSync(testCaseOutDir, { recursive: true });
                        goldenPageContent = generatePageContent(goldenStandalonePath, testCase.caseContent);
                        testPageContent = generatePageContent(testStandalonePath, testCase.caseContent);
                        writeTestDataItem('1.golden.html', goldenPageContent);
                        writeTestDataItem('2.test.html', testPageContent);
                        goldenScreenshotPromise = screenshoter.generateScreenshot(goldenPageContent);
                        testScreenshotPromise = screenshoter.generateScreenshot(testPageContent);
                        errors = [];
                        failedPages = [];
                        goldenScreenshot = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, goldenScreenshotPromise];
                    case 2:
                        goldenScreenshot = _a.sent();
                        writeTestDataItem('1.golden.png', pngjs_1.PNG.sync.write(goldenScreenshot));
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        errors.push("=== Golden page ===\n" + e_1.message);
                        failedPages.push('golden');
                        return [3 /*break*/, 4];
                    case 4:
                        testScreenshot = null;
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, testScreenshotPromise];
                    case 6:
                        testScreenshot = _a.sent();
                        writeTestDataItem('2.test.png', pngjs_1.PNG.sync.write(testScreenshot));
                        return [3 /*break*/, 8];
                    case 7:
                        e_2 = _a.sent();
                        errors.push("=== Test page ===\n" + e_2.message);
                        failedPages.push('test');
                        return [3 /*break*/, 8];
                    case 8:
                        if (goldenScreenshot !== null && testScreenshot !== null) {
                            compareResult = (0, compare_screenshots_1.compareScreenshots)(goldenScreenshot, testScreenshot);
                            writeTestDataItem('3.diff.png', pngjs_1.PNG.sync.write(compareResult.diffImg));
                            (0, chai_1.expect)(compareResult.diffPixelsCount).to.be.equal(0, 'number of different pixels must be 0');
                        }
                        else {
                            writeTestDataItem('3.errors.txt', errors.join('\n\n'));
                            throw new Error("The error(s) happened while generating a screenshot for the page(s): " + failedPages.join(', ') + ".\nSee " + testCaseOutDir + " directory for an output of the test case.");
                        }
                        rmRf(testCaseOutDir);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    for (var _i = 0, testCases_1 = testCases; _i < testCases_1.length; _i++) {
        var testCase = testCases_1[_i];
        _loop_2(testCase);
    }
}
