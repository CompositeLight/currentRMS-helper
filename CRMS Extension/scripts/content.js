
// NOTE: This code deals with two types of messages. ToastMessages are the type that appear via websocket message to the page. This includes things like sucess messages when an item is scanned. The other type I have called toastPosts, which appear following a php page refresh. This applies to certain scenarios, like reverting the status on an item. FYI Current calls the dialog boxes in the top corner "toast messages", which is where the toast thing comes from.

console.log("CurrentRMS Helper Activated.");

assetsOnTheJob = [];
assetsGlobalScanned = [];

notesHidden = false;
preparedHidden = false;
bulkOnly = false;
subhiresHidden = false;
weightUnit = "kgs"; // default to kgs for weight unit
inspectionAlerts = "";
multiGlobal = true;
containerScan = false;
scanningContainer = "";
freeScanReset = false;
containerData = {};
containerList = [];
detailViewMode = "functions";
allProducts = {};
allStock = {};
storeLocation = "";
apiKey="";
apiSubdomain="";
lastScan="";


pageNumber = 1;
let oppData = {opportunity_items:[], meta:[]}

try {
  // Scrape the store name:
  storeLocation = document.getElementById("storelocation").textContent.trim();
  console.log("Store location is: " + storeLocation);
}
catch(err) {
  console.log("Store location not collected.")
}

// scrape the opportunity ID from the page URL if there is one
let opportunityID = (function() {
  const currentUrl = window.location.href;
  // Use a regular expression to match the opportunity ID in the URL
  const match = currentUrl.match(/\/opportunities\/(\d+)/);
    // Check if there is a match and return the opportunity ID (group 1 in the regex)
  return match ? match[1] : null;
})();


// get the inspection alert setting from local storage
chrome.storage.local.get(["inspectionAlert"]).then((result) => {
    if (result.inspectionAlert == undefined){
      inspectionAlerts = "full";
    } else {
      inspectionAlerts = result.inspectionAlert;
    }
    console.log("Inspection alert mode: "+inspectionAlerts);
});

// get the multi global check in setting from local storage
chrome.storage.local.get(["multiGlobal"]).then((result) => {
    if (result.inspectionAlert == undefined){
      multiGlobal = true;
    } else {
      multiGlobal = result.inspectionAlert;
    }
    console.log("Global check-in overide: "+multiGlobal);
});


// Load the all products list from local storage
chrome.storage.local.get(["allProducts"]).then((result) => {
    if (result.allProducts == undefined){
      // If the variable is empty, it might not have been got yet (first use)
      chrome.storage.local.get(["api-details"]).then((result) => {
        if (result["api-details"].apiKey && result["api-details"].apiSubdomain){
          console.log("Products list was not found. Requesting refresh.");
          makeToast("toast-info", "Products list was not found. Requesting refresh.", 5);
          chrome.runtime.sendMessage("refreshProducts");
        } else {
          console.log("API details have not found.");
          makeToast("toast-info", "API details have not found.", 5);
        }
      });
    } else {
      const allProductsString = result.allProducts;
      // Parse the JSON string back into an object
      allProducts = JSON.parse(allProductsString);
      console.log("Retrieved allProducts from storage.");
      //console.log(allProducts.products);
    }
    //console.log("Global check-in overide: "+multiGlobal);
});

// Load the stock item list from local storage
chrome.storage.local.get(["allStock"]).then((result) => {
    if (result.allStock == undefined){
      // If the variable is empty, it might not have been got yet (first use)
      console.log("Stock list was not found. Requesting refresh.");
      chrome.runtime.sendMessage("refreshProducts");
    } else {
      const allStockString = result.allStock;
      // Parse the JSON string back into an object
      allStock = JSON.parse(allStockString);
      console.log("Retrieved allStock from storage:");
      //console.log(allStock.stock_levels);
      chrome.storage.local.get(["api-details"]).then((result) => {
          if (result["api-details"].apiKey && result["api-details"].apiSubdomain){
            apiKey = result["api-details"].apiKey;
            apiSubdomain = result["api-details"].apiSubdomain;
          } else {
            console.log("API details have not found.");
            makeToast("toast-info", "API details have not found.", 5);
          }
      });
      addDetails();

    }
});








