import { IPriceFormatter } from './iprice-formatter';
export declare function numberToStringWithLeadingZero(value: number, length: number): string;
export declare class PriceFormatter implements IPriceFormatter {
    protected _fractionalLength: number | undefined;
    private readonly _priceScale;
    private readonly _minMove;
    constructor(priceScale?: number, minMove?: number);
    format(price: number): string;
    private _calculateDecimal;
    private _formatAsDecimal;
}
