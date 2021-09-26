import { isRunningOnClientSide } from '../helpers/is-running-on-client-side';
function checkTouchEvents() {
    if (!isRunningOnClientSide) {
        return false;
    }
    // eslint-disable-next-line no-restricted-syntax
    if ('ontouchstart' in window) {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    return Boolean(window.DocumentTouch && document instanceof window.DocumentTouch);
}
function getMobileTouch() {
    if (!isRunningOnClientSide) {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    var touch = !!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || checkTouchEvents();
    // eslint-disable-next-line no-restricted-syntax
    return 'onorientationchange' in window && touch;
}
export var mobileTouch = getMobileTouch();
function getIsMobile() {
    if (!isRunningOnClientSide) {
        return false;
    }
    // actually we shouldn't check that values
    // we even don't need to know what browser/UA/etc is (in almost all cases, except special ones)
    // so, in MouseEventHandler/PaneWidget we should check what event happened (touch or mouse)
    // not check current UA to detect "mobile" device
    var android = /Android/i.test(navigator.userAgent);
    var iOS = /iPhone|iPad|iPod|AppleWebKit.+Mobile/i.test(navigator.userAgent);
    return android || iOS;
}
export var isMobile = getIsMobile();