// Function to add inspector details and item descriptions to the Details page
async function addDetails() {
  if (detailView){
    await recallApiDetails();
    pageNumber = 1;
    var result = await opportunityApiCall(opportunityID);
    while (oppData.meta.row_count > 0){
      pageNumber ++;
      var result = await opportunityApiCall(opportunityID);
    }

    // Find all elements with class "optional-01 asset asset-column"
    var assetColumns = document.querySelectorAll('td.optional-01.asset.asset-column');

    var notedOppAssetIds = [];
    var thisDescription = "";

    // Loop through each element to find the one with the matching asset number
    for (var i = 0; i < assetColumns.length; i++) {
      var parentRow = assetColumns[i].closest('tr');
      var oppItemId = parentRow.getAttribute("data-oi-id");
      var parentTableBody = assetColumns[i].closest('tbody');
      var nameElement = parentRow.querySelector('.essential.asset.dd-name');
      var prodName = nameElement.innerText;
        if (!assetColumns[i].innerHTML.includes("Sub-Rent Booking") && !assetColumns[i].innerHTML.includes("Non-Stock Booking")){

          if (prodName.startsWith("Collapse")) {
            // Remove the prefix and return the rest of the string
            prodName = prodName.slice("Collapse\n".length);
          } else if (prodName.startsWith("Expand")) {
            // Remove the prefix and return the rest of the string
            prodName = prodName.slice("Expand\n".length);
          }
          const newSpan = document.createElement('span');
          newSpan.className = 'product-tip';
          newSpan.innerHTML = '&#128270; &nbsp;';
          const newSpanId = 'product-tip-'+i;
          newSpan.id = newSpanId;
          var nameDiv = nameElement.querySelector('div:last-child');
          nameDiv.appendChild(newSpan);

          (function (theId, name){
            // Attach the event listener to the element
            document.getElementById(theId).addEventListener('click', function() {
                openProductImageModal(name);
            });
          })(newSpanId, prodName);

        } // end of if not sub rent or non stock

      thisDescription = "";

      for (let i = 0; i < oppData.opportunity_items.length; i++) { // iterate through the oppData to see if there's a description
        if (oppData.opportunity_items[i].id == oppItemId && oppData.opportunity_items[i].description) {
        thisDescription = oppData.opportunity_items[i].description;
        }
      }


      if (thisDescription && !notedOppAssetIds.includes(oppItemId)){
        notedOppAssetIds.push(oppItemId);
        // add item description/note section
        const numberOfPadElemenets = parentRow.getElementsByClassName("essential padding-column");

        // Count the number of matching elements
        const padCount = numberOfPadElemenets.length;

        const newNoteRow = document.createElement('tr');
        newNoteRow.className = 'item-description-row';
        const padCell = "<td class='essential padding-column'></td>"
        const padCells = padCell.repeat(1+padCount);
        newNoteRow.innerHTML = padCells+"<td class='item-description-cell' colspan='1'>"+thisDescription+"</td>";
        parentTableBody.appendChild(newNoteRow);
      }
    }

    // now add group item descriptions
    var groupRows = document.querySelectorAll('tr.item-group');


    // Loop through each element to find the one with the matching asset number
    for (var i = 0; i < groupRows.length; i++) {
      var groupListContainer = groupRows[i].closest('li');
      var oppItemId = groupListContainer.getAttribute("data-group-id");

      thisDescription = "";

      for (let n = 0; n < oppData.opportunity_items.length; n++) {
        if (oppData.opportunity_items[n].id == oppItemId && oppData.opportunity_items[n].description) {
        thisDescription = oppData.opportunity_items[n].description;
        }
      }

      if (thisDescription && !notedOppAssetIds.includes(oppItemId)){
        notedOppAssetIds.push(oppItemId);
        // add item description/note section
        const numberOfPadElemenets = groupRows[i].getElementsByClassName("essential padding-column");

        // Count the number of matching elements
        const padCount = numberOfPadElemenets.length;

        const newNoteRow = document.createElement('tr');
        newNoteRow.className = 'item-description-row';
        const padCell = "<td class='essential padding-column'></td>"
        const padCells = padCell.repeat(1+padCount);
        newNoteRow.innerHTML = padCells+"<td class='item-description-cell' colspan='1'>"+thisDescription+"</td>";
        var parentTableBody = groupRows[i].closest('tbody');
        parentTableBody.appendChild(newNoteRow);
      }
    }



  } else if (orderView){
    console.log("add Details order view");

    var currencyPrefix = getCurrencySymbol();

    await recallApiDetails();
    pageNumber = 1;
    var result = await opportunityApiCall(opportunityID);
    while (oppData.meta.row_count > 0){
      pageNumber ++;
      var result = await opportunityApiCall(opportunityID);
    }

    for (let n = 0; n < oppData.opportunity_items.length; n++) {

      if (oppData.opportunity_items[n].opportunity_item_type_name != "Group" && !oppData.opportunity_items[n].is_in_deal) {
        var thisName = oppData.opportunity_items[n].name;
        var thisID = oppData.opportunity_items[n].id;
        var thisTotalCharge = parseFloat(oppData.opportunity_items[n].charge_excluding_tax_total);
        var thisTotalCost = 0.0;
        for (let i = 0; i < oppData.opportunity_items[n].item_assets.length; i++) {
          if (oppData.opportunity_items[n].item_assets[i].opportunity_cost){
            if (oppData.opportunity_items[n].item_assets[i].opportunity_cost.actual_cost != "0.0"){
              thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[n].item_assets[i].opportunity_cost.actual_cost);
            } else {
              thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[n].item_assets[i].opportunity_cost.provisional_cost);
            }
          }
        }

        var thisProfitLoss = (thisTotalCharge - thisTotalCost).toFixed(2);
        var thisProfitLossString = "";
        if (thisProfitLoss < 0){
          thisProfitLossString = "Loss: -"+currencyPrefix+(thisProfitLoss * -1);
        } else {
          thisProfitLossString = "Profit: "+currencyPrefix + thisProfitLoss;
        }

        var liElement = document.querySelector('li.grid-body-row[data-id="'+thisID+'"]');
        var tdElement = liElement.querySelector('td.total-column.align-right.item-total');


        var spanElement = tdElement.querySelector('span');
        var currentDataContent = "";

        if (spanElement.classList.contains("popover_help")){
          if (spanElement.hasAttribute("data-original-content")){
            currentDataContent = spanElement.getAttribute("data-original-content");
          } else {
            currentDataContent = spanElement.getAttribute("data-content");
            spanElement.setAttribute("data-original-content", currentDataContent);
          }

          var dataContentToAdd = "<br><br>Total Cost: "+currencyPrefix+thisTotalCost.toFixed(2)+"<br>"+thisProfitLossString;
          // Append a new string to the existing value
          var newContent = currentDataContent + dataContentToAdd;
          spanElement.setAttribute("data-content", newContent);

        } else {
          var oldSpan = spanElement.querySelector('span.cost-tooltiptext');
          if (oldSpan){
            oldSpan.remove();
          }
          spanElement.classList.add("popover-help-added", "cost-tooltip");
          //var newContent = "Total Cost: "+thisTotalCost.toFixed(2);
          var htmlString = '<span class="cost-tooltiptext">Total Charge: '+currencyPrefix+thisTotalCharge.toFixed(2)+'<br>Total Cost: '+currencyPrefix+thisTotalCost.toFixed(2)+'<br>'+thisProfitLossString+'</span>';
          spanElement.innerHTML += htmlString;


        }
        if (thisTotalCost > thisTotalCharge){
          spanElement.classList.add("loss-warning");
        } else {
          spanElement.classList.remove("loss-warning");
        }



      } else if (oppData.opportunity_items[n].opportunity_item_type_name = "Group" && oppData.opportunity_items[n].has_group_deal && !oppData.opportunity_items[n].is_in_deal) {
        // this means the item is a group with a group discount set
        var thisID = oppData.opportunity_items[n].id;
        var thisTotalCharge = parseFloat(oppData.opportunity_items[n].charge_excluding_tax_total);
        var thisGroupPath = oppData.opportunity_items[n].path;
        var thisTotalCost = 0.0;

        for (let g = n+1; g < (oppData.opportunity_items.length-n-1); g++) {
          if (oppData.opportunity_items[g].opportunity_item_type_name != "Group" && oppData.opportunity_items[g].path.startsWith(thisGroupPath)) {
            for (let i = 0; i < oppData.opportunity_items[g].item_assets.length; i++) {
              if (oppData.opportunity_items[g].item_assets[i].opportunity_cost){
                if (oppData.opportunity_items[g].item_assets[i].opportunity_cost.actual_cost != "0.0"){
                  thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[g].item_assets[i].opportunity_cost.actual_cost);
                } else {
                  thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[g].item_assets[i].opportunity_cost.provisional_cost);
                }
              }
            }
          }
        }

        var thisProfitLoss = (thisTotalCharge - thisTotalCost).toFixed(2);
        var thisProfitLossString = "";
        if (thisProfitLoss < 0){
          thisProfitLossString = "Loss: -"+currencyPrefix+(thisProfitLoss * -1);
        } else {
          thisProfitLossString = "Profit: "+currencyPrefix + thisProfitLoss;
        }
        var liElement = document.querySelector('li.grid-body-row[data-id="'+thisID+'"]');
        var tdElement = liElement.querySelector('td.align-right.group-deal.group-total.total-column');
        var spanElement = tdElement.querySelector('span');

        var oldSpan = spanElement.querySelector('span.cost-tooltiptext');
        if (oldSpan){
          oldSpan.remove();
        }
        spanElement.classList.add("cost-tooltip");
        //var newContent = "Total Cost: "+thisTotalCost.toFixed(2);
        var htmlString = '<span class="cost-tooltiptext">Total Charge: '+currencyPrefix+thisTotalCharge.toFixed(2)+'<br>Total Cost: '+currencyPrefix+thisTotalCost.toFixed(2)+'<br>'+thisProfitLossString+'</span>';
        spanElement.innerHTML += htmlString;



      if (thisTotalCost > thisTotalCharge){
        spanElement.classList.add("loss-warning");
      } else {
        spanElement.classList.remove("loss-warning");
      }


      }// end of if a group with deal set
    }

    // Sort out listing charged days for serviced items
    var daysHeader = document.querySelector('td.days-column.align-right');
    if (daysHeader){
      console.log("Chargable days yes");
      var typeColumnSpans = document.querySelectorAll('td.type-column');

      for (let i = 0; i < (typeColumnSpans.length); i++) {
        if (typeColumnSpans[i].innerText.includes("Service")){


          var parentLi = typeColumnSpans[i].closest('li');
          //var thisItemId = parentLi.getAttribute('data-id');
          var daysTd = parentLi.querySelector('td.days-column.align-right');

          var popOverSpan = parentLi.querySelector('span.popover_help');
          var popOverContent = popOverSpan.getAttribute('data-content');
          console.log(popOverContent);
          if (popOverContent.startsWith("Days") || popOverContent.startsWith("Hours") || popOverContent.startsWith("Miles") || popOverContent.startsWith("Kilometres")) {
            var timeSuffix = "";
            if (popOverContent.startsWith("Hours")){
              var timeSuffix = "H";
              daysTd.classList.add("makeItalic");
            } else if (popOverContent.startsWith("Miles")){
              var timeSuffix = "Mi";
              daysTd.classList.add("makeItalic");
            } else if (popOverContent.startsWith("Kilometres")){
              var timeSuffix = "km";
              daysTd.classList.add("makeItalic");
            } else {
              daysTd.classList.remove("makeItalic");
            }
            // Find the position of the first "<br>"
            var brPosition = popOverContent.indexOf("<br>");
            // Check if "<br>" is found
            if (brPosition !== -1) {
              // Extract the portion of the string before the first "<br>"
              popOverContent = popOverContent.substring(0, brPosition);
              var wordsArray = popOverContent.split(/\s+/);
              var popOverContent = wordsArray[wordsArray.length - 1];
              console.log(popOverContent);

              daysTd.innerHTML = popOverContent+timeSuffix;
            }
          }

        }
      }




    }





  }



}

function makeCostPopup(contentString) {
  console.log(contentString);
  //<div class=“popover fade left in”>
	//<div class=“arrow”></div>
	//<h3 class=“popover-title>Charge detail</h3>
	//<div class = “popover-content”><h5>Weekly Rate</h5>Weeks : £1.50 x 1<br><br>Rental charge amount: £3.00<br>Surcharge amount: £0.00<br><br>Total Cost: 1.50</div>
//</div>
}











// API Call for addDetails
function opportunityApiCall(opp){
  return new Promise(function (resolve, reject) {

    //const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'/opportunity_items?page='+pageNumber+'&q[description_present]=1&per_page=100';
    const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'/opportunity_items?page='+pageNumber+'&per_page=100';
    // Options for the fetch request
    const fetchOptions = {
      method: 'GET',
      headers: {
        'X-SUBDOMAIN': apiSubdomain,
        'X-AUTH-TOKEN': apiKey,
      },
    };
    // Make the API call
    fetch(apiUrl, fetchOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Handle the API response data here
        oppData.opportunity_items = oppData.opportunity_items.concat(data.opportunity_items); // merge new page of data into stock_levels
        oppData.meta = data.meta; // merge new page of data into meta
        resolve("ok");
      })
      .catch(error => {
        // Handle errors here
        console.error('Error making API request:', error);
      });
  console.log(oppData.opportunity_items);
  });
}


function recallApiDetails(){
  return new Promise(function (resolve, reject) {
  chrome.storage.local.get(["api-details"]).then((result) => {
    if (result["api-details"].apiKey){
      apiKey = result["api-details"].apiKey;
    } else {
      console.log("No API key saved in local storage.");
    }
    if (result["api-details"].apiSubdomain){
      apiSubdomain = result["api-details"].apiSubdomain;
    } else {
      console.log("No API Subdomain saved in local storage.");
    }
    resolve();
  });
});

}






function getProdWeight(prod){
  var itemWeight = "0";
  try {
    const prodObject = allProducts.products.find(products => products.name === prod);
    itemWeight = prodObject ? prodObject.weight : null;
  }
    catch(err) {
  }
  if (itemWeight){
    return itemWeight;
  } else {
    return "?"
  }
}

