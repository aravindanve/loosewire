/* 
 * scripts for loosewire flow tool
 * lw-onresize.js
 * by @aravindanve
 *
 * based on Daniel Buchner's Code
 * available here: 
 * http://www.backalleycoder.com
 * /2013/03/18/cross-browser-event-based-element-resize-detection/
 *
 */

+function ($, window, document) {

    var rAF = window.requestAnimationFrame,
        cAF = window.cancelAnimationFrame;

    function objectResized(e) {
        var win = e.target;
        if (win.__resizeRAF) {
            cAF(win.resizeRAF);
        }
        win.__resizeRAF = rAF(function () {
            var elem = win.__resizeOuterElement;
            elem.__resizeListeners.forEach(function (fn) {
                fn.call(elem, e);
            });
        });
    }

    function objectLoaded(e) {
        this.contentDocument.defaultView
            .__resizeOuterElement = this.__resizeElement;

        this.contentDocument.defaultView
            .addEventListener('resize', objectResized);
    }

    function addResizeListerner(elem, fn) {
        if (!elem.__resizeListeners) {

            elem.__resizeListeners = [];
            if ('static' === window.getComputedStyle(elem)
                    .position) {
                elem.style.position = 'relative';
            }

            var obj = document.createElement('object');
            obj.setAttribute('style', '' +
                'display: block;' +
                'position: absolute;' +
                'top: 0;' +
                'left: 0;' +
                'width: 100%;' +
                'height: 100%;' +
                'overflow: hidden;' +
                'pointer-events: none;' +
                'z-index: -1;');

            obj.onload = objectLoaded;
            obj.type = 'text/html';
            obj.data = 'about:blank';

            obj.__resizeElement = elem;
            elem.__resizeTrigger = obj;

            elem.appendChild(obj);
        }
        elem.__resizeListeners.push(fn);
    }

    function removeResizeListener(elem, fn) {
        if ('undefined' === elem.__resizeListeners) {
            return;
        }
        elem.__resizeListeners.splice(
            elem.__resizeListeners.indexOf(fn), 1);

        if (!elem.__resizeListeners.length) {
            elem.__resizeTrigger.contentDocument.defaultView
                .removeEventListener('resize', objectResized);
                
            elem.__resizeTrigger = !elem.removeChild(
                elem.__resizeTrigger);
        }
    }

    // extend jQuery

    $.fn.onResize = function (next) {
        $selected = $(this);
        for (var i = 0; i < $selected.length; i++) {
            addResizeListerner($selected.get(i), next);
        }
        console.log('attaching');
        console.log($(this)[0].__resizeListeners);
    };

    $.fn.offResize = function (next) {
        $selected = $(this);
        for (var i = 0; i < $selected.length; i++) {
            removeResizeListener($selected.get(i), next);
        }
    };

}(jQuery, window, document);


// eof