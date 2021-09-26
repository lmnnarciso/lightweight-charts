import { TimePoint, TimePointIndex, TimeScalePoint } from './time-data';
export interface TickMark {
    index: TimePointIndex;
    time: TimePoint;
    weight: number;
}
export declare class TickMarks {
    private _marksByWeight;
    private _cache;
    setTimeScalePoints(newPoints: readonly TimeScalePoint[]): void;
    build(spacing: number, maxWidth: number): readonly TickMark[];
    private _buildMarksImpl;
}