function getProdLocation(prod){
  var productLocation = "";
  try {


    const prodObject = allStock.stock_levels.filter(stock_levels => stock_levels.item_name === prod && stock_levels.store_name == storeLocation && stock_levels.location !== "");
    //console.log(prodObject)
    // Extract the "location" property from each object
    const locations = prodObject.map(obj => obj.location);

    // Create a string with locations separated by commas
    const locationsString = locations.join(', ');
    return locationsString;
  }
    catch(err) {
      console.log(err);
    return "Location error";
  }

}


function getProdImageUrl(prod){
  var urlOfIcon = "";
  try {
    const prodObject = allProducts.products.find(products => products.name === prod);
    urlOfIcon = prodObject ? prodObject.icon.url : null;
  }
    catch(err) {
  }
  if (urlOfIcon){
    return urlOfIcon
  } else {
    return "/assets/ui/product-f16087aa267a8d2b0f689433609f05faba1561eacccf4be8bf9a8052ea4a2fc2.png";
  }
}

function openProductImageModal(prodName){
  console.log(prodName);
  var theModal = document.getElementById('product-image-modal');
  var theModalImage = document.getElementById('modal-image');
  var theModalCaption = document.getElementById('product-modal-caption');
  var theModalWeightCaption = document.getElementById('product-modal-weight');
  var theModalLocationCaption = document.getElementById('product-modal-location');
  const theImageUrl = getProdImageUrl(prodName);
  const itemWeight = getProdWeight(prodName);
  const itemLocation = getProdLocation(prodName)
  theModalImage.src = theImageUrl;
  theModalCaption.innerHTML = prodName;
  theModalWeightCaption.innerHTML = itemWeight+" "+weightUnit;
  theModalLocationCaption.innerHTML = itemLocation + " (" +storeLocation+")";
  theModal.style.display = 'block';
}


// check if we're in Order or Detail View
var orderView = document.querySelectorAll('a[name="activities"][class="anchor"]');
if (orderView.length != 0){
  orderView = true;
} else {
  orderView = false;
}

// check if we're in Detail View
var detailView = document.querySelectorAll('div[class="tab-pane"][id="quick_prepare"]');
if (detailView.length != 0){
  detailView = true;
} else {
  detailView = false;
}


// check if we're in Global Check-in view
var globalCheckinView = document.querySelectorAll('div[class="col-sm-12 global_check_ins main-content"]');
if (globalCheckinView.length != 0){
  globalCheckinView = true;
} else {
  globalCheckinView = false;
}

console.log("Order view: "+orderView);
console.log("Detail view: "+detailView);
console.log("Global Check-in view: "+globalCheckinView);

// If in a detail/order/check in view create the modal ready for reference image.
if (detailView || orderView || globalCheckinView){
  // Create the modal element
  const modalElement = document.createElement('div');
  modalElement.id = 'product-image-modal';
  modalElement.className = 'product-modal';

  // Create the inner elements
  modalElement.innerHTML = `
    <img class="product-modal-content" id="modal-image" src="https://s3.amazonaws.com/current-rms/94ed60d0-735f-0138-9f28-0a907833e252/icons/98/original/xlr-cable.jpg">
    <div id="product-modal-caption" class="product-modal-caption">Main Warehouse - Bay 12 - Bin 17</div>
    <div id="product-modal-weight" class="product-modal-caption"></div>
    <div id="product-modal-location" class="product-modal-caption"></div>
  `;

  // Append the modal element to the end of the body
  document.body.appendChild(modalElement);

  // Create event listener to close the modal if clicked
  modalElement.addEventListener('click', function() {
      modalElement.style.display = "none";
  });
}



// function to get the weight units in use
function getWeightUnit() {
        var element = document.getElementById('weight_total');
        if (element){
          var innerText = element.innerText.trim();
          var words = innerText.split(' ');
          var lastWord = words[words.length - 1];
          weightUnit = lastWord;
        }
    }

// Function to find the closest <li> parent
function findClosestLi(element) {
    while (element && element.tagName !== "LI") {
        element = element.parentNode;
    }
    return element;
}

function sayWord(speakWord){
    var msg = new SpeechSynthesisUtterance();
    msg.rate = 0.8; // 0.1 to 10
    msg.text = speakWord;
    window.speechSynthesis.speak(msg);
}

// Function that takes in a string and returns the first word inside single quotes. This is to extract the asset number from a message.
function extractAsset(inputString) {
  const match = inputString.match(/'([^']+)'/);
  return match ? match[1] : null;
}

// This is a special version of extractAsset that returns the asset number, but with with spaces inbetween each character. This is so that it will be spoken like "one zero zero six" instead of "one-thousand-and-six"
function extractAssetToSay(inputString) {
  const match = inputString.match(/'([^']+)'/);
  if (match) {
    const word = match[1];
    return word.split('').join(' ');
  } else {
    return null;
  }
}


// function to find the name of an asset if it appears on the page already (ie. an item already scanned)
function findAssetName(assetToName) {
    // Find all elements with class "optional-01 asset asset-column"
    var assetColumns = document.querySelectorAll('.optional-01.asset.asset-column');

    // Loop through each element to find the one with the matching asset number
    for (var i = 0; i < assetColumns.length; i++) {
        var assetNumberElement = assetColumns[i].querySelector('a');

        // Check if the asset number matches the input
        if (assetNumberElement && assetNumberElement.innerText === assetToName) {
            // Find the parent row (tr) element
            var parentRow = assetColumns[i].closest('tr');

            // Find the preceding "essential asset dd-name" element within the same row
            var essentialAssetElement = parentRow.querySelector('.essential.asset.dd-name');

            // Check if the essentialAssetElement exists
            if (essentialAssetElement) {
                // Return the inner text of the essentialAssetElement
                const nameString = essentialAssetElement.innerText.trim();

                // Check if the inputString starts with "Collapse"
                if (nameString.startsWith("Collapse")) {
                  // Remove the prefix and return the rest of the string
                  return nameString.slice("Collapse".length);
                } else {
                  // Return the original string if it doesn't start with "Collapse"
                  return nameString;
                }
            }
        }
    }

    // Return null if the assetToName is not found
    return null;
}



// function to find the toast-message element that is the child of toast-container
function findSecondDescendant(parent, tagname)
{
   parent = document.getElementById(parent);
   var descendants = parent.getElementsByTagName(tagname);
   if ( descendants.length > 2 )
      return descendants[2];
   return null;
}

function indexOfSecondSingleQuote(inputString) {
  // Find the index of the first single quote
  const firstQuoteIndex = inputString.indexOf("'");

  // If the first quote is found, find the index of the second quote starting from the position after the first quote
  if (firstQuoteIndex !== -1) {
    const secondQuoteIndex = inputString.indexOf("'", firstQuoteIndex + 1);

    // If the second quote is found, return its index; otherwise, return -1
    if (secondQuoteIndex !== -1) {
      return secondQuoteIndex;
    }
  }
  // If no second quote is found, return -1
  return -1;
}



// Function that scrapes the page for every asset listed and add it to a global array. This is to be able to check if an item is already allocated, etc
function listAssets() {
    // Select all table cells with the specified class
  const cells = document.querySelectorAll('.optional-01.asset.asset-column');

  // Create an array to store the cell values
  assetsOnTheJob = [];
  // Loop through each cell
  cells.forEach((cell) => {
    // Get the trimmed text content of the cell
    const cellValue = cell.textContent.trim();

    // Exclude values that are "Group Booking" or "Bulk Stock"
    if (cellValue !== "Group Booking" && cellValue !== "Bulk Stock") {
      assetsOnTheJob.push(cellValue); // Add the cell value to the array
    }
  });
}

// function that scrapes the global check-in page for items listed as being already scanned.
function listGlobalCheckedItems() {
  const cells = document.querySelectorAll('.optional-01');
  // Create an array to store the cell values
  assetsGlobalScanned = [];
  cells.forEach((cell) => {
    // Get the trimmed text content of the cell
    const cellValue = cell.textContent.trim();
    assetsGlobalScanned.push(cellValue); // Add the cell value to the array
  });
}





// This function helps to reformat crazy long lists that sometimes occur.
function processHtmlToList(html) {
  // Create a temporary element to hold the HTML
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;

  // Remove all formatting tags and the specified phrase
  const listItems = tempElement.querySelectorAll('ul li');
  listItems.forEach((item) => {



    if (item.innerHTML.includes("Inspect Now")){

      var inspectionLink = extractHref(item.innerHTML)
      // Remove formatting tags
      item.innerHTML = item.innerHTML.replace(/<[^>]*>/g, '');

      // Remove the specified phrase
      item.innerHTML = item.innerHTML.replace(/Inspect Now/g, '');

      // Add a test link to the end
      item.innerHTML = item.innerHTML.concat(" " + "<span class='inspect-link'><a href='"+inspectionLink+"'> Inspect Now </a></span>");

    } else {
      // Remove formatting tags
      item.innerHTML = item.innerHTML.replace(/<[^>]*>/g, '');
    }


  });

  // Convert the list items to an array of strings
  //const resultList = Array.from(listItems, (item) => item.textContent.trim());
  const resultList = Array.from(listItems, (item) => item.innerHTML.trim());

  // Clean up the temporary element
  tempElement.remove();
  //console.log(resultList);
  return resultList;
}


