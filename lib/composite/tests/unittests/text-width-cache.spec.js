"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var text_width_cache_1 = require("../../src/model/text-width-cache");
var FakeCtx = /** @class */ (function () {
    function FakeCtx() {
        this.invocations = [];
    }
    FakeCtx.prototype.measureText = function (text) {
        this.invocations.push(text);
        return { width: this._impl(text) };
    };
    FakeCtx.prototype._impl = function (text) {
        var fakeWidth = 0;
        for (var i = 0; i < text.length; i++) {
            fakeWidth += (1 + text.charCodeAt(i) % 64 / 64) * 10;
        }
        return fakeWidth;
    };
    return FakeCtx;
}());
(0, mocha_1.describe)('TextWidthCache', function () {
    (0, mocha_1.it)('should return the same measureText would return', function () {
        var textWidthCache = new text_width_cache_1.TextWidthCache();
        var fakeCtx = new FakeCtx();
        (0, chai_1.expect)(textWidthCache.measureText(fakeCtx, 'test')).to.be.equal(fakeCtx.measureText('test').width);
    });
    (0, mocha_1.it)('should cache and purge values', function () {
        var textWidthCache = new text_width_cache_1.TextWidthCache(3);
        var fakeCtx = new FakeCtx();
        textWidthCache.measureText(fakeCtx, 'foo');
        textWidthCache.measureText(fakeCtx, 'bar');
        textWidthCache.measureText(fakeCtx, 'baz');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz']);
        textWidthCache.measureText(fakeCtx, 'baz');
        textWidthCache.measureText(fakeCtx, 'bar');
        textWidthCache.measureText(fakeCtx, 'foo');
        // No new invocations should be made
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz']);
        // The oldest, foo, should be removed
        textWidthCache.measureText(fakeCtx, 'quux');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz', 'quux']);
        textWidthCache.measureText(fakeCtx, 'baz');
        textWidthCache.measureText(fakeCtx, 'bar');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz', 'quux']);
        textWidthCache.measureText(fakeCtx, 'foo');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz', 'quux', 'foo']);
    });
    (0, mocha_1.it)('should not cache zero width of nonempty string', function () {
        var ZeroReturningFakeCtx = /** @class */ (function (_super) {
            (0, tslib_1.__extends)(ZeroReturningFakeCtx, _super);
            function ZeroReturningFakeCtx() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ZeroReturningFakeCtx.prototype._impl = function () {
                return 0;
            };
            return ZeroReturningFakeCtx;
        }(FakeCtx));
        var textWidthCache = new text_width_cache_1.TextWidthCache(3);
        var fakeCtx = new ZeroReturningFakeCtx();
        textWidthCache.measureText(fakeCtx, '');
        textWidthCache.measureText(fakeCtx, 'not empty');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['', 'not empty']);
        textWidthCache.measureText(fakeCtx, '');
        textWidthCache.measureText(fakeCtx, 'not empty');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['', 'not empty', 'not empty']);
        textWidthCache.measureText(fakeCtx, '');
        textWidthCache.measureText(fakeCtx, 'not empty');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['', 'not empty', 'not empty', 'not empty']);
    });
    (0, mocha_1.it)('should work with "special" values', function () {
        var textWidthCache = new text_width_cache_1.TextWidthCache(5);
        var fakeCtx = new FakeCtx();
        textWidthCache.measureText(fakeCtx, '__proto__');
        textWidthCache.measureText(fakeCtx, 'prototype');
        textWidthCache.measureText(fakeCtx, 'hasOwnProperty');
        textWidthCache.measureText(fakeCtx, 'undefined');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['__proto__', 'prototype', 'hasOwnProperty', 'undefined']);
        // Just checking if it still works
        textWidthCache.measureText(fakeCtx, '__proto__');
        textWidthCache.measureText(fakeCtx, 'prototype');
        textWidthCache.measureText(fakeCtx, 'hasOwnProperty');
        textWidthCache.measureText(fakeCtx, 'undefined');
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['__proto__', 'prototype', 'hasOwnProperty', 'undefined']);
    });
    (0, mocha_1.it)('should apply default optimization regex', function () {
        var textWidthCache = new text_width_cache_1.TextWidthCache();
        var fakeCtx = new FakeCtx();
        (0, chai_1.expect)(textWidthCache.measureText(fakeCtx, 'test2345')).to.be.equal(textWidthCache.measureText(fakeCtx, 'test6789'));
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['test0000']);
    });
    (0, mocha_1.it)('should apply custom optimization regex', function () {
        var textWidthCache = new text_width_cache_1.TextWidthCache();
        var fakeCtx = new FakeCtx();
        var re = /[1-9]/g;
        (0, chai_1.expect)(textWidthCache.measureText(fakeCtx, 'test01234', re)).to.be.equal(textWidthCache.measureText(fakeCtx, 'test56789', re));
        (0, chai_1.expect)(fakeCtx.invocations).to.deep.equal(['test00000']);
    });
});
