// lw-canvas

(function ($, window) {
    
    window.LwCanvas = window.LwCanvas || {};

    var l = window.LwCanvas

        $canvas = $('.lw-canvas')
        $depot = $('[data-canvas-depot]');

    l.readOnly = l.readOnly || false;

    var isReadOnly = function () {
            if (false === l.readOnly) {
                return false;
            }
            return true;
        },
        toggleEditMode = function (allowEditing) {
            allowEditing = allowEditing || isReadOnly();
            if (allowEditing) {
                setupEditMode();
            } else {
                setupReadOnlyMode();
            }
            return isReadOnly();
        },
        newFormDepot = function (itemId) {
            return $depot.children(
                '[data-item-id="' + itemId + '"]')
                .clone();
        },
        setupEditMode = function () {

        },
        refreshEditMode = function () {
            var $rows = $canvas.children('.grid-row'),
                empty = 0, 
                remove = [];
            if ($rows.length) {
                $rows.each(function () {
                    $(this).removeAttr('data-temp-remove');
                    if ($(this).children().length) {
                        empty = 0;
                        remove = [];
                    } else {
                        if (empty) {
                            remove.push(this);
                        }
                        empty++;
                    }
                });
                for (i in remove) {
                    $(remove[i]).remove();
                }
                if (empty < 1) {
                    newFormDepot('canvas:grid-row')
                        .appendTo($canvas);
                }
            } else {
                newFormDepot('canvas:grid-row')
                    .appendTo($canvas);
            }
        },
        setupReadOnlyMode = function () {

        },
        refreshReadOnlyMode = function () {

        },
        refreshCanvas = function () {
            if (!isReadOnly()) {
                if ($canvas.children(
                    '[data-canvas-grid-row]').length) {
                    if ($canvas.children(
                        '[data-canvas-grid-row]')
                        .last().children().length) {
                        newFormDepot('canvas:grid:row')
                            .appendTo($canvas);
                    }
                } else {
                    newFormDepot('canvas:grid:row')
                        .appendTo($canvas);
                }
            } else {

            }
        },
        initCanvas = function () {
            refreshEditMode();
        };

        initCanvas();

})(jQuery, window);