function extractHref(htmlString) {
    // Create a temporary element to parse the HTML string
    var tempElement = document.createElement('div');
    tempElement.innerHTML = htmlString;

    // Find the first <a> tag inside the temporary element
    var anchorElement = tempElement.querySelector('a');

    // Check if the <a> tag is found and return its href attribute
    if (anchorElement) {
        return anchorElement.getAttribute('href');
    } else {
        return null; // Return null if no <a> tag is found
    }
}

function extractButton(htmlString) {
    // Create a temporary element to parse the HTML string
    var tempElement = document.createElement('div');
    tempElement.innerHTML = htmlString;

    // Find the first button inside the temporary element
    var buttonElement = document.querySelector('.btn.btn-success');

    // Check if the button is found and return its href attribute
    if (buttonElement) {

        return buttonElement.outerHTML;
    } else {
        return null; // Return null if no button is found
    }
}






// Notes button pressed
function notesButton(){
  var element = document.getElementById("notes-button");
  if (notesHidden){
    notesHidden = false;
    unhideItemDescriptions();
    element.classList.remove("turned-on");
    element.innerHTML = "Hide Notes";
  } else {
    notesHidden = true;
    hideItemDescriptions();
    element.classList.add("turned-on");
    element.innerHTML = "Notes Hidden";
  }
  focusInput();
}

// hide item description rows
function hideItemDescriptions() {
  // Get all elements with the class "item-description-cell"
  const elements = document.getElementsByClassName("item-description-row");

  // Iterate through the elements and add the class "hide-description"
  for (let i = 0; i < elements.length; i++) {
    elements[i].classList.add("hide-description");
  }
}

// unhide item description rows
function unhideItemDescriptions() {
  // Get all elements with the class "item-description-cell"
  const elements = document.getElementsByClassName("item-description-row");

  // Iterate through the elements and add the class "hide-description"
  for (let i = 0; i < elements.length; i++) {
    elements[i].classList.remove("hide-description");
  }
}









// Prepared button pressed
function preparedButton(){
  var element = document.getElementById("prepared-button");
  if (preparedHidden){
    preparedHidden = false;
    unhidePrepared();
    element.classList.remove("turned-on");
    element.innerHTML = "Hide Prepared";
  } else {
    preparedHidden = true;
    hidePrepared();
    element.classList.add("turned-on");
    element.innerHTML = "Prepared Hidden";
  }
  focusInput();
}



function hidePrepared() {
    // Find the <ol> with id "opportunity_item_assets_body"
    var opportunityList = document.getElementById("opportunity_item_assets_body");

    // Check if the list exists
    if (opportunityList) {
        // Get all <li> elements within the <ol>
        var listItems = opportunityList.getElementsByTagName("li");

        // Iterate through each <li> element
        for (var i = 0; i < listItems.length; i++) {
            // Get all <tr> elements with class "status-column" within the current <li>
            var statusRows = listItems[i].getElementsByClassName("status-column");
            // Assume the default background color is yellow
            var hideThis = true;

            // Check if any <tr> has inner text not including "Prepared"
            for (var j = 0; j < statusRows.length; j++) {
                if (statusRows[j].innerText.indexOf("Prepared") === -1) {
                    // If found, set the background color to red
                    hideThis = false;
                    break; // No need to check further
                }
            }
            // Set the background color of the current <li> element
            if (hideThis){
            listItems[i].classList.add("hide-prepared");
            }
        }
    }
}

function unhidePrepared() {
    // Find the <ol> with id "opportunity_item_assets_body"
    var opportunityList = document.getElementById("opportunity_item_assets_body");

    // Check if the list exists
    if (opportunityList) {
        // Get all <li> elements within the <ol>
        var listItems = opportunityList.getElementsByTagName("li");
        // Iterate through each <li> element
        for (var i = 0; i < listItems.length; i++) {
            // Set the background color of the current <li> element
            listItems[i].classList.remove("hide-prepared");
        }
    }
}


// Bulk Only button pressed
function bulkButton(){
  var element = document.getElementById("bulk-button");
  if (bulkOnly){
    bulkOnly = false;
    unHideNonBulkRows();
    element.classList.remove("turned-on");
    element.innerHTML = "Bulk Only";
  } else {
    bulkOnly = true;
    hideNonBulkRows();
    element.classList.add("turned-on");
    element.innerHTML = "Bulk Only";
  }
  focusInput();
}




// Hide non bulk item bookings
function hideNonBulkRows() {

  // Find the <ol> with id "opportunity_item_assets_body"
  var opportunityList = document.getElementById("opportunity_item_assets_body");
  // Check if the list exists
  if (opportunityList) {
    // Get all table rows in the document
    var rows = opportunityList.querySelectorAll('tr');

    // Iterate through each row
    for (var i = 0; i < rows.length; i++) {
      // Get the status cell in the current row
      try {
        var statusCell = rows[i].querySelector('.asset-column');
        // Check if the status cell contains the specified content
        if (statusCell.innerText.includes('Bulk Stock') || statusCell.innerText.includes('Non-Stock Booking') || statusCell.innerText.includes('Asset Number')) {
          // Skip this row
        } else {
          // Hide the entire row
          //rows[i].style.display = 'none';
          var thisItem = statusCell.closest("table");
          thisItem.classList.add('hide-nonbulk');
        }
      } catch(err) {
        //console.log(err);
      }
    }
  }
}


// Unhide subrent bookings
function unHideNonBulkRows() {

  // Find the <ol> with id "opportunity_item_assets_body"
  var opportunityList = document.getElementById("opportunity_item_assets_body");
  // Check if the list exists
  if (opportunityList) {
    // Get all table rows in the document
    var lists = opportunityList.querySelectorAll('table.hide-nonbulk');

    // Iterate through each row
    for (var i = 0; i < lists.length; i++) {
      // Get the status cell in the current row
      try {
        lists[i].classList.remove('hide-nonbulk');
      } catch(err) {
        console.log(err);
      }
    }
  }
}




// Subhires button pressed
function subhiresButton(){
  var element = document.getElementById("subhires-button");
  if (subhiresHidden){
    subhiresHidden = false;
    unHideSubHires();
    element.classList.remove("turned-on");
    element.innerHTML = "Hide Sub-Rentals";
  } else {
    subhiresHidden = true;
    hideSubHires();
    element.classList.add("turned-on");
    element.innerHTML = "Sub-Rentals Hidden";
  }
  focusInput();
}





// Hide subrent bookings
function hideSubHires() {

  // Find the <ol> with id "opportunity_item_assets_body"
  var opportunityList = document.getElementById("opportunity_item_assets_body");
  // Check if the list exists
  if (opportunityList) {
    // Get all table rows in the document
    var rows = opportunityList.querySelectorAll('tr');

    // Iterate through each row
    for (var i = 0; i < rows.length; i++) {
      // Get the status cell in the current row
      try {

        var statusCell = rows[i].querySelector('.asset-column');

        // Check if the status cell contains the specified content
        if (statusCell.innerText.includes('Sub-Rent Booking')) {
          var thisItem = statusCell.closest("li");
          thisItem.classList.add('hide-subhire');
        }
      } catch(err) {
        //console.log(err);
      }
    }
  }
}


// Unhide subrent bookings
function unHideSubHires() {

  // Find the <ol> with id "opportunity_item_assets_body"
  var opportunityList = document.getElementById("opportunity_item_assets_body");
  // Check if the list exists
  if (opportunityList) {
    // Get all table rows in the document
    var lists = opportunityList.querySelectorAll('li.hide-subhire');

    // Iterate through each row
    for (var i = 0; i < lists.length; i++) {
      // Get the status cell in the current row
      try {
        lists[i].classList.remove('hide-subhire');
      } catch(err) {
        console.log(err);
      }
    }
  }
}



function updateHidings(){
  if (preparedHidden){
    hidePrepared();
  }
  if (bulkOnly){
    hideNonBulkRows();
  }
  if (subhiresHidden){
    hideSubhires();
  }
}



