/* 
 * scripts for loosewire flow tool
 * lw-dropdown.js
 * by @aravindanve
 *
 */

+function ($, window, document) {

    var dropdownSelector = '[data-dropdown]',
        openClass = 'open';

    var _isOpen = false;

    function showDropdown(e) {
        if (null === e) return;
        clearMenus();
        $(e.target).parents(dropdownSelector)
            .addClass(openClass);
        _isOpen = true;
        e.preventDefault();
        return false;
    }

    function clearMenus() {
        if (_isOpen) {
            $(dropdownSelector+ '.' + openClass)
                .removeClass(openClass);
            _isOpen = false;
        }
    }

    $(function () {

        var $doc = $(document);

        if ($doc.length) {
            $doc.on('click', dropdownSelector, showDropdown);
            $doc.on('click', clearMenus);
        } else {
            console.log('Error: could not load dropdowns');
        }
        
    });

}(jQuery, window, document);


// eof