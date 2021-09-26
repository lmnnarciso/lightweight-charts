"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestCases = void 0;
var tslib_1 = require("tslib");
var fs = (0, tslib_1.__importStar)(require("fs"));
var path = (0, tslib_1.__importStar)(require("path"));
var testCasesDir = path.join(__dirname, '..', 'test-cases');
function extractTestCaseName(fileName) {
    var match = /^([^.].+)\.js$/.exec(path.basename(fileName));
    return match && match[1];
}
function isTestCaseFile(filePath) {
    return fs.lstatSync(filePath).isFile() && extractTestCaseName(filePath) !== null;
}
function getTestCaseGroups() {
    return (0, tslib_1.__spreadArray)([
        {
            name: '',
            path: testCasesDir,
        }
    ], fs.readdirSync(testCasesDir)
        .filter(function (filePath) { return fs.lstatSync(path.join(testCasesDir, filePath)).isDirectory(); })
        .map(function (filePath) {
        return {
            name: filePath,
            path: path.join(testCasesDir, filePath),
        };
    }), true);
}
function getTestCases() {
    var result = {};
    var _loop_1 = function (group) {
        result[group.name] = fs.readdirSync(group.path)
            .map(function (filePath) { return path.join(group.path, filePath); })
            .filter(isTestCaseFile)
            .map(function (testCaseFile) {
            return {
                name: extractTestCaseName(testCaseFile),
                caseContent: fs.readFileSync(testCaseFile, { encoding: 'utf-8' }),
            };
        });
    };
    for (var _i = 0, _a = getTestCaseGroups(); _i < _a.length; _i++) {
        var group = _a[_i];
        _loop_1(group);
    }
    return result;
}
exports.getTestCases = getTestCases;
