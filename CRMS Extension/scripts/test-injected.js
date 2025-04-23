(function() {
    console.log('Test injection script is running.');
    window.onload = function() {
    setTimeout(() => {

    if (typeof $ !== 'undefined') {
        console.log('jQuery is available.');
        if ($.fn && $.fn.editable) {
            console.log('$.fn.editable is available.');


            // SECTION TO LOG AJAX REQUESTS
            const originalAjax = $.ajax;
            $.ajax = function(settings) {
                console.log('AJAX request:', settings);
                return originalAjax.apply(this, arguments);
            };
        }
    }

}, 500);
}
})();
    
    