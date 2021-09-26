import { assert } from '../helpers/assertions';
import { isString } from '../helpers/strict-type-checks';
import { ChartApi } from './chart-api';
/**
 * This function is the main entry point of the Lightweight Charting Library
 *
 * @param container - id of HTML element or element itself
 * @param options - any subset of ChartOptions to be applied at start.
 * @returns an interface to the created chart
 */
export function createChart(container, options) {
    var htmlElement;
    if (isString(container)) {
        var element = document.getElementById(container);
        assert(element !== null, "Cannot find element in DOM with id=" + container);
        htmlElement = element;
    }
    else {
        htmlElement = container;
    }
    return new ChartApi(htmlElement, options);
}
