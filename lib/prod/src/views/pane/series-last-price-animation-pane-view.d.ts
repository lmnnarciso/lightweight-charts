import { Series } from '../../model/series';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';
export declare class SeriesLastPriceAnimationPaneView implements IUpdatablePaneView {
    private readonly _series;
    private readonly _renderer;
    private _invalidated;
    private _stageInvalidated;
    private _startTime;
    private _endTime;
    constructor(series: Series<'Area'> | Series<'Line'>);
    update(updateType?: UpdateType): void;
    invalidateStage(): void;
    visible(): boolean;
    animationActive(): boolean;
    renderer(height: number, width: number): IPaneRenderer | null;
    private _updateImpl;
    private _updateRendererDataStage;
    private _duration;
}
