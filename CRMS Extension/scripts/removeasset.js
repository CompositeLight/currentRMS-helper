console.log("Removeasset.js is active");

debugMode = false;
currentUrl = window.location.href;



function shouldremove() {
    return currentUrl.endsWith("remove");
}

function createBlockOutOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'block-out';
    var text = document.createElement('span');
    text.textContent = 'REMOVING ITEM...';
    overlay.appendChild(text);
    if (!debugMode){
      document.body.appendChild(overlay);
    }
}

function extractAssetToRemove(str) {
    // Split the string at "?"
    var parts = str.split('?');

    // Check if there is a part after "?"
    if (parts.length > 1) {
        // Further split the second part at "&" and return the first element
        return parts[1].split('&')[1];
    }

    // Return empty string if no "?" is found
    return '';
}


if (shouldremove()) {
    createBlockOutOverlay();

    createBlockOutOverlay();

    var asset = extractAssetToRemove(currentUrl);

    var theEditForm = document.querySelector('form.simple_form.edit_opportunity_item');
    theEditForm.action += ("?"+asset+"&removed");

    // Find the input holding the ID of the asset to remove
    var inputBox = theEditForm.querySelector('input.string.optional[value="'+asset+'"]');

    var commonAncestor = inputBox.closest('div.fields_for');
    var targetDiv = commonAncestor.querySelector('div.row:has(i.icn-cobra-close)');

    var deleteButton = targetDiv.querySelector('i.icn-cobra-close');
    deleteButton.click();

    var updateButton = document.querySelector('input.button.btn.btn-primary[name="commit"]');
    chrome.runtime.sendMessage({messageType: "removal", removedAsset: asset});
    
    updateButton.click();
}
