import { bindToDevicePixelRatio } from 'fancy-canvas/coordinate-space';
import { ensureNotNull } from '../helpers/assertions';
var Size = /** @class */ (function () {
    function Size(w, h) {
        this.w = w;
        this.h = h;
    }
    Size.prototype.equals = function (size) {
        return (this.w === size.w) && (this.h === size.h);
    };
    return Size;
}());
export { Size };
export function getCanvasDevicePixelRatio(canvas) {
    return canvas.ownerDocument &&
        canvas.ownerDocument.defaultView &&
        canvas.ownerDocument.defaultView.devicePixelRatio
        || 1;
}
export function getContext2D(canvas) {
    var ctx = ensureNotNull(canvas.getContext('2d'));
    // sometimes (very often) ctx getContext returns the same context every time
    // and there might be previous transformation
    // so let's reset it to be sure that everything is ok
    // do no use resetTransform to respect Edge
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return ctx;
}
export function createPreconfiguredCanvas(doc, size) {
    var canvas = doc.createElement('canvas');
    var pixelRatio = getCanvasDevicePixelRatio(canvas);
    // we should keep the layout size...
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    // ...but multiply coordinate space dimensions to device pixel ratio
    canvas.width = size.w * pixelRatio;
    canvas.height = size.h * pixelRatio;
    return canvas;
}
export function createBoundCanvas(parentElement, size) {
    var doc = ensureNotNull(parentElement.ownerDocument);
    var canvas = doc.createElement('canvas');
    parentElement.appendChild(canvas);
    var binding = bindToDevicePixelRatio(canvas);
    binding.resizeCanvas({
        width: size.w,
        height: size.h,
    });
    return binding;
}
export function drawScaled(ctx, ratio, func) {
    ctx.save();
    ctx.scale(ratio, ratio);
    func();
    ctx.restore();
}
