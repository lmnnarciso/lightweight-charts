"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareScreenshots = void 0;
var tslib_1 = require("tslib");
var pixelmatch_1 = (0, tslib_1.__importDefault)(require("pixelmatch"));
var pngjs_1 = require("pngjs");
function compareScreenshots(leftImg, rightImg) {
    if (leftImg.width !== rightImg.width) {
        throw new Error('image widths should be the same');
    }
    if (leftImg.height !== rightImg.height) {
        throw new Error('image widths should be the same');
    }
    var diffImg = new pngjs_1.PNG({
        width: leftImg.width,
        height: rightImg.height,
    });
    var diffPixelsCount = (0, pixelmatch_1.default)(leftImg.data, rightImg.data, diffImg.data, leftImg.width, leftImg.height, { threshold: 0.1 });
    return { diffPixelsCount: diffPixelsCount, diffImg: diffImg };
}
exports.compareScreenshots = compareScreenshots;