// This function gets run whenever the page reloads, to catch messages that only appear on reload and so don't get caught by the normal toastMessage script.
// This includes actions like reverting the status of an item.
function listToastPosts() {
  // Select all elements with the toast message type classes
  const cells = document.querySelectorAll('.toast.toast-error, .toast.toast-success, .toast.toast-warning');
  // Create an array to store the cell values
  toastPosts = []; // for storing text content
  toastPostsHtml = []; // for storing innerHTML

  // Loop through each cell and add contents to the arrays
  cells.forEach((cell) => {
    // Get the trimmed text content of the cell
    const cellValue = cell.textContent.trim();
    const cellHtml = cell.innerHTML;
    toastPosts.push(cellValue); // Add the cell value to the array
    toastPostsHtml.push(cellHtml);
    //console.log("This ToastPost:");
    //console.log(cell.innerHTML);

  });
  if (toastPosts.length > 0) {

    // Overide the css display properties of the toast container so that it is readable if it overflows the height of the window.
    document.getElementById("toast-container").style.overflowY = "scroll";
    document.getElementById("toast-container").style.maxHeight = "95vh";


    // Log the messages that have been generated
    console.log("toastPosts messages found:");
    console.log(toastPosts);

    listOfIssueItems = processHtmlToList(toastPostsHtml);
    //console.log(listOfIssueItems);

    if (toastPosts[0] == "Successfully checked shortages" || toastPosts.length > 1){ // in this scenario we're potentially expecting overdue inspection flags.

      // rebuild the list of shortages to add information

      newList = '<div class="toast-message"><ul>';
      listOfIssueItems.forEach((item) => {

        if (item.includes("before or during the opportunity.")){ // if it's an overdue inspection flag
          const badItem = extractAsset(item);
          insertIndex = 1 + indexOfSecondSingleQuote(item);

          const assetName = findAssetName(badItem);
          if (assetName == null){
            assetName = "";
          }

          newList = newList + '<li>'+item.substring(0,insertIndex+1)+assetName+item.substring(insertIndex)+'</li><hr>';
        } else {
          newList = newList + '<li>'+item+'</li><hr>';
        }
      });

      newList = newList + "</ul></div>"

      // find the existing message box that is targetted by CRMS javascript to be able to close
      const listTarget = findSecondDescendant("toast-container", "div");

      // write in the editted list
      listTarget.innerHTML = newList;


    } else if (toastPosts.includes("Failed to revert the status of the allocation(s)")){
      error_sound.play();
      setTimeout(function() {
        sayWord("Failed to revert.");
      }, 900);
    } else if (toastPosts.includes("The status of the allocation(s) was successfully reverted")){
      scanSound();
    } else if (toastPosts.includes("Asset(s) successfully reset")){
      scanSound();
    } else if (toastPosts.includes("Stock Level was successfully created.")){
      scanSound();
    } else if (toastPosts.includes("Allocation successful")){
      scanSound();
    } else if (toastPosts.includes("Please correct the following errors and try again:-Asset Number has already been taken")){
      error_sound.play();
      setTimeout(function() {
        sayWord("Asset number already taken.");
      }, 900);
    } else if (toastPosts.includes("Please correct the following errors and try again:-The number of allocations must match the item quantity.")){
      error_sound.play();
      setTimeout(function() {
        sayWord("Allocations must add up to the total quantity.");
      }, 900);
    }
  };
}



// function that looks for any changes to the webpage once it has loaded, and triggers responses if these are relevant.
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    //console.log(mutation.addedNodes);
    const addedNodes = Array.from(mutation.addedNodes);
    //console.log(addedNodes);
    const toastMessages = addedNodes.filter((node) => node.classList?.contains("toast")); // filters the ellements that have appeared on the webpage to spot toast messages

    mutation.addedNodes.forEach((node) => {
      if (node.classList?.contains("toast")){
        // Overide the css display properties of the toast container so that it is readable if it overflows the height of the window.
        document.getElementById("toast-container").style.overflowY = "scroll";
        document.getElementById("toast-container").style.maxHeight = "95vh";

        // add the time stamp to the start of the message
        var d = new Date();
        var timeNow = d.toLocaleTimeString();


        node.querySelectorAll('ul').forEach(function (element) {
          element.outerHTML = element.innerHTML;
        });
        node.querySelectorAll('li').forEach(function (element) {
          element.outerHTML = element.innerHTML;
        });

        if (node.innerHTML.includes("freescan")){
          node.innerHTML = "("+timeNow+") Free Scan toggle only applies when using Allocate.";
          //node.classList.remove("toast-error");
          //node.classList.add("toast-info");
        } else {
          node.innerHTML = "("+timeNow+") " + node.innerHTML;
        }
      }
    });

    // Respond to each new "toast-message" element
    var detailsRefreshed = false;
    toastMessages.forEach((toastMessage) => {

      if (orderView && !detailsRefreshed){
        detailsRefreshed = true;
        addDetails();
      }


      const messageText = toastMessage.textContent;

      // log the message
      console.log("Toast message: " + messageText);

      // Now respond to  toastMessages depending on their contents

      //ignore these as they're messages created by the CRMS Helper makeToast function
      if (messageText.includes('Free Scan') || messageText.includes('Container cleared.') || messageText.includes('Container set to') || messageText.includes('Now scan the container.') || messageText.includes('Container was not set.')){

      // play an error sound if we failed to allocate / prepare and we were trying to create a container
      } else if (scanningContainer && (messageText.includes('Failed to allocate asset(s)') || messageText.includes('Failed to mark item(s) as prepared') || messageText.slice(-74) == 'as it does not have an active stock allocation with a sufficient quantity.')){
        error_sound.play();
        scanningContainer = "";
        // clear the current value of container
        containerBox = document.querySelector('input[type="text"][name="container"]');
        containerBox.value = "";
        // restore freeScan to where it was.
        setFreeScan(freeScanReset);
        setTimeout(function(){
          makeToast("toast-info", "Container was not set.", 5);
          alert_sound.play();
        }, 500);


      // Handle a successful allocation of an item being set as the container
      } else if (scanningContainer && (messageText.slice(11) == 'Allocation successful' || messageText.slice(11) == 'Items successfully marked as prepared')){
        scanSound();
        smartScanSetup(lastScan);
        // set the container field to the new asset
        containerBox = document.querySelector('input[type="text"][name="container"]');
        containerBox.value = scanningContainer;

        // restore freeScan to where it was.
        setFreeScan(freeScanReset);

        // make a toast message to tell the user what happened.
        makeToast("toast-info", "Container was set to " + scanningContainer, 5);

        // clear this value ready for the next scan
        scanningContainer = "";

        // Report to the user
        setTimeout(function() {
          sayWord("Container added and set.");
          console.log(messageText);
        }, 900);

      // play an error sound for basic fail messages
    } else if (messageText.includes('Failed to allocate asset(s)') || messageText.slice(11) == 'Failed to mark item(s) as prepared' || messageText.slice(11) == 'Failed to check in item(s)' || messageText.slice(-74) == 'as it does not have an active stock allocation with a sufficient quantity.' || messageText.slice(11) == 'Failed to add container component' || messageText.includes('Failed to stock check item')){
        //error_sound.play();
        errorSound();

      // Handle errors related to items being already scanned, or just not on the job at all
      } else if (messageText.includes('No available asset could be found using') || messageText.slice(11, 74) == "No allocated or reserved stock allocations could be found using" || messageText.slice(-46) == "has already been selected on this opportunity.") {

          // check if it's already on the job.
          theAsset = extractAsset(messageText);
          listAssets();
          if (assetsOnTheJob.includes(theAsset)){
            // Means it's already allocated / scanned
            theAsset = extractAssetToSay(messageText);
            setTimeout(function() {
              sayWord("Already scanned "+theAsset);
              console.log(messageText);
            }, 900);
          } else {
            // asset isn't on the job at all.
            theAsset = extractAssetToSay(messageText);
            setTimeout(function() {
              sayWord(theAsset +" is not on the job.");
              console.log(messageText);
            }, 900);
          }

      // Handle messages related to at item being overdue an inspection
    }else if (messageText.includes('Inspect Now')){

      switch(inspectionAlerts) {
        case "full":
          theAsset = extractAssetToSay(messageText);
          setTimeout(function() {
            sayWord("Inspection overdue for asset " + theAsset);
            console.log(messageText);
          }, 900);
        break;
        case "short":
          setTimeout(function() {
            short_alert_sound.play();
            console.log(messageText);
          }, 400);
        break;
        case "off":
        break;
        default:
        // code block
      }

      // Handle an error where an item cannot be added because it's a container that's already allocated
      }else if (messageText.slice(11) == 'A temporary container cannot be allocated while it has a live allocation on an opportunity'){
            setTimeout(function() {
              sayWord("Container already allocated");
              console.log(messageText);
      }, 900);

      // Handle an error where an item cannot be added because it's a container that's already allocated
    }else if (messageText.includes("Quantity is invalid")){
            setTimeout(function() {
              sayWord("Quantity invalid.");
              console.log(messageText);
      }, 900);

    }else if (messageText.slice(11) == 'None of the selected stock allocations are allocated or reserved.'){
          setTimeout(function() {
            sayWord("Cannot prepare item.");
            console.log(messageText);
    }, 900);


      // Handle an error during global check-in that is caused by a failed scan
      }else if (messageText.includes("at your active store using the filter options from the settings screen (accessed using the wrench button).")){

          console.log(messageText);

          // check if it's already on the job.
          theAsset = extractAsset(messageText);
          listGlobalCheckedItems();
          if (assetsGlobalScanned.includes(theAsset)){
            // Means it's already allocated / scanned
            error_sound.play();
            setTimeout(function() {
              //theAsset = extractAssetToSay(messageText);
              //sayWord("Already scanned "+theAsset);
              sayWord("Already scanned");
              console.log(messageText);
            }, 700);
          } else {
            // asset isn't booked out anywhere.
            error_sound.play();
          }


      // Handle an error during check-in that is caused by an item already being checked in
      }else if (messageText.slice(11,82) == 'No booked out or part checked in stock allocations could be found using'){
            // setTimeout(function() {
            //  sayWord("Already scanned in?");
              console.log(messageText);
            //}, 1000);

      // Handle niche error where an item is not available because it's listed in quarantine
      }else if (messageText.slice(11,52) == 'A shortage exists for the Rental of Asset'){
        theAsset = extractAssetToSay(messageText);
        setTimeout(function() {
          sayWord("A shortage exists for asset " + theAsset + ". It may be in quarantine.");
          console.log(messageText);
        }, 900);

      // Handle an error when trying to add an item to a container which is already in a container, or is itself a container
      }else if (messageText.slice(11, 96) == 'No active rental stock level that is not already a container component could be found'){
        theAsset = extractAssetToSay(messageText);
        setTimeout(function() {
          sayWord("Asset already containerized.");
          console.log(messageText);
        }, 900);

      // handle the user hitting enter on an empty input box
      } else if (messageText.includes("You must select an asset.")) {
        // Normally redundant except global check in doesn't do error boxes.
        if (globalCheckinView){
          error_sound.play();
        }

        // handle the user hitting enter on an empty input box
      } else if (messageText.includes("The stock level's product does not match the stock check product.")) {
        // Normally redundant except global check in doesn't do error boxes.
        setTimeout(function() {
          sayWord("Out of scope.");
          console.log(messageText);
        }, 700);

      } else if (messageText.includes('Stock check item successful')) {
        // Normally redundant except global check in doesn't do error boxes.
        scanSound();

      // Handle myriad messages that are good, and just need a confirmatory "ding"
      } else if (messageText.slice(11) == 'Allocation successful' || messageText.slice(11) == 'Items successfully marked as prepared' || messageText.slice(11) == 'Items successfully checked in' || messageText.slice(11) == 'Container Component was successfully destroyed. ' || messageText.slice(11) == 'Opportunity Item was successfully destroyed.' || messageText.slice(11) == 'Container component was successfully added' || messageText.slice(11) == 'Opportunity Item was successfully updated.'  || messageText.slice(11) == 'Items successfully booked out.' || messageText.slice(11) == 'Container component was successfully removed'  || messageText.slice(11) == 'Check-in details updated successfully' || messageText.slice(11) == 'Opportunity Item was updated.' || messageText.slice(11) == 'Set container successfully' || messageText.includes('Asset(s) successfully checked in')){

        if (detailView && (document.querySelector('input[type="text"][name="container"]').value)){
          containerScanSound();
        } else if (!orderView){
          scanSound();
        }
        if (detailViewMode == "allocate" || detailViewMode == "prepare"){
          smartScanSetup(lastScan);
        }


      // If any other alert appears, log it so that I can spot it and add it to this code
      } else {
        if (detailView){
          // play an alert sound if scanning in detail view, just incase it's something important...
          alert_sound.play();
        }
        // alert(`Unhandled Alert Message:\n\n${messageText}`);
        console.log("The following message was not handled by CurrentRMS Helper");
        console.log("Sliced 11 messageText:" + messageText.slice(11)); // The bit I'd use to add a handler.
      }
      calculateContainerWeights(); // update container weight values in the side bar
      updateHidings(); // Update changed items that might need to be hidden
    });


  //////// END OF TOAST SECTION /////////



  ///// START OF GLOBAL CHECK IN SECTION /////

  if (globalCheckinView && multiGlobal) { // if we're in global check in and the overide is on
    const globalCheckModal = addedNodes.filter((node) => {
        // Check if node is an HTMLElement and has a querySelector method
        if (node instanceof HTMLElement && node.querySelector) {
            // Use querySelector to find the child element with the specified class
            const childElement = node.querySelector('.btn.btn-primary.pull-right');

            // Check if the child element with the specified class exists
            return childElement !== null;
        }

        // Return false if node is not an HTMLElement or lacks querySelector method
        return false;
    });

    if (globalCheckModal.length > 0) {

        var selectAllBox = document.querySelectorAll('input[name="asset_select_all"]');
        selectAllBox[0].click();
        var checkInButton = document.querySelectorAll('input[name="commit"][value="check-in"]');
        checkInButton[1].click();
    }
  }



  });
});








