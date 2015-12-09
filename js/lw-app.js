/* 
 * scripts for loosewire flow tool
 * lw-app.js
 * by @aravindanve
 *
 */

+function ($, window, document) {
    'use strict';

    if ('function' !== typeof window.Raphael) {
        console.log('This requires raphaeljs library');
    }

    if ('function' !== typeof $.fn.onResize) {
        console.log('This requires lw-onresize.js extention');
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

    var Raphael = window.Raphael,
        rAF = window.requestAnimationFrame,
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

    function randStr() {
        return Math.random().toString(36).slice(2);
    }

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

    // register access

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

    // get elements

    // 

    // extentions

    $.fn.floatWidth = function () {
        return $(this)[0].getBoundingClientRect().width;
    };

    $.fn.floatHeight = function () {
        return $(this)[0].getBoundingClientRect().height;
    };

    $.fn.assocEvent = function (onEvent, doEvent) {
        $(this).on(onEvent, function (e) {
            $(document).trigger(doEvent, e);
        });
        return $(this);
    };

    Raphael.fn.newMarker = function () {
        var marker = this.circle.apply(this, arguments);
        marker.node.setAttribute('sdata:marker', '');
        return marker;
    }; 

    Raphael.fn.newConnector = function () {
        var connector = this.rect.apply(this, arguments);
        connector.node.setAttribute('sdata:connector', '');
        return connector;
    };

    // classes

    // SVGPathString

    // M  moveto (x y)+
    // Z  closepath (none)
    // L  lineto (x y)+
    // H  horizontal lineto x+
    // V  vertical lineto y+
    // C  curveto (x1 y1 x2 y2 x y)+
    // S  smooth curveto (x2 y2 x y)+
    // Q  quadratic Bézier curveto (x1 y1 x y)+
    // T  smooth quadratic Bézier curveto (x y)+
    // A  elliptical arc (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+
    // R  Catmull-Rom curveto*    x1 y1 (x y)+

    // * “Catmull-Rom curveto” is a not standard SVG command and added in 2.0 
    // to make life easier. Note: there is a special case when path consist of
    // just three commands: “M10,10R…z”. In this case path will smoothly
    // connects to its beginning. 

    function SVGPathString() {
        this.pathString = '';
    }

    SVGPathString.prototype = {
        toString: function (x, y) {
            return this.pathString;
        },
        _cmdStr: function (cmd) {
            var pathArgs = '';
            for (var i = 1; i < arguments.length; i++) {
                pathArgs += ',' + (arguments[i] + 0).toFixed(4);
            }
            return cmd + pathArgs.replace(/^\,/, '');
        },
        moveTo: function (x, y) {
            this.pathString += this._cmdStr('M', x, y);
            return this;
        },
        closePath: function () {
            this.pathString += this._cmdStr('Z');
            return this;
        },
        lineTo: function (x, y, delta) {
            var args = [], _delta = false;
            for (var i = 0; i < arguments.length; i++) {
                if (true === arguments[i]) {
                    _delta = true;
                } else {
                    args.push(arguments[i]);
                }
            }
            this.pathString += this._cmdStr.apply(
                this, [_delta? 'l': 'L'].concat(args));
            return this;
        },
        horizontalLineTo: function (x, delta) {
            this.pathString += this._cmdStr(
                delta? 'h': 'H', x);
            return this;
        },
        verticalLineTo: function (y, delta) {
            this.pathString += this._cmdStr(
                delta? 'v': 'V', y);
            return this;
        },
        curveTo: function (x1, y1, x2, y2, x, y, delta) {
            this.pathString += this._cmdStr(
                delta? 'c': 'C', x1, y1, x2, y2, x, y);
            return this;
        },
        smoothCurveTo: function (x2, y2, x, y, delta) {
            this.pathString += this._cmdStr(
                delta? 's': 'S', x2, y2, x, y);
            return this;
        },
        quadraticBezierCurveTo: function (x1, y1, x, y, delta) {
            this.pathString += this._cmdStr(
                delta? 'q': 'Q', x1, y1, x, y);
            return this;
        },
        smoothQuadraticBezierCurveTo: function (x, y, delta) {
            this.pathString += this._cmdStr(
                delta? 't': 'T', x, y);
            return this;
        },
        ellipticalArc: function (rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y, delta) {
            this.pathString += this._cmdStr(
                delta? 'a': 'A', rx, ry, xAxisRotation, 
                largeArcFlag, sweepFlag, x, y);
            return this;
        }
    };

    function Wirescreen(options) {
        var _ctx = this;
        options = options || {};

        // constants
        this.markerSize = 4;

        // attributes
        this.type = options.type || Wirescreen.types.WINDOW;
        this.title = options.title || '';

        // marker numbering [ order ]
        // +----------------------+
        // |  0[1]   1[3]   2[2]  |
        // |  3[4]   4[6]   5[5]  |
        // |  6[7]   7[9]   8[8]  |
        // +----------------------+
        // this.markers = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.markers = [0, 1, 4, 7, 8];
        this._markerCoordinates = {};

        // ui elements
        this.$wirescreen = $newElem('canvas:cell:wirescreen');
        this.markersElem = this.$wirescreen
            .find('[data-wirescreen-markers]').get(0);
        this.connectorsElem = this.$wirescreen
            .find('[data-marker-connectors]').get(0);

        if (this.markersElem) {
            Raphael(this.markersElem, 10, 10, 
                function () {
                    _ctx._resetPaper.apply(_ctx, [this.canvas]);
                    _ctx.markersElem.__paper = this;
                    _ctx._registerSizes.call(_ctx);
                    _ctx.redrawMarkers.call(_ctx);
                });
        }

        if (this.connectorsElem) {
            Raphael(this.connectorsElem, 10, 10, 
                function () {
                    _ctx._resetPaper.apply(_ctx, [this.canvas]);
                    _ctx.connectorsElem.__paper = this;
                    _ctx._registerSizes.call(_ctx);
                    _ctx.redrawConnectors.call(_ctx);
                });
        }

        // attach reference to self
        this.$wirescreen.data('__wirescreen', this);

        return this.$wirescreen;
    }

    Wirescreen.types = {
        WINDOW: 0,
        MODAL: 1,
        POPUP: 2
    };

    Wirescreen.prototype._resetPaper = function (paper) {
        paper.setAttribute('preserveAspectRatio', 'none');
        paper.setAttribute(
            'xmlns:sdata', 'sdata:contains-information');
        paper.removeAttribute('width');
        paper.removeAttribute('height');
        paper.style.position = 'absolute';
        paper.style.top = '0';
        paper.style.left = '0';
        paper.style.width = '100%';
        paper.style.height = '100%';
    };

    Wirescreen.prototype._registerSizes = function () {
        if (!this.markersElem.__paper) return;
        var mCanvas = this.markersElem.__paper.canvas;
        if ('undefined' === typeof _register.markerCanvasOffsetTop) {
            _register.markerCanvasOffsetTop = $(mCanvas).offset().top - 
                this.$wirescreen.find('[data-real-wirescreen]').offset().top;
        }
        this.markerCanvasOffsetTop = _register.markerCanvasOffsetTop;
        if ('undefined' === typeof _register.markerCanvasWidth) {
            _register.markerCanvasWidth = $(mCanvas).floatWidth();
        }
        this.markerCanvasWidth = _register.markerCanvasWidth;
        if ('undefined' === typeof _register.markerCanvasHeight) {
            _register.markerCanvasHeight = $(mCanvas).floatHeight();
            _register.markerPathDeviation = _register.markerCanvasHeight / 9;
        }
        this.markerCanvasHeight = _register.markerCanvasHeight;
        this.markerPathDeviation = _register.markerPathDeviation;
        
        if (!this.connectorsElem.__paper) return;
        var cCanvas = this.connectorsElem.__paper.canvas;
        if ('undefined' === typeof _register.connectorCanvasWidth) {
            _register.connectorCanvasWidth = $(cCanvas).floatWidth();
        }
        this.connectorCanvasWidth = _register.connectorCanvasWidth;
    };

    Wirescreen.prototype._markerPathString = function (marker, x, y) {
        var pathString = new SVGPathString().moveTo(x, y);
        // left column markers go above to avoid collision
        if (([0, 3, 6].indexOf(marker) > -1) &&
            ((this.markers.indexOf(marker + 1) > -1) ||
            (this.markers.indexOf(marker + 2) > -1))) {
            // obstruction
            this._markerCoordinates[marker] = {
                x: x - this.markerPathDeviation, y: y
            };
            pathString.verticalLineTo(-this.markerPathDeviation, true);
        }
        // center column markers go below to avoid collision
        else if (([1, 4, 7].indexOf(marker) > -1) &&
            (this.markers.indexOf(marker + 1) > -1)) {
            // obstruction
            this._markerCoordinates[marker] = {
                x: x + this.markerPathDeviation, y: y
            };
            pathString.verticalLineTo(this.markerPathDeviation, true);
        }
        // right column markers always have straight paths
        // [2, 5, 8] & unobstructed
        else {
            this._markerCoordinates[marker] = {x: x, y: y};
        }
        // straight path
        pathString.horizontalLineTo(this.markerCanvasWidth);
        return pathString;
    };

    Wirescreen.prototype.redrawMarkers = function () {
        var _ctx = this,
            paper = this.markersElem.__paper,
            halfUnitX = _ctx.markerCanvasWidth / 6,
            halfUnitY = _ctx.markerCanvasHeight / 6;

        paper.clear();
        this._markerCoordinates = {};
        this.markers.forEach(function (marker) {
            var x = (halfUnitX * 2 * (marker % 3)) + halfUnitX,
                y = (halfUnitY * 2 * Math.floor(marker / 3)) + halfUnitY;

            paper.newMarker(x, y, _ctx.markerSize);
            paper.path(_ctx._markerPathString.apply(
                _ctx, [marker, x, y]));
        });
    };

    Wirescreen.prototype._ensureConnectorRefs = function () {
        this.connectorRefs || this.connectorRefs = {};
        if (!this.connectorRefs.startX) {
            this.connectorRefs.startX = 3;
        }
        if (!this.connectorRefs.endX) {
            this.connectorRefs.endX = 
                $(this.connectorsElem.__paper.canvas)
                    .floatWidth();
        }
        if (!this.connectorRefs.avgX) {
            this.connectorRefs.avgX = 
                (this.connectorRefs.endX + 
                    this.connectorRefs.startX) / 2;
        }
        if (!this.connectorRefs.deltaX) {
            this.connectorRefs.deltaX = 
                this.connectorRefs.endX - 
                    this.connectorRefs.startX;
        }
    };

    Wirescreen.prototype._connectorPathString = function (marker, ey) {
        var pathString = new SVGPathString().moveTo(x, y);
        // get start from this._markerCoordinates
        // ey arg refers to end point
    };

    Wirescreen.prototype.redrawConnectors = function () {
        return;
        this._ensureConnectorRefs();
        var _ctx = this,
            paper = this.connectorsElem.__paper,
            startX = 3,
            endX = $(paper.canvas).floatWidth(),
            midX = (endX + startX) / 2,
            deltaX = endX - startX,
            curveAt = 0.4,
            midX1 = (deltaX * curveAt) + startX,
            midX2 = (deltaX * (1 - curveAt)) + startX;

        $(this.markersElem.__paper.canvas)
            .find('[sdata\\:marker]').each(function () {
                console.log(_ctx.markerCanvasOffsetTop);
                var startY = ($(this).attr('cy')*1) + 
                        _ctx.markerCanvasOffsetTop,
                    end = _ctx.$wirescreen
                        .find('[data-elements]')
                        .find('[data-group]').first(),
                    endY = end.position().top + 
                            (end.floatHeight() / 2),
                    midY = (endY + startY) / 2;
                    console.log(startX, startY, midX, midY, midX1, midX2, endX, endY);
                    paper.clear();
                    // paper.path(new SVGPathString()
                    //     .moveTo(startX, startY)
                    //     .lineTo(midX1, startY)
                    //     .quadraticBezierCurveTo(midX, startY, midX, midY)
                    //     .smoothQuadraticBezierCurveTo(midX2, endY)
                    //     .lineTo(endX, endY)
                    // );
                    paper.path(new SVGPathString()
                        .moveTo(0, startY)
                        .lineTo(midX1, startY, 
                            midX, midY, 
                            midX2, endY, 
                            endX, endY)

                        // .lineTo(midX1, startY)
                        // .curveTo(midX1, startY, midX, startY, midX, midY)
                        // .smoothCurveTo(midX2, endY, midX2, endY)
                        // .lineTo(endX, endY)
                    );
            });

        // var _ref = this,
        //     mPaper = this.markersElem.__paper,
        //     cPaper = this.connectorsElem.__paper,
        //     startYOffset = $(mPaper.canvas).offset().top - 
        //         _ref.$wirescreen.find('[data-real-wirescreen]').offset().top;
        // $(mPaper.canvas).find('[sdata\\:marker]').each(function () {
        //     console.log('found marker');
        //     var startX = 0;
        //     var startY = ($(this).attr('cy')*1) + startYOffset;
        //     var end = _ref.$wirescreen
        //         .find('[data-elements]')
        //         .find('[data-group]').first();
        //     var endX = $(cPaper.canvas).floatWidth(); 
        //     var endY = end.position().top + (
        //             end.floatHeight() / 2
        //         ); 
        //     console.log(startX, startY, endX, endY);
        //     cPaper.clear();
        //     cPaper.path(new SVGPathString()
        //         .moveTo(startX, startY)
        //         .quadraticBezierCurveTo(
        //             (endX + startX) / 2, 
        //             startY, 
        //             (endX + startX) / 2, 
        //             (endY + startY) / 2)
        //         .smoothQuadraticBezierCurveTo(
        //             endX, endY)
        //         );
        // });
    };
    

    // function resetPaper(context) {
    //     return +function (paper) {
    //         paper.setAttribute('preserveAspectRatio', 'none');
    //         paper.setAttribute(
    //             'xmlns:sdata', 'sdata:contains-information');
    //         paper.removeAttribute('width');
    //         paper.removeAttribute('height');
    //         paper.style.position = 'absolute';
    //         paper.style.top = '0';
    //         paper.style.left = '0';
    //         paper.style.width = '100%';
    //         paper.style.height = '100%';
    //     }(context.canvas);
    // }

    // function redrawMarkers($wirescreen) {
    //     var wirescreenMarkersElem = $wirescreen
    //             .find('[data-wirescreen-markers]').get(0);
    //     if (!wirescreenMarkersElem) return false;

    //     var paper = wirescreenMarkersElem.__paper;
    //     var marker = paper.newMarker(20, 20, 4);
    // }

    // function redrawConnectors(elem) {
    //     var markerConnectorsElem = null;
    //     if (elem instanceof $) {
    //         markerConnectorsElem = elem
    //             .find('[data-marker-connectors]').get(0);
    //     } else {
    //         markerConnectorsElem = elem;
    //     }
    //     if (!markerConnectorsElem) return false;

    //     var paper = markerConnectorsElem.__paper;
    //     $(markerConnectorsElem)
    //         .find('[sdata\\:marker]').each(function () {

    //         });
    //     var connector = paper.newConnector();
    //     var circle = paper.circle(12, 12, 10);
    //         // circle.attr("fill", "#f00");
    //         // circle.attr("stroke", "#fff");
    // }

    // function setUpConnectors($wirescreen) {
    //     var wirescreenMarkersElem = $wirescreen
    //             .find('[data-wirescreen-markers]').get(0),
    //         markerConnectorsElem = $wirescreen
    //             .find('[data-marker-connectors]').get(0);

    //     if (!wirescreenMarkersElem) return false;
    //     Raphael(wirescreenMarkersElem, 10, 10, function () {
    //         resetPaper(this);
    //         wirescreenMarkersElem.__paper = this;
    //         redrawMarkers(wirescreenMarkersElem);
    //     });
    //     if (!markerConnectorsElem) return false;
    //     Raphael(markerConnectorsElem, 10, 10, function () {
    //         resetPaper(this);
    //         markerConnectorsElem.__paper = this;
    //         redrawConnectors(markerConnectorsElem);
    //     });
    //     return true;
    // }

    // actions

    function addWirescreen(e) {
        if (null === e) return;

        var $cell = $(e.target).parents('[data-cell]'),
            $wirescreen = new Wirescreen({
                type: Wirescreen.types.WINDOW,
                title: 'untitled'
            });

        $cell.empty()
            .append($newElem('canvas:cell:options'))
            .append($newElem('canvas:cell:content')
                .append($wirescreen));

        resizeGrid();

        // var $cell = $(e.target).parents('[data-cell]'),
        //     $wirescreen = $newElem('canvas:cell:wirescreen');

        // $wirescreen.data('__wirescreen', new Wirescreen({
        //     type: Wirescreen.types.WINDOW,
        //     title: 'untitled'
        // }));
        // $cell.empty()
        //     .append($newElem('canvas:cell:options'))
        //     .append($newElem('canvas:cell:content')
        //         .append($wirescreen));
        // // add resize listener
        // $cell.onResize(function (e) {
        //     $(document).trigger(
        //         'lw.cell.resized', [this]);
        // });
        // // set up connectors
        // // setUpConnectors($wirescreen);
        // resizeGrid();
    }

    function removeWirescreen(e) {
        // remove resize listener
    }

    /*

    function resetPaper(context) {
        return +function (paper) {
            paper.setAttribute('preserveAspectRatio', 'none');
            paper.setAttribute(
                'xmlns:sdata', 'sdata:contains-information');
            paper.removeAttribute('width');
            paper.removeAttribute('height');
            paper.style.position = 'absolute';
            paper.style.top = '0';
            paper.style.left = '0';
            paper.style.width = '100%';
            paper.style.height = '100%';
        }(context.canvas);
    }

    function redrawMarkers($wirescreen) {
        var wirescreenMarkersElem = $wirescreen
                .find('[data-wirescreen-markers]').get(0);
        if (!wirescreenMarkersElem) return false;

        var paper = wirescreenMarkersElem.__paper;
        var marker = paper.newMarker(20, 20, 4);
    }

    function redrawConnectors(elem) {
        var markerConnectorsElem = null;
        if (elem instanceof $) {
            markerConnectorsElem = elem
                .find('[data-marker-connectors]').get(0);
        } else {
            markerConnectorsElem = elem;
        }
        if (!markerConnectorsElem) return false;

        var paper = markerConnectorsElem.__paper;
        $(markerConnectorsElem)
            .find('[sdata\\:marker]').each(function () {

            });
        var connector = paper.newConnector();
        var circle = paper.circle(12, 12, 10);
            // circle.attr("fill", "#f00");
            // circle.attr("stroke", "#fff");
    }

    function setUpConnectors($wirescreen) {
        var wirescreenMarkersElem = $wirescreen
                .find('[data-wirescreen-markers]').get(0),
            markerConnectorsElem = $wirescreen
                .find('[data-marker-connectors]').get(0);

        if (!wirescreenMarkersElem) return false;
        Raphael(wirescreenMarkersElem, 10, 10, function () {
            resetPaper(this);
            wirescreenMarkersElem.__paper = this;
            redrawMarkers(wirescreenMarkersElem);
        });
        if (!markerConnectorsElem) return false;
        Raphael(markerConnectorsElem, 10, 10, function () {
            resetPaper(this);
            markerConnectorsElem.__paper = this;
            redrawConnectors(markerConnectorsElem);
        });
        return true;
    } */

    function evalEventBurst(key, fn) {
        return window.setTimeout(function () {
            // console.log('inside evalEventBurst ' + randStr());
            if (!(_eventBursts[key] && _eventBursts[key].length)) {
                return;
            }
            var queue = [];
            while (_eventBursts[key].length) {
                var _context = _eventBursts[key].pop();
                if (queue.indexOf(_context) < 0) {
                    queue.push(_context);
                    // console.log('found unique event ' + randStr());
                }
            }
            // console.log('executing event handler ' + randStr());
            queue.forEach(fn); // fn(context, index, array)
        }, 10);
    }

    function cellResized(e, context) {
        // console.log('cell resized ' + randStr());
        if ('undefined' === typeof _eventBursts.cellResized) {
            _eventBursts.cellResized = [];
        }
        var rowContext = $(context).parents('[data-row]').get(0);
        // console.log(context);
        _eventBursts.cellResized.push(rowContext);
        evalEventBurst('cellResized', function (rowElem) {
            // console.log('resizing row ' + randStr());
            // console.log(rowElem);
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

        var $rows = getGrid().find('[data-row]');
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
            $rowGuides.eq(i).css('height', 
                $rows.eq(i)
                .floatHeight());
                // .height());
        }
        scrollGuides(null);
    }

    function resizeRowGuide(rowElem) {
        // console.log('RESIZE');
        // console.log(rowElem);
        var num = getGrid().find('[data-row]')
            .get().indexOf(rowElem);

        getRowGuide().find('[data-guide-row]')
            .eq(num).css('height', 
                $(rowElem).floatHeight());
    }

    function scrollGuides(e) {
        window.setTimeout(function () {

            var viewportScrollLeft = getViewport().scrollLeft(),
                viewportScrollTop = getViewport().scrollTop(),
                canvasTop = getCanvas().position().top,
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
        var $tempCell = $newElem('canvas:cell')
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
            .floatWidth();
            // .width();

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

    // only for use with onResize() and offResize()
    function onCellResize(e) {
        $(document).trigger('lw.cell.resized', [this]);
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
                // add new cell with resize listener
                $(this).append(
                    $newElem('canvas:cell')
                        .onResize(onCellResize));
            } else if ($extraCols.length > 1) {
                // remove resize listener and cell
                $extraCols.not($extraCols[0])
                    .offResize(onCellResize)
                    .remove();
            }
            if ($(this).find('[data-cell]').length < 2) {
                $extraRows = $extraRows.add(this);
            } else {
                $extraRows = $();
            }
        });
        if (!$extraRows.length) {
            getGrid().append($newElem('canvas:row')
                .append($newElem('canvas:cell')
                    .onResize(onCellResize)));
        } else if ($extraRows.length > 1) {
            $extraRows.not($extraRows[0])
                .find('[data-cell]')
                .offResize(onCellResize)
                .end().remove();
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

    // timer functions

    //

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
        
        for (var i = 0; i < 10; i++) { var $elem = $('[data-add-wirescreen]'); for (var j = 0; j < 5; j++) { $elem.eq(j).trigger('click'); }}

    });

    if (DEBUG) {
        window.__loosewire = {
            _register: _register
        };
    }

}(jQuery, window, document);


// eof