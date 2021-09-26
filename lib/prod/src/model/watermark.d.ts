import { HorzAlign, VertAlign } from '../renderers/watermark-renderer';
import { IPaneView } from '../views/pane/ipane-view';
import { ChartModel } from './chart-model';
import { DataSource } from './data-source';
/** Structure describing watermark options */
export interface WatermarkOptions {
    /** Color of the watermark */
    color: string;
    /** Visibility of the watermark. If false, other parameters are ignored */
    visible: boolean;
    /** Text of the watermark. Word wrapping is not supported */
    text: string;
    /** Font size in pixels */
    fontSize: number;
    /** Font family */
    fontFamily: string;
    /** Font style */
    fontStyle: string;
    /** Horizontal alignment of the watermark inside the chart area */
    horzAlign: HorzAlign;
    /** Vertical alignment of the watermark inside the chart area */
    vertAlign: VertAlign;
}
export declare class Watermark extends DataSource {
    private readonly _paneView;
    private readonly _options;
    constructor(model: ChartModel, options: WatermarkOptions);
    paneViews(): readonly IPaneView[];
    options(): Readonly<WatermarkOptions>;
    updateAllViews(): void;
}