/////////
function calculateContainerWeights() {
  // Initialize an object to store container information
  containerData = {};
  containerList = [];
  itemsInContainers = [];

  // Get all table rows in the document
  var rows = document.querySelectorAll('tr');

  // Iterate through each row to find things in containers
  for (var i = 0; i < rows.length; i++) {
    // Get the status cell in the current row
    try {

      var containerCell = rows[i].querySelector('.container-column');
      if (containerCell){
      var thisContainer = containerCell.textContent.trim();
      var assetCell = rows[i].querySelector('.asset-column');
      var thisAsset = assetCell.textContent.trim();

      // add this container to the container list array if it's not already there
      if (containerList.indexOf(thisContainer) === -1 && thisContainer != null && thisContainer.length != 0) {
        containerList.push(thisContainer);
      }


      if (thisContainer != null && thisContainer.length != 0 && thisContainer != "Container") {


        // if it's an asset, add it to the items in container list for later.
        if (!thisAsset.includes("Sub-Rent") && thisAsset != "Group Booking" && thisAsset != "Bulk Stock" && thisAsset != "Non-Stock Booking"){
        itemsInContainers.push(thisAsset);
        }

        // get the weight of the item that is in this container
        var thisItemWeight = rows[i].getAttribute('data-weight') * 1; // muliply to convert to number. note: the value given for bulk items it already multiplied by the quantity listed

        if (containerData[thisContainer]){
          // if the container already has a record, add this item to the weight total
          containerData[thisContainer] = Number((Number(containerData[thisContainer]) + thisItemWeight).toFixed(2));
        } else {
          // if no record exists yet, created one with this item as the initial weight
          containerData[thisContainer] = Number(thisItemWeight.toFixed(2));
        }
      }
      }


    } catch(err) {

      if (err.name != "TypeError"){ // ignore errors that are caused becase elements don't exist on the page
        console.log(err);
      }
    }
  }







  // now interate through the rows and spot assets that are also listed as containers
  for (var i = 0; i < rows.length; i++) {
    try {
      var assetCell = rows[i].querySelector('.asset-column');
      var thisAsset = assetCell.textContent.trim();
      if (containerData[thisAsset]){ // the asset listed in a row is also a container listed in the containerData object
        var containerName = rows[i].querySelector('.container-column').textContent.trim();
        if (thisAsset != containerName){
        var thisItemWeight = rows[i].getAttribute('data-weight') * 1; // get the weight of the container
          containerData[thisAsset] = Number((Number(containerData[thisAsset]) + thisItemWeight).toFixed(2)); // add the container weight to the previous total
        }
        var nameCell = rows[i].querySelector('.dd-name'); // get the name
        var thisName = nameCell.textContent.trim();
        if (thisName.startsWith("CollapseExpand")) {
          var thisName = thisName.substring(15);
        }
        var newName = thisAsset + "___" + thisName;

        // create the new entry with name included
        containerData[newName] = containerData[thisAsset];

        // Delete the old entry
        delete containerData[thisAsset];
      };

    } catch(err) {
      if (err.name != "TypeError"){ // ignore errors that are caused becase elements don't exist on the page
        console.log(err);
      }
    }
  }


  // Output the result into the sidebar if it exists
  if (document.getElementById("containerlist")) {
    var ul = document.getElementById("containerlist");
    ul.innerHTML = "";
    for (var prop in containerData) {
      if (containerData.hasOwnProperty(prop)) {
        var li = document.createElement('li');
        var containerName = prop.replace(/___/g, ' / ');
        li.innerHTML =  containerName + ': ' + containerData[prop] + " " + weightUnit;
        ul.appendChild(li);
      }
    }
  }

}






// declare what the sounds are
var error_sound = new Audio(chrome.runtime.getURL("sounds/error_sound.wav"));
var scan_sound = new Audio(chrome.runtime.getURL("sounds/scan_sound.mp3"));
var alert_sound = new Audio(chrome.runtime.getURL("sounds/alert.wav"));
var short_alert_sound = new Audio(chrome.runtime.getURL("sounds/short_alert.mp3"));
var container_scan_sound = new Audio(chrome.runtime.getURL("sounds/container_scan_sound.mp3"));

function scanSound(){
  var thisSound = new Audio(chrome.runtime.getURL("sounds/scan_sound.mp3"));
  thisSound.play();
}

function errorSound(){
  var thisSound = new Audio(chrome.runtime.getURL("sounds/error_sound.wav"));
  thisSound.play();
}

function containerScanSound(){
  var thisSound = new Audio(chrome.runtime.getURL("sounds/container_scan_sound.mp3"));
  thisSound.play();
}





// this will run whenever the page reloads, in order to catch "toastPost" messages
listToastPosts();


