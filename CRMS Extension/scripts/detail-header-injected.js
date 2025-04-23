// redefine the get_header_height function to include the helper bar height
cobra.ui.get_header_height = function() {
    let helperBarHeight = 0;
    const helperBar = document.getElementById("helper-control-panel");
    if (helperBar) {
        // get the current height of the helper bar in the DOM
        helperBarHeight = helperBar.offsetHeight;
    }
    return cobra.ui.is_mobile_view() ? 54 : (56+helperBarHeight);
};

// invoke the page's function to initially set the header height, using the new get_header_height function
!function(eS) {
  
    var tSetup = function() {
        var t = cobra.ui.get_header_height()
        , c = cobra.ui.is_mobile_view() ? 0 : eS("#opportunity_items_title").height()
        , n = eS(".quick-function-section").height()
        , i = parseInt(eS(".quick-function-section").css("padding-bottom"), 10);
        eS(".quick-function-section").css("top", t + c),
        eS("#opportunity_item_header_sticky").css("top", t + c + n + i)
    };

    tSetup();
}(window.jQuery || window.ender);
