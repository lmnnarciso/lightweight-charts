import { GridPaneView } from '../views/pane/grid-pane-view';
var Grid = /** @class */ (function () {
    function Grid(pane) {
        this._paneView = new GridPaneView(pane);
    }
    Grid.prototype.paneView = function () {
        return this._paneView;
    };
    return Grid;
}());
export { Grid };