// add a section to the sidebar if it exists
try {
  var containerWeightsSection = document.getElementById("sidebar_content");
 
  if (containerWeightsSection) {
    var htmlContent = `<div class='group-side-content' id='containerWeightsSection'><h3>Container Weights<a class='toggle-button expand-arrow icn-cobra-contract' href='#'></a></h3><div><ul id='containerlist' style='display: block;'></ul></div></div>`;
 
    containerWeightsSection.insertAdjacentHTML("afterend", htmlContent);
 
    var containerWeightsSectionDiv = document.getElementById('containerWeightsSection');
    var toggleButton = containerWeightsSectionDiv.querySelector('.toggle-button');
 
    // Adjust the display property for the initial state
    var containerListElement = document.getElementById('containerlist');
    containerListElement.style.display = 'block';
 
    toggleButton.onclick = function (event) {
      event.preventDefault();
      if (containerListElement.style.display === 'none' || containerListElement.style.display === '') {
        containerListElement.style.display = 'block';
        toggleButton.classList.remove('icn-cobra-expand');
        toggleButton.classList.add('icn-cobra-contract');
      } else {
        containerListElement.style.display = 'none';
        toggleButton.classList.remove('icn-cobra-contract');
        toggleButton.classList.add('icn-cobra-expand');
      }
    };
 
    getWeightUnit(); // check to see what weight unit the user has set by looking at the total weight field
    calculateContainerWeights(); // set initial container weigh values in the side bar
 
    // Add inline style for the toggle-button size
    toggleButton.style.fontSize = '14px'; // Adjust the size as needed
  }
} catch (err) {
  console.error(err);
}





// Create control Items
if (detailView){
  try {

    // Create a tab spacer
    var listItem = document.createElement("li");
    listItem.classList.add("helper-spacer");
    listItem.textContent = "_____";
    var listContainer = document.getElementById("od-function-tabs");
    listContainer.appendChild(listItem);

    // Create a tab button for hiding items descriptions
    var listItem = document.createElement("li");
    listItem.classList.add("helper-btn");
    listItem.textContent = "Hide Notes";
    listItem.id = "notes-button";
    var listContainer = document.getElementById("od-function-tabs");
    listContainer.appendChild(listItem);

    // Create a tab button for hiding prepared items
    var listItem = document.createElement("li");
    listItem.classList.add("helper-btn");
    listItem.textContent = "Hide Prepared";
    listItem.id = "prepared-button";
    var listContainer = document.getElementById("od-function-tabs");
    listContainer.appendChild(listItem);

    // Create a tab button for Bulk Only
    var listItem = document.createElement("li");
    listItem.classList.add("helper-btn");
    listItem.textContent = "Bulk Only";
    listItem.id = "bulk-button";
    var listContainer = document.getElementById("od-function-tabs");
    listContainer.appendChild(listItem);

    // Create a tab button for Subhires
    var listItem = document.createElement("li");
    listItem.classList.add("helper-btn");
    listItem.textContent = "Hide Sub-Rentals";
    listItem.id = "subhires-button";
    var listContainer = document.getElementById("od-function-tabs");
    listContainer.appendChild(listItem);

    document.getElementById("notes-button").addEventListener("click", notesButton);
    document.getElementById("prepared-button").addEventListener("click", preparedButton);
    document.getElementById("bulk-button").addEventListener("click", bulkButton);
    document.getElementById("subhires-button").addEventListener("click", subhiresButton);

  } catch (err){
  }
}

// Start observing the body for mutations. This looks out for changes to the webpage, so we can spot toast messages appearing.
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

// Stop observing when the extension is disabled or uninstalled
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "stopObserver") {
    observer.disconnect();
  }
});


if (detailView){
  try { // try block in case some ellements may not exist in some circumstances

    // Add an event listener to the Free Scan toggle slider, to make the asset input box focus afterwards
    var freeScanElement = document.querySelectorAll('label[for="free_scan"][class="checkbox toggle android"]');
    freeScanElement[0].addEventListener('click', function(event) {
      focusInput();
    });

    // Add an event listener to the Mark As Prepared toggle slider, to make the asset input box focus afterwards
    var freeScanElement = document.querySelectorAll('label[for="mark_as_prepared"][class="checkbox toggle android"]');
    freeScanElement[0].addEventListener('click', function(event) {
      focusInput();
    });

    // Add an event listener to all collapse and expand buttons
    var expandButtons = document.querySelectorAll('button[data-action="expand"], button[data-action="collapse"]');

    // loop through each button and add a click event listener
    expandButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        // do something when the button is clicked
        focusInput();
      });
    });

    // Add an event listener to all lock/unlock buttons
    var lockButtons = document.querySelectorAll('a[data-unlock-title="Unlock this group"]');

    // loop through each button and add a click event listener
    lockButtons.forEach(function(button) {
      button.addEventListener("click", function() {

        // do something when the button is clicked
        focusInput();

      });
    });

    // Add an event listener to Detail View mode buttons
    var detailModeButtons = document.querySelectorAll('a[class="btn"][data-toggle="tab"]');

    // loop through each button and add a click event listener
    detailModeButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        // do something when the button is clicked
        detailViewMode = button.lastChild.textContent.toLowerCase().toString().trim();;
        console.log(detailViewMode);
      });
    });






  }
  catch(err) {
    console.log(err);
  }
}





// function to put the page focus to the scanner input box
function focusInput(){
  switch (detailViewMode) {
    case "allocate":
      document.getElementById("stock_level_asset_number").focus();
      break;
    case "prepare":
      document.getElementById("p_stock_level_asset_number").focus();
      break;
    case "book out":
      document.getElementById("bo_stock_level_asset_number").focus();
      break;
    case "check-in":
      document.getElementById("ci_stock_level_asset_number").focus();
      break;
  }
}


// auto set "mark as prepared" to on depending on the user setting
chrome.storage.local.get(["setPrepared"]).then((result) => {
  if (result.setPrepared != "false" && detailView){
    var preparedButton = document.querySelectorAll('label[for="mark_as_prepared"][class="checkbox toggle android"]');
    preparedButton[0].click();
    focusInput();
  }
});


// Messages from the extension service worker to trigger changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received from service-worker.");

  if (message.inpsectionAlerts == "off"){
    inspectionAlerts = "off";
    console.log("Inspection Alerts set to OFF");
  } else if (message.inpsectionAlerts == "short"){
    inspectionAlerts = "short";
    console.log("Inspection Alerts set to SHORT");
  } else if (message.inpsectionAlerts == "full"){
    inspectionAlerts = "full";
    console.log("Inspection Alerts set to FULL");
  }

  if (message.multiGlobal == "true"){
    multiGlobal = true;
    console.log("Global check-in dialog overide set to TRUE");
  } else if (message.multiGlobal == "false"){
    multiGlobal = false;
    console.log("Global check-in dialog overide set to FALSE");
  }

  return true;
});





// Intercept scanning actions to handle special scans without submitting the form

if (detailView){
  activeIntercept();
}



