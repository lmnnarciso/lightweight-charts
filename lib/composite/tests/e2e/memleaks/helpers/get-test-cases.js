"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestCases = void 0;
var tslib_1 = require("tslib");
var fs = (0, tslib_1.__importStar)(require("fs"));
var path = (0, tslib_1.__importStar)(require("path"));
var testCasesDir = path.join(__dirname, '..', 'test-cases');
function extractTestCaseName(fileName) {
    var match = /^([^.].+)\.js$/.exec(fileName);
    return match && match[1];
}
function isTestCaseFile(filePath) {
    return fs.lstatSync(path.join(testCasesDir, filePath)).isFile() && extractTestCaseName(filePath) !== null;
}
function getTestCases() {
    return fs.readdirSync(testCasesDir)
        .filter(isTestCaseFile)
        .map(function (testCaseFile) { return ({
        name: extractTestCaseName(testCaseFile),
        caseContent: fs.readFileSync(path.join(testCasesDir, testCaseFile), { encoding: 'utf-8' }),
    }); });
}
exports.getTestCases = getTestCases;
