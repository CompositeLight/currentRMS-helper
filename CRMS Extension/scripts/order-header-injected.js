function getBaseHeaderHeight() {
    return cobra.ui.is_mobile_view() ? 54 : 56;
}

function getHelperBarHeight() {
    const helperBar = document.getElementById("helper-control-panel");
    return helperBar ? helperBar.offsetHeight : 0;
}

calculate_sticky_positions = function() {
    var t = getBaseHeaderHeight(),
        e = cobra.ui.is_mobile_view() ? 0 : $("#opportunity_items_title").height(),
        h = cobra.ui.is_mobile_view() ? 0 : getHelperBarHeight();
    $(".quick-add-section").css("top", t + e + h)
}

cobra.ui.set_sticky(["#opportunity_items_title", ".quick-add-section"], "#opportunity_items_scrollable", getBaseHeaderHeight());
calculate_sticky_positions();