function activeIntercept(){
  if (detailView){
    allocateScanBox = document.getElementById("stock_level_asset_number");
    var parentSpan = allocateScanBox.parentNode;
    var quantityBox = document.querySelector('input[type="text"][name="quantity"]');
    var containerBox = document.querySelector('input[type="text"][name="container"]');
    allocateScanBox.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {

          var myScan = allocateScanBox.value;

          // In the case that we have scanned a *freescan* barcode
          if (myScan == "freescan"){
            event.preventDefault();
            freeScanToggle();

            // block to clear the allocate box after an intercept
            allocateScanBox.value = '';
            parentSpan = allocateScanBox.parentNode;
            var htmlFudge = parentSpan.innerHTML;
            parentSpan.innerHTML = htmlFudge;
            setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
            activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work


          // In the case that we have scanned a *container* barcode
        }else if (myScan == "container"){
            if (containerScan){
              // Means the user scanned *container* twice and we want to clear the container field
              containerScan = false;
              short_alert_sound.play();
              sayWord("Container cleared.")
              containerBox.value = '';
              event.preventDefault();
              makeToast("toast-info", "Container cleared.", 5);

              // block to clear the allocate box after an intercept
              allocateScanBox.value = '';
              parentSpan = allocateScanBox.parentNode;
              var htmlFudge = parentSpan.innerHTML;
              parentSpan.innerHTML = htmlFudge;
              setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
              activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work

            } else {
              // We need to prompt the user to scan a container
              event.preventDefault();
              sayWord("Scan container");
              containerScan = true;
              makeToast("toast-info", "Now scan the container.", 5);
              // block to clear the allocate box after an intercept
              allocateScanBox.value = '';
              parentSpan = allocateScanBox.parentNode;
              var htmlFudge = parentSpan.innerHTML;
              parentSpan.innerHTML = htmlFudge;
              setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
              activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work
            }

          }else if (containerScan){
            // we are set to receive a value for the container field.
            listAssets();
            if (assetsOnTheJob.includes(allocateScanBox.value)){
              // the container is already listed on the opportunity
              event.preventDefault();
              containerScan = false;
              scanSound();
              containerBox.value = allocateScanBox.value;
              makeToast("toast-info", "Container set to "+containerBox.value, 5);
              // block to clear the allocate box after an intercept
              allocateScanBox.value = '';
              parentSpan = allocateScanBox.parentNode;
              var htmlFudge = parentSpan.innerHTML;
              parentSpan.innerHTML = htmlFudge;
              setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
              activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work

              setTimeout(sayWord("Container set."), 500);

            } else {
              // the container is not yet allocated.
              containerScan = false;
              freeScanReset = checkFreeScan();
              if (!freeScanReset){
                setFreeScan(true);
              }
              // set the scanningContainer value to this container and let it go through as a scan to be allocated (don't block default)
              scanningContainer = allocateScanBox.value;
            }

          }else if (myScan == containerBox.value && containerBox.value != "") {
            // we scanned an asset that is already set as the current container, which means "clear the container field"
            containerScan = false;
            short_alert_sound.play();
            sayWord("Container cleared.")
            containerBox.value = '';
            event.preventDefault();
            makeToast("toast-info", "Container cleared.", 5);

            // block to clear the allocate box after an intercept
            allocateScanBox.value = '';
            parentSpan = allocateScanBox.parentNode;
            var htmlFudge = parentSpan.innerHTML;
            parentSpan.innerHTML = htmlFudge;
            setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
            activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work

          } else if (containerExists(myScan)) {
            // we have scanned an asset that is already a container in this opportunity.
            event.preventDefault();
            containerScan = false;
            scanSound();
            containerBox.value = allocateScanBox.value;
            makeToast("toast-info", "Container set to "+containerBox.value, 5);
            // block to clear the allocate box after an intercept
            allocateScanBox.value = '';
            parentSpan = allocateScanBox.parentNode;
            var htmlFudge = parentSpan.innerHTML;
            parentSpan.innerHTML = htmlFudge;
            setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
            activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work

            setTimeout(sayWord("Container set."), 500);



          } else if (myScan.charAt(0) === '%'){
            // this is a special scan of a bulk barcode that includes a Quantity

            // Define a regular expression to match the pattern "%{integer}%{rest-of-the-string}"
            const regex = /^%(\d+)%(.+)$/;
            // Use the exec() method to extract matches
            const matches = regex.exec(myScan);

            if (matches) {
                // matches[1] contains the bulkQuantity, matches[2] contains the bulkAsset
                const bulkQuantity = parseInt(matches[1], 10);

                if (!isNaN(bulkQuantity)) {
                    // Check if bulkQuantity is a valid integer
                    const bulkAsset = matches[2];
                    quantityBox.value = bulkQuantity;
                    allocateScanBox.value = bulkAsset;
                    console.log("bulkQuantity:", bulkQuantity);
                    console.log("bulkAsset:", bulkAsset);
                } else {
                    console.log("Invalid bulkQuantity. It must be an integer.");
                }
            } else {
                console.log("String does not match the expected pattern.");
            }



          } else if (myScan == "test"){

          // test scan for development purposes
            event.preventDefault();
            //setFreeScan(false);
            sayWord("test");
            // Test code here.


            // block to clear the allocate box after an intercept
            allocateScanBox.value = '';
            parentSpan = allocateScanBox.parentNode;
            var htmlFudge = parentSpan.innerHTML;
            parentSpan.innerHTML = htmlFudge;
            setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
            activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work


        } // end if scan block
        // Passed all of that means this is a regular item we're scanning.

        lastScan = myScan; // log the asset ready for potential smart scan

      } // end of if enter key block

    });
  }
}



function setFreeScan(setting){ // enter true or false as required.
  var freeScanStatus = false;

  // Find the parent div with class "free-scan-input"
  var freeScanDiv = document.querySelector('.free-scan-input');
  // Check if the parent div is found
  if (freeScanDiv) {
      // Find the <a> element with class "slide-button" inside the parent div
      var slideButton = freeScanDiv.querySelector('a.slide-button');

      // Check if the <a> element is found
      if (slideButton) {
          // Get the background color of the <a> element
          var backgroundColour = window.getComputedStyle(slideButton).backgroundColor;
          // if it's red, that maens it's off
          if (backgroundColour == "rgb(204, 0, 30)"){
            freeScanStatus = false;
          } else {
            freeScanStatus = true;
          }
      } else {
          console.log('Slide button not found');
      }
  } else {
      console.log('Parent div with class "free-scan-input" not found');
  }
  if (setting != freeScanStatus){ // if the current state is not the one we want, we need to toggle it.
    var freeScanButton = document.querySelectorAll('label[for="free_scan"][class="checkbox toggle android"]');
    freeScanButton[0].click();
  }
}

function checkFreeScan(){ // enter true or false as required.
  var freeScanStatus = false;

  // Find the parent div with class "free-scan-input"
  var freeScanDiv = document.querySelector('.free-scan-input');
  // Check if the parent div is found
  if (freeScanDiv) {
      // Find the <a> element with class "slide-button" inside the parent div
      var slideButton = freeScanDiv.querySelector('a.slide-button');

      // Check if the <a> element is found
      if (slideButton) {
          // Get the background color of the <a> element
          var backgroundColour = window.getComputedStyle(slideButton).backgroundColor;
          // if it's red, that maens it's off
          if (backgroundColour == "rgb(204, 0, 30)"){
            freeScanStatus = false;
          } else {
            freeScanStatus = true;
          }
      } else {
          console.log('Slide button not found');
      }
  } else {
      console.log('Parent div with class "free-scan-input" not found');
  }
  return freeScanStatus;
}











// intercept function to respond to special scans
function freeScanToggle(){
  var freeScanActive = false;
  // Find the parent div with class "free-scan-input"
  var freeScanDiv = document.querySelector('.free-scan-input');

  // Check if the parent div is found
  if (freeScanDiv) {
      // Find the <a> element with class "slide-button" inside the parent div
      var slideButton = freeScanDiv.querySelector('a.slide-button');

      // Check if the <a> element is found
      if (slideButton) {
          // Get the background color of the <a> element
          var backgroundColour = window.getComputedStyle(slideButton).backgroundColor;
          // if it's red, that maens it's off and will now be turned on
          if (backgroundColour == "rgb(204, 0, 30)"){
            freeScanActive = true;
          }
      } else {
          console.log('Slide button not found');
      }
  } else {
      console.log('Parent div with class "free-scan-input" not found');
  }

  // find and click the freescan toggle slider
  var freeScanButton = document.querySelectorAll('label[for="free_scan"][class="checkbox toggle android"]');
  freeScanButton[0].click();
  focusInput();
  scanSound();


  if (freeScanActive) {
    makeToast("toast-info", "Free Scan turned on.", 3);
    setTimeout(function() {
      sayWord("Free skann Yes");
    }, 400);
  } else {
    setTimeout(function() {
      makeToast("toast-info", "Free Scan turned off.", 3);
      sayWord("Free skann No");
    }, 400);
  }
}

// function to create a new toast message
// example className entries are toast-success, toast-error, toast-info and toast-warning
function makeToast(className, text, autoDestroyTime) {
    // Check if the toast-container div exists
    var toastContainer = document.getElementById('toast-container');

    // If it doesn't exist, create it at the end of the body
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-top-right';
        toastContainer.style.overflowY = 'scroll';
        toastContainer.style.maxHeight = '95vh';
        document.body.appendChild(toastContainer);
    }

    // Create the new toast div
    var newToast = document.createElement('div');
    newToast.className = 'toast ' + className;
    newToast.setAttribute('aria-live', 'assertive');
    newToast.style.display = 'block';

    // Create the inner div for the toast message
    var toastMessage = document.createElement('div');
    toastMessage.className = 'toast-message';
    toastMessage.textContent = text;

    // Append the inner div to the toast div
    newToast.appendChild(toastMessage);

    // Append the toast div to the toast container
    toastContainer.insertBefore(newToast, toastContainer.firstChild);

    // Add event listener to destroy the toast on click
    newToast.addEventListener('click', function() {
        newToast.remove();
    });

    // Auto destroy the toast after the specified time if autoDestroyTime is provided and greater than 0
    if (autoDestroyTime && autoDestroyTime > 0) {
        setTimeout(function() {
            newToast.remove();
        }, autoDestroyTime * 1000);
    }
}

// Function to check whether a given container exists
function containerExists(containerName) {
  return containerList.includes(containerName);
}

// Funtion to get the currency symbol used for the rental charge total in the side bar
function getCurrencySymbol() {
  var element = document.getElementById("rental_charge_total");

  if (element) {
    // Get the innerHTML content
    var innerHTML = element.innerHTML;

    // Use a regular expression to extract the currency symbol
    var matches = innerHTML.match(/^[^\d]+/);

    // Check if a match is found
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  // Return a default value if the element is not found or no match is found
  return "";
}



//// SMART SCAN SECTION - WORK IN PROGRESS
function smartScanSetup(assetScanned){
  console.log("Asset just scanned was: " + assetScanned);
  var tdElements = document.querySelectorAll("td.optional-01.asset.asset-column");
  // Loop through the elements and find the one with the correct inner text
  var desiredTdElement = null;
  for (var i = 0; i < tdElements.length; i++) {
    console.log(tdElements[i].innerText.trim());
    if (tdElements[i].innerText.trim() == assetScanned) {
      desiredTdElement = tdElements[i];
      break; // Stop the loop once a match is found
    }
  }

  var parentRow = desiredTdElement.closest('tr');
  var oppItemId = parentRow.getAttribute("data-oi-id");
  console.log("It's opportunity item ID is: " + oppItemId);

  const foundObject = oppData.opportunity_items.find(obj => obj.id == oppItemId);
  console.log("It's path is:");
  console.log(foundObject.path);
  // NOTE: CANT RELY ON oppData because it doesn't refresh on scan....

}
