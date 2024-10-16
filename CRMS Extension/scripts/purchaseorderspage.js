console.log("CurrentRMS purchaseorderspage.js is active");
// retain text entered into the search box when changing view, group etc.

debugMode = false;
currentUrl = window.location.href;

function shouldSupplierScrape() {
    return currentUrl.endsWith("supplierscrape");
}


if (shouldSupplierScrape()){
    console.log("Supplier scrape active!");
    createBlockOutOverlay();
    var activePurchaseOrders = [];

    const table = document.querySelector("table.index-table.table-responsive");
    const sections = table.querySelectorAll("tbody");
    sections.forEach((section) => {
      var title = section.querySelector("a.title").innerText.trim();
      activePurchaseOrders.push(title);
    });
    console.log(activePurchaseOrders);
    chrome.runtime.sendMessage({messageType: "POsFound", activePurchaseOrders: activePurchaseOrders});
    if (!debugMode){
      chrome.runtime.sendMessage({ action: "closeTab" });
    }
}


function createBlockOutOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'block-out';
    var text = document.createElement('span');
    text.textContent = 'THIS DUMMY TAB IS FOR BACKGROUND SCRAPING BY CURRENT-RMS HELPER. IF YOU ARE READING THIS AN ERROR HAS OCCURED. SORRY!';
    overlay.appendChild(text);
    if (!debugMode){
      document.body.appendChild(overlay);
    }
}









let dropdownArea = document.querySelector(".inline-list");

let searchField = document.getElementById('q_subject_or_description_or_number_or_reference_or_member_name_or_tags_name_cont');

if (dropdownArea && searchField){
    // Get all <a> elements inside the div
    let anchorElements = dropdownArea.querySelectorAll('a');

    // Add event listener to each <a> element
    anchorElements.forEach(function(anchor) {
        anchor.addEventListener('click', function(event) {
            // Prevent the default action of navigating to the link
            event.preventDefault();

            // Modify the href of the link
            let modifiedUrl = this.href + '&q%5Bsubject_or_description_or_number_or_reference_or_member_name_or_tags_name_cont%5D=' + searchField.value;
            // Redirect to the modified URL
            window.location.href = modifiedUrl;
        });
    });
}
