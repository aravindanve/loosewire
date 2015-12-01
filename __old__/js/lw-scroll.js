(function ($, window) {

    function LwScroll($elem, options) {
        this.$elem = $elem;
        this.options = $.extend({
            testOption: true
        }, options);
        this.init();
        console.log($elem);
    }

    var _inBusiness = false;
    var rAF = window.requestAnimationFrame;
    var cAF = window.cancelAnimationFrame;

    var events = {};

    events.wheel = function (e) {
        if (null === e) return;
        var delta = e.delta || 
            e.wheelDelta || 
            (e.originalEvent && 
                e.originalEvent.wheelDelta) || 
            -e.detail || 
            (e.originalEvent && 
                -e.originalEvent.detail);

    };

    LwScroll.prototype = {
        init: function () {
            var _ref = this;
            this.mouseIn = false;
            this.scrollRAF = null;
            this.$elem.css({
                'overflow': 'hidden'
            }).on('scroll', function (e) {

            }).on('wheel', function (e) {
                var deltaX = e && (
                    (e.originalEvent && e.originalEvent.deltaX)
                ) || null;
                var deltaY = e && (
                    (e.originalEvent && e.originalEvent.deltaY)
                ) || null;
                if (!deltaX && !deltaY) return;
                if (deltaX) {
                    _ref.contentScrollLeft = _ref.contentScrollLeft || 0;
                    _ref.contentScrollLeft += deltaY;
                }
                if (deltaY) {
                    _ref.contentScrollTop = _ref.contentScrollTop || 0;
                    _ref.contentScrollTop += deltaY;
                }
                console.log(_ref.contentScrollLeft, _ref.contentScrollTop);

            }).on('mouseenter', function (e) {
                _inBusiness = true;
            }).on('mouseleave', function (e) {
                _inBusiness = false;
            });

            $('body').on('scroll wheel mousewheel', function (e) {
                if (_inBusiness) {
                    e.preventDefault();
                }
            });
        }
    };

    $.fn.lwScroll = function (options) {
        var $selected = $(this);
        $selected.each(function () {
            $(this).data(
                '__lwScroll', 
                new LwScroll($(this), options)
            );
        });
    };

})(jQuery, window);