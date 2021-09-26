"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var make_font_1 = require("../../src/helpers/make-font");
(0, mocha_1.describe)('makeFont', function () {
    (0, mocha_1.it)('should correct generate font family without style', function () {
        (0, chai_1.expect)((0, make_font_1.makeFont)(12, 'Roboto')).to.be.equal('12px Roboto');
        (0, chai_1.expect)((0, make_font_1.makeFont)(120, 'Roboto')).to.be.equal('120px Roboto');
    });
    (0, mocha_1.it)('should correct generate font family with style', function () {
        (0, chai_1.expect)((0, make_font_1.makeFont)(12, 'Roboto', 'italic')).to.be.equal('italic 12px Roboto');
        (0, chai_1.expect)((0, make_font_1.makeFont)(120, 'Roboto', 'bold')).to.be.equal('bold 120px Roboto');
    });
    (0, mocha_1.it)('should correct generate font with default family', function () {
        (0, chai_1.expect)((0, make_font_1.makeFont)(12)).to.be.equal("12px " + make_font_1.defaultFontFamily);
    });
});
