export var LineType;
(function (LineType) {
    LineType[LineType["Simple"] = 0] = "Simple";
    LineType[LineType["WithSteps"] = 1] = "WithSteps";
})(LineType || (LineType = {}));
export var LineStyle;
(function (LineStyle) {
    LineStyle[LineStyle["Solid"] = 0] = "Solid";
    LineStyle[LineStyle["Dotted"] = 1] = "Dotted";
    LineStyle[LineStyle["Dashed"] = 2] = "Dashed";
    LineStyle[LineStyle["LargeDashed"] = 3] = "LargeDashed";
    LineStyle[LineStyle["SparseDotted"] = 4] = "SparseDotted";
})(LineStyle || (LineStyle = {}));
export function setLineStyle(ctx, style) {
    var _a;
    var dashPatterns = (_a = {},
        _a[0 /* Solid */] = [],
        _a[1 /* Dotted */] = [ctx.lineWidth, ctx.lineWidth],
        _a[2 /* Dashed */] = [2 * ctx.lineWidth, 2 * ctx.lineWidth],
        _a[3 /* LargeDashed */] = [6 * ctx.lineWidth, 6 * ctx.lineWidth],
        _a[4 /* SparseDotted */] = [ctx.lineWidth, 4 * ctx.lineWidth],
        _a);
    var dashPattern = dashPatterns[style];
    ctx.setLineDash(dashPattern);
}
export function drawHorizontalLine(ctx, y, left, right) {
    ctx.beginPath();
    var correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(left, y + correction);
    ctx.lineTo(right, y + correction);
    ctx.stroke();
}
export function drawVerticalLine(ctx, x, top, bottom) {
    ctx.beginPath();
    var correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(x + correction, top);
    ctx.lineTo(x + correction, bottom);
    ctx.stroke();
}
export function strokeInPixel(ctx, drawFunction) {
    ctx.save();
    if (ctx.lineWidth % 2) {
        ctx.translate(0.5, 0.5);
    }
    drawFunction();
    ctx.restore();
}
