import { ensureNotNull } from '../../helpers/assertions';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { PaneRendererMarks } from '../../renderers/marks-renderer';
function createEmptyMarkerData() {
    return {
        items: [{
                x: 0,
                y: 0,
                time: 0,
                price: 0,
            }],
        lineColor: '',
        backColor: '',
        radius: 0,
        visibleRange: null,
    };
}
var rangeForSinglePoint = { from: 0, to: 1 };
var CrosshairMarksPaneView = /** @class */ (function () {
    function CrosshairMarksPaneView(chartModel, crosshair) {
        this._compositeRenderer = new CompositeRenderer();
        this._markersRenderers = [];
        this._markersData = [];
        this._invalidated = true;
        this._chartModel = chartModel;
        this._crosshair = crosshair;
        this._compositeRenderer.setRenderers(this._markersRenderers);
    }
    CrosshairMarksPaneView.prototype.update = function (updateType) {
        var serieses = this._chartModel.serieses();
        if (serieses.length !== this._markersRenderers.length) {
            this._markersData = serieses.map(createEmptyMarkerData);
            this._markersRenderers = this._markersData.map(function (data) {
                var res = new PaneRendererMarks();
                res.setData(data);
                return res;
            });
            this._compositeRenderer.setRenderers(this._markersRenderers);
        }
        this._invalidated = true;
    };
    CrosshairMarksPaneView.prototype.renderer = function (height, width, addAnchors) {
        if (this._invalidated) {
            this._updateImpl(height);
            this._invalidated = false;
        }
        return this._compositeRenderer;
    };
    CrosshairMarksPaneView.prototype._updateImpl = function (height) {
        var _this = this;
        var serieses = this._chartModel.serieses();
        var timePointIndex = this._crosshair.appliedIndex();
        var timeScale = this._chartModel.timeScale();
        serieses.forEach(function (s, index) {
            var _a;
            var data = _this._markersData[index];
            var seriesData = s.markerDataAtIndex(timePointIndex);
            if (seriesData === null || !s.visible()) {
                data.visibleRange = null;
                return;
            }
            var firstValue = ensureNotNull(s.firstValue());
            data.lineColor = seriesData.backgroundColor;
            data.radius = seriesData.radius;
            data.items[0].price = seriesData.price;
            data.items[0].y = s.priceScale().priceToCoordinate(seriesData.price, firstValue.value);
            data.backColor = (_a = seriesData.borderColor) !== null && _a !== void 0 ? _a : _this._chartModel.backgroundColorAtYPercentFromTop(data.items[0].y / height);
            data.items[0].time = timePointIndex;
            data.items[0].x = timeScale.indexToCoordinate(timePointIndex);
            data.visibleRange = rangeForSinglePoint;
        });
    };
    return CrosshairMarksPaneView;
}());
export { CrosshairMarksPaneView };
