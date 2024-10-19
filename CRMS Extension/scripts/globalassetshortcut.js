console.log("Global Asset Shortcut script is live");

globalAllStock = {};
globalSubdomain = "";

// Load the stock item list from local storage
chrome.storage.local.get(["allStock"]).then((result) => {
    if (result.allStock != undefined){
      const allStockString = result.allStock;
      // Parse the JSON string back into an object
      globalAllStock = JSON.parse(allStockString);
      console.log("Retrieved globalAllStock from storage:");
      console.log(globalAllStock.stock_levels);

      chrome.storage.local.get(["api-details"]).then((result) => {
        if (result["api-details"].apiSubdomain){
          globalSubdomain = result["api-details"].apiSubdomain;
        } else {
          console.log("API details have not been found.");
        }
      });

    }

});

// Get the form and the search input
const form = document.querySelector('.nav-form-search');
const searchInput = document.querySelector('#nav-global-search');

// Add event listener to the form submit event

if (form){
  form.addEventListener('submit', function(event) {
      const searchTerm = searchInput.value.trim(); // Get the search input value

      // Check if the search term matches any asset_number in globalAllStock
      const matchedItem = globalAllStock.stock_levels.find(stock => stock.asset_number === searchTerm);

      if (matchedItem && globalSubdomain != "") {
          // Prevent form submission
          event.preventDefault();
          // Redirect to desired URL
          window.location.href = `https://${globalSubdomain}.current-rms.com/stock_levels/${matchedItem.id}`;
      }
      // If no match, form will submit normally
  });
}
