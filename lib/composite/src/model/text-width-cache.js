var defaultReplacementRe = /[2-9]/g;
var TextWidthCache = /** @class */ (function () {
    function TextWidthCache(size) {
        if (size === void 0) { size = 50; }
        this._cache = new Map();
        /** Current index in the "cyclic buffer" */
        this._keysIndex = 0;
        // A trick to keep array PACKED_ELEMENTS
        this._keys = Array.from(new Array(size));
    }
    TextWidthCache.prototype.reset = function () {
        this._cache.clear();
        this._keys.fill(undefined);
        // We don't care where exactly the _keysIndex points,
        // so there's no point in resetting it
    };
    TextWidthCache.prototype.measureText = function (ctx, text, optimizationReplacementRe) {
        var re = optimizationReplacementRe || defaultReplacementRe;
        var cacheString = String(text).replace(re, '0');
        var width = this._cache.get(cacheString);
        if (width === undefined) {
            width = ctx.measureText(cacheString).width;
            if (width === 0 && text.length !== 0) {
                // measureText can return 0 in FF depending on a canvas size, don't cache it
                return 0;
            }
            // A cyclic buffer is used to keep track of the cache keys and to delete
            // the oldest one before a new one is inserted.
            // ├──────┬──────┬──────┬──────┤
            // │ foo  │ bar  │      │      │
            // ├──────┴──────┴──────┴──────┤
            //                 ↑ index
            // Eventually, the index reach the end of an array and roll-over to 0.
            // ├──────┬──────┬──────┬──────┤
            // │ foo  │ bar  │ baz  │ quux │
            // ├──────┴──────┴──────┴──────┤
            //   ↑ index = 0
            // After that the oldest value will be overwritten.
            // ├──────┬──────┬──────┬──────┤
            // │ WOOT │ bar  │ baz  │ quux │
            // ├──────┴──────┴──────┴──────┤
            //          ↑ index = 1
            var oldestKey = this._keys[this._keysIndex];
            if (oldestKey !== undefined) {
                this._cache.delete(oldestKey);
            }
            // Set a newest key in place of the just deleted one
            this._keys[this._keysIndex] = cacheString;
            // Advance the index so it always points the oldest value
            this._keysIndex = (this._keysIndex + 1) % this._keys.length;
            this._cache.set(cacheString, width);
        }
        return width;
    };
    return TextWidthCache;
}());
export { TextWidthCache };
