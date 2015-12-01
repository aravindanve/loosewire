/* 
 * scripts for loosewire flow tool
 * lw-app.js
 * by @aravindanve
 *
 */

+function ($, window, document) {

    if (!$.fn.onResize) {
        console.log('This requires lw-onresize.js');
    }

    var DEBUG = true;

    var toolbarId       = 'lwToolbar',
        guidesCornerId  = 'lwGuidesCorner',
        colGuidesId     = 'lwColGuides',
        rowGuidesId     = 'lwRowGuides',
        viewportId      = 'lwViewport', 
        depotId         = 'lwUIDepot';

    var _register = {},
        _eventBursts = {},
        _alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var rAF = window.requestAnimationFrame,
        cAF = window.cancelAnimationFrame;

    // functions

    function $newElem(itemId) {
        return _register.depot
            .find('[data-ui-item-id="' + itemId + '"]')
            .clone();
    }

    function viScope(selector) {
        selectors = selector.split(',');
        for (i in selectors) {
            selectors[i] = '#' + viewportId + ' ' + 
                (selectors[i] + '').trim();
        }
        return selectors.join(', ');
    };

    function toBaseAlpha(num) {
        num = num > 0? num - 1 : 0; 
        if (num < _alpha.length) {
            return _alpha[num]; 
        } else {
            return toBaseAlpha(
                Math.floor(num/_alpha.length)) + 
            '' + _alpha[num%_alpha.length];
        } 
    }

    function getViewport() {
        if (!(_register.viewport instanceof $)) {
            _register.viewport = $('#' + viewportId);
        }
        return _register.viewport;
    }

    function getCanvas() {
        if (!(_register.canvas instanceof $)) {
            _register.canvas = getViewport()
                .find('[data-canvas]');
        }
        return _register.canvas;
    }

    function getPage() {
        if (!(_register.page instanceof $)) {
            _register.page = getCanvas()
                .find('[data-page]');
        }
        return _register.page;
    }

    function getGrid() {
        if (!(_register.grid instanceof $)) {
            _register.grid = getPage()
                .find('[data-grid]');
        }
        return _register.grid;
    }

    function getColGuideParent() {
        if (!(_register.colGuideParent instanceof $)) {
            _register.colGuideParent = $('#' + colGuidesId);
        }
        return _register.colGuideParent;
    }

    function getColGuide() {
        if (!(_register.colGuide instanceof $)) {
            _register.colGuide = getColGuideParent()
                .find('[data-guide-col-trow]');
        }
        return _register.colGuide;
    }

    function getRowGuideParent() {
        if (!(_register.rowGuideParent instanceof $)) {
            _register.rowGuideParent = $('#' + rowGuidesId);
        }
        return _register.rowGuideParent;
    }

    function getRowGuide() {
        if (!(_register.rowGuide instanceof $)) {
            _register.rowGuide = getRowGuideParent()
                .find('[data-guide-row-wrapper]');
        }
        return _register.rowGuide;
    }

    function getGuidesCorner() {
        if (!(_register.guidesCorner instanceof $)) {
            _register.guidesCorner = $('#' + guidesCornerId);
        }
        return _register.guidesCorner;
    }

    function getColGuideCorner() {
        if (!(_register.colGuideCorner instanceof $)) {
            _register.colGuideCorner = getGuidesCorner()
                .find('[data-guide-corner-col]');
        }
        return _register.colGuideCorner;
    }

    function getRowGuideCorner() {
        if (!(_register.rowGuideCorner instanceof $)) {
            _register.rowGuideCorner = getGuidesCorner()
                .find('[data-guide-corner-row]');
        }
        return _register.rowGuideCorner;
    }

    function isColGuideLeftHidden(scrollAmount) {
        return (scrollAmount || getViewport().scrollLeft()
            ) > _register.canvasPaddingLeft;
    }

    function isRowGuideTopHidden(scrollAmount) {
        return (scrollAmount || getViewport().scrollTop()
            ) > _register.canvasPaddingTop;
    }

    // classes

    function Wirescreen(options) {
        options = options || {};
        this.type = options.type || Wirescreen.types.WINDOW;
        this.title = options.title || '';
    }

    Wirescreen.types = {
        WINDOW: 0,
        MODAL: 1,
        POPUP: 2
    };

    // actions

    function addWirescreen(e) {
        if (null === e) return;
        $cell = $(e.target).parents('[data-cell]');
        $wirescreen = $newElem('canvas:cell:wirescreen');
        $wirescreen.data('__wirescreen', new Wirescreen({
            type: Wirescreen.types.WINDOW,
            title: 'untitled'
        }));
        $cell.empty()
            .append($newElem('canvas:cell:options'))
            .append($newElem('canvas:cell:content')
                .append($wirescreen));
        // add resize listener
        $cell.onResize(function (e) {
            $(document).trigger(
                'lw.cell.resized', [$cell.get(0)]);
        });
        resizeGrid();
    }

    function removeWirescreen(e) {
        // remove resize listener
    }

    function evalEventBurst(key, fn) {
        return window.setTimeout(function () {
            console.log('inside evalEventBurst ' + Math.random().toString(36).slice(2));
            if (!(_eventBursts[key] && _eventBursts[key].length)) {
                return;
            }
            var queue = [];
            while (_eventBursts[key].length) {
                var _context = _eventBursts[key].pop();
                if (queue.indexOf(_context) < 0) {
                    queue.push(_context);
                    console.log('found unique event ' + Math.random().toString(36).slice(2));
                }
            }
            console.log('executing event handler ' + Math.random().toString(36).slice(2));
            queue.forEach(fn); // fn(context, index, array)
        }, 10);
    }

    function cellResized(e, context) {
        console.log('cell resized ' + Math.random().toString(36).slice(2));
        if ('undefined' === typeof _eventBursts.cellResized) {
            _eventBursts.cellResized = [];
        }
        rowContext = $(context).parents('[data-row]').get(0);
        _eventBursts.cellResized.push(rowContext)
        evalEventBurst('cellResized', function (rowElem) {
            console.log('resizing row ' + Math.random().toString(36).slice(2));
            console.log(rowElem);
            resizeRowGuide(rowElem);
        });
    }

    function refreshGuides(cols) {
        if ('undefined' === typeof cols) {
            cols = 0;
            getGrid().find('[data-row]').each(function () {
                var cellCount = $(this).find('[data-cell]').length;
                cols = cols < cellCount? cellCount : cols;
            });
        }

        var $colGuides = getColGuide()
            .find('[data-guide-col]');

        for (var i = cols; i < $colGuides.length; i++) {
            $colGuides.last().remove();
        }

        for (var i = $colGuides.length; i < cols; i++) {
            getColGuide().append($newElem('guide:col')
                .find('[data-guide-col-inner]')
                .append(i+1).end());
        }

        getColGuide().parents('[data-guide-col-padding]').css({
            'min-width': computePageWidth(cols, _register.cellWidth)
        });

        $rows = getGrid().find('[data-row]');
        var $rowGuides = getRowGuide()
            .find('[data-guide-row]');

        for (var i = $rows.length; i < $rowGuides.length; i++) {
            $rowGuides.last().remove();
        }

        for (var i = $rowGuides.length; i < $rows.length; i++) {
            getRowGuide().append($newElem('guide:row')
                .find('[data-guide-row-inner]')
                .append(toBaseAlpha(i+1)
                    .split('').join(' ')).end());
        }

        for (var i = 0; i < $rows.length; i++) {
            $rowGuides.eq(i).css('height', $rows.eq(i).height());
        }
        scrollGuides(null);
    }

    function resizeRowGuide(rowElem) {
        console.log('RESIZE');
        console.log(getGrid().find('[data-row]')
            .get());
        console.log(getGrid().find('[data-row]')
            .get().indexOf(rowElem));

        var num = getGrid().find('[data-row]')
            .get().indexOf(rowElem);

        console.log(getRowGuide().find('[data-guide-row]')
            .eq(num));

        getRowGuide().find('[data-guide-row]')
            .eq(num).css('height', $(rowElem).height());
    }

    function scrollGuides(e) {
        window.setTimeout(function () {

            var viewportScrollLeft = getViewport().scrollLeft(),
                viewportScrollTop = getViewport().scrollTop(),
                canvasTop = getCanvas().position().top
                canvasOffsetTop = getCanvas().offset().top;

            getColGuideParent()
                .scrollLeft(viewportScrollLeft);


            if (canvasTop) {
                getRowGuide()
                    .css('top', canvasTop + 'px');
            } else if ((0 === canvasTop) && 
                    (canvasOffsetTop > _register.viewportOffsetTop)) 
            {   // safari hack
                getRowGuide()
                    .css('top', (canvasOffsetTop 
                        - _register.viewportOffsetTop) + 'px');
            } else {
                getRowGuide()
                    .css('top', (-viewportScrollTop) + 'px' );
            }

            if (isColGuideLeftHidden(viewportScrollLeft)) {
                getColGuideCorner().css('display', 'block');
            } else {
                getColGuideCorner().css('display', '');
            }

            if (isRowGuideTopHidden(viewportScrollTop)) {
                getRowGuideCorner().css('display', 'block');
            } else {
                getRowGuideCorner().css('display', '');
            }
        }, 10);
    }

    function computePageWidth(cols, cellWidth, borderWidth) {
        // border-collapse: collapse
        // forces border-left-width: 1px on table
        // and border-right-width: 1px on cells
        cellWidth = _register.cellWidth || 0;
        borderWidth = borderWidth || 1;
        return (
            (cols * cellWidth) + // cell widths
            (cols * borderWidth) + // cell right borders
            borderWidth // row left border
        );
    }

    function recalcCellWidth() {
        $tempCell = $newElem('canvas:cell')
            .find('[data-add-wirescreen]')
            .remove()
            .end()
            .css('opacity', '0')
            .append($newElem('canvas:cell:wirescreen'));

        $(getGrid()).find('[data-row]')
            .first()
            .append($tempCell);

        _register.cellWidth = $tempCell
            .find('[data-wirescreen]')
            .width();

        $tempCell.remove();
    }

    function resizePage() {
        if (!(_register.cellWidth > 0)) {
            recalcCellWidth();
            return resizePage();
        }
        var maxCol = 0;
        getGrid().find('[data-row]').each(function () {
            var cellCount = $(this).find('[data-cell]').length;
            maxCol = maxCol < cellCount? cellCount : maxCol;
        });
        var newPageWidth = computePageWidth(
            maxCol, _register.cellWidth);

        getPage().css({
            'min-width': newPageWidth
        });
        // safari hack
        getCanvas().css({
            'min-width': newPageWidth + (
                _register.canvasPaddingLeft * 2)
        });

        // refresh guides
        refreshGuides(maxCol);
    }

    function resizeGrid() {
        var $extraRows = $();
        getGrid().find('[data-row]').each(function () {
            var $extraCols = $();
            $(this).find('[data-cell]').each(function () {
                if ($(this).find('[data-add-wirescreen]').length) {
                    $extraCols = $extraCols.add(this);
                } else {
                    $extraCols = $();
                }
            });
            if (!$extraCols.length) {
                $(this).append($newElem('canvas:cell'));
            } else if ($extraCols.length > 1) {
                $extraCols.not($extraCols[0]).remove();
            }
            if ($(this).find('[data-cell]').length < 2) {
                $extraRows = $extraRows.add(this);
            } else {
                $extraRows = $();
            }
        });
        if (!$extraRows.length) {
            getGrid().append($newElem('canvas:row')
                .append($newElem('canvas:cell')));
        } else if ($extraRows.length > 1) {
            $extraRows.not($extraRows[0]).remove();
        }
        resizePage();
    }

    function resetCanvas() {
        _register.grid = null;
        _register.page = null;
        _register.canvas = null;
        _register.viewport = null;
        $newElem('canvas:grid')
            .appendTo($newElem('canvas:page')
                .appendTo($newElem('canvas:wrapper')
                    .appendTo($newElem('common:canvas')
                        .appendTo(getViewport().empty()))));
        $newElem('guide:col:wrapper')
            .appendTo(getColGuideParent().empty());
        $newElem('guide:row:wrapper')
            .appendTo(getRowGuideParent().empty());

        if (!(_register.canvasPaddingTop > 0)) {
            _register.canvasPaddingTop = parseInt(getCanvas()
                .css('paddingTop')
                .replace(/px$/i, ''));
        }

        if (!(_register.canvasPaddingLeft > 0)) {
            _register.canvasPaddingLeft = parseInt(getCanvas()
                .css('paddingLeft')
                .replace(/px$/i, ''));
        }

        if (!(_register.viewportOffsetTop > 0)) {
            _register.viewportOffsetTop = getViewport()
                .offset().top;
        }

        resizeGrid();
    }

    $.fn.assocEvent = function (onEvent, doEvent) {
        $(this).on(onEvent, function (e) {
            $(document).trigger(doEvent, e);
        });
    };

    $.fn.on

    // timer functions
    // function 

    $(function () {

        // remove depot form DOM
        var $depot = $('#' + depotId);
        _register.depot = $depot.clone();
        $depot.remove();

        // associated event triggers
        getViewport().assocEvent('scroll', 'lw.viewport.scroll');
        $(window).assocEvent('resize', 'lw.window.resize');

        // attach event handlers
        $(document).on('click', '[data-add-wirescreen]', addWirescreen);
        $(document).on('lw.viewport.scroll', scrollGuides);
        $(document).on('lw.window.resize', scrollGuides);
        $(document).on('lw.cell.resized', cellResized);

        // set up canvas
        resetCanvas();
        // for (var i = 0; i < 10; i++) { var $elem = $('[data-add-wirescreen]'); for (var j = 0; j < 5; j++) { $elem.eq(j).trigger('click'); }}

    });

    if (DEBUG) {
        window.__loosewire = {
            _register: _register
        };
    }

}(jQuery, window, document);


// eof