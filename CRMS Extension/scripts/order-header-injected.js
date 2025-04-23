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

calculate_sticky_positions = function() {
    var t = cobra.ui.get_header_height(),
        e = cobra.ui.is_mobile_view() ? 0 : $("#opportunity_items_title").height();
    $(".quick-add-section").css("top", t + e)
}

calculate_sticky_positions();
cobra.ui.set_sticky(["#opportunity_items_title", ".quick-add-section"], "#opportunity_items_scrollable", cobra.ui.get_header_height());

