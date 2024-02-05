console.log("CurrentRMS Helper Activated - costsview.js");

storeLocation = "";
apiKey="";
apiSubdomain="";
allProducts = {};
allStock = {};

pageNumber = 1;
let oppData = {opportunity_items:[], meta:[]}


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

  });
}

function findItemIdByOpportunityCostId(opportunityCostId) {
  // Iterate over each item in the provided data array
  for (let item of oppData.opportunity_items) {
    // Check if the item has an 'item_assets' property
    if (item.item_assets && Array.isArray(item.item_assets)) {
      // Iterate over each 'item_asset' in 'item_assets'
      for (let asset of item.item_assets) {
        // Check if the 'item_asset' has an 'opportunity_cost' object and matches the given 'opportunityCostId'
        if (asset.opportunity_cost && asset.opportunity_cost.id == opportunityCostId) {
          // If a match is found, return the top-level 'id' of the item
          return item.id;
        }
      }
    }
  }
  // If no matching 'opportunity_cost.id' is found, return null or an appropriate value indicating not found
  return null;
}

function findDaysChargedByOpportunityCostId(opportunityCostId) {
  // Iterate over each item in the provided data array
  for (let item of oppData.opportunity_items) {
    // Check if the item has an 'item_assets' property
    if (item.item_assets && Array.isArray(item.item_assets)) {
      // Iterate over each 'item_asset' in 'item_assets'
      for (let asset of item.item_assets) {
        // Check if the 'item_asset' has an 'opportunity_cost' object and matches the given 'opportunityCostId'
        if (asset.opportunity_cost && asset.opportunity_cost.id == opportunityCostId) {
          // If a match is found, return the top-level 'id' of the item
          return asset.opportunity_cost.chargeable_days;
        }
      }
    }
  }
  // If no matching 'opportunity_cost.id' is found, return null or an appropriate value indicating not found
  return null;
}


function findChargedTypeByOpportunityCostId(opportunityCostId) {
  // Iterate over each item in the provided data array
  for (let item of oppData.opportunity_items) {
    // Check if the item has an 'item_assets' property
    if (item.item_assets && Array.isArray(item.item_assets)) {
      // Iterate over each 'item_asset' in 'item_assets'
      for (let asset of item.item_assets) {
        // Check if the 'item_asset' has an 'opportunity_cost' object and matches the given 'opportunityCostId'
        if (asset.opportunity_cost && asset.opportunity_cost.id == opportunityCostId) {
          // If a match is found, return the top-level 'id' of the item
          return asset.opportunity_cost.service_rate_type_name;
        }
      }
    }
  }
  // If no matching 'opportunity_cost.id' is found, return null or an appropriate value indicating not found
  return null;
}







console.log("add Details cost view");

// get the start date and time
const thisSidebar = document.getElementById("sidebar_content");
const spans = thisSidebar.querySelectorAll('span');
// Iterate over each <span>
let startDateValue = null;
let endDateValue = null;
spans.forEach((span, index) => {
    // Check if the text content of this <span> is 'Start Date:'
    if (span.textContent.trim() === 'Start Date:') {
        // The next sibling element should be the <span> with the date
        const nextSpan = spans[index + 1];
        if (nextSpan) {
            startDateValue = nextSpan.textContent.trim();
        }
    } else if (span.textContent.trim() === 'End Date:') {
        // The next sibling element should be the <span> with the date
        const nextSpan = spans[index + 1];
        if (nextSpan) {
            endDateValue = nextSpan.textContent.trim();
        }
    }
});



// scrape the opportunity ID from the page URL if there is one
let opportunityID = (function() {
  const currentUrl = window.location.href;
  // Use a regular expression to match the opportunity ID in the URL
  const match = currentUrl.match(/\/opportunities\/(\d+)/);
    // Check if there is a match and return the opportunity ID (group 1 in the regex)
  return match ? match[1] : null;
})();




costDetails();


async function costDetails(){

  var currencyPrefix = getCurrencySymbol();

  await recallApiDetails();
  pageNumber = 1;
  var result = await opportunityApiCall(opportunityID);
  while (oppData.meta.row_count > 0){
    pageNumber ++;
    var result = await opportunityApiCall(opportunityID);
  }
  //console.log(oppData.opportunity_items);

  theList = document.getElementById("nestable-grid");
  var assetBodies = document.querySelectorAll('tbody');
  for (let n = 0; n < assetBodies.length; n++) {
    var thisProd = assetBodies[n].querySelector('tr');
    if (thisProd.id){ // the tr id contains the opporunity cost Id reference
      //console.log(thisProd.id); // ignore rows that don't have a cost reference
      var thisID = findItemIdByOpportunityCostId(thisProd.id); // find which opp item contains this cost id

        if (thisID){ // if the cost item is listed against a line in the opportunity data
        //console.log("Cost item "+thisProd.id+" relates to opportunity item: "+thisID);
        for (let item of oppData.opportunity_items) { // now use that opp item id to find the the other data
          // Check if the current item's 'id' matches the given topLevelId
          if (item.id == thisID) {
            // If a match is found, return the 'transaction_type_name' of the item
            var thisItemName = item.name;
            var thisType = item.transaction_type_name;
            var thisUnitCharge = item.unit_charge;
            var thisChargeTotal = item.charge_amount;
            var thisChargeableDays = parseFloat(item.chargeable_days);
            thisChargeableDays = parseFloat(thisChargeableDays.toFixed(1));
            var thisChargeServiceRateType = item.service_rate_type_name;
            var thisCostServiceRateType = findChargedTypeByOpportunityCostId(thisProd.id);


            break;
          }

        }

        var thisDaysCosted = findDaysChargedByOpportunityCostId(thisProd.id);
        thisDaysCosted = parseFloat(thisDaysCosted);
        thisDaysCosted = parseFloat(thisDaysCosted.toFixed(1));



        //console.log("Item "+thisID+" ("+thisItemName+") is a "+thisType+" with a unit charge of "+thisUnitCharge+" and a total charge of "+ thisChargeTotal+" based on "+ thisChargeableDays + " days. But we are charging for "+thisDaysCosted+ " days. The charge type is "+thisChargeServiceRateType+" and the cost type is "+thisCostServiceRateType);



        if (thisType == "Service"){
          var daysBox = assetBodies[n].querySelector('td.optional-04.align-right.days-column');
          var thisDays = daysBox.getAttribute("data-value");

          if (thisDaysCosted == thisChargeableDays || (thisChargeServiceRateType != thisCostServiceRateType)){


            var oldSpan = daysBox.querySelector('span.cost-popover-help-added.days-tooltip');
            if (oldSpan){
              oldSpan.remove();
            }

            const newSpan = document.createElement('span');

            newSpan.classList.add("popover-help-added", "days-tooltip");

            var htmlString = (thisChargeableDays +'<span class="days-tooltiptext">'+thisCostServiceRateType+'s Costed: '+ thisDaysCosted +'<br>'+thisChargeServiceRateType+'s Charged: '+ thisChargeableDays +'</span>');
            newSpan.innerHTML += htmlString;
            daysBox.appendChild(newSpan);
            if (thisChargeServiceRateType != thisCostServiceRateType){
              daysBox.classList.add("mismatch-warning");
            }

          } else {

            var oldSpan = daysBox.querySelector('span.popover-help-added.days-tooltip');
            if (oldSpan){
              oldSpan.remove();
            }

            const newSpan = document.createElement('span');

            newSpan.classList.add("popover-help-added", "days-tooltip");

            var htmlString = (thisDaysCosted + "/" + thisChargeableDays +'<span class="days-tooltiptext">'+thisCostServiceRateType+'s Costed: '+ thisDaysCosted +'<br>'+thisChargeServiceRateType+'s Charged: '+ thisChargeableDays +'</span>');
            newSpan.innerHTML += htmlString;
            daysBox.appendChild(newSpan);
            daysBox.classList.add("cost-warning");


          }
        }
      } else { // this means a cost ID exists, but it isn't in the opp.data, so assume it's a manual cost entry.
        // Do nothing here?
      }

    } else if (thisProd.classList.contains("item-group")){ // the tr id contains the opporunity cost Id reference)
      var thisGroup = thisProd.closest("li.dd-haschildren");
      const thisGroupCostTotalCells = thisGroup.querySelectorAll('td.essential.align-right.predicted-cost-column');

      var thisGroupTotal = 0.0;
      for (let i = 0; i < thisGroupCostTotalCells.length; i++) {
        thisGroupCellCostSpan = thisGroupCostTotalCells[i].querySelector('span[data-original-title="Cost detail"]');
        thisGroupTotal += parseFloat(thisGroupCellCostSpan.innerText);
      }


      var thisGroupDiv = thisProd.querySelector("div.dd-content.group-name");

      var thisoldGroupName = thisGroupDiv.querySelector('span.cost-group-name');
      if (thisoldGroupName){
        var thisGroupName = thisoldGroupName.innerText;
        thisoldGroupName.remove();
      } else {
        var thisGroupName = thisGroupDiv.innerText;
      }

      var thisoldGroupTotal = thisGroupDiv.querySelector('span.cost-group-total');
      if (thisoldGroupTotal){
        thisoldGroupTotal.remove();
      }

      thisGroupDiv.innerHTML = "";

      thisGroupDiv.innerHTML = "<span class='cost-group-name'>"+thisGroupName +"</span><span class='cost-group-total'>("+currencyPrefix+thisGroupTotal.toFixed(2)+") &#8681;</span>";

    }
  }


}



// function that looks for any changes to the webpage once it has loaded, and triggers responses if these are relevant.
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    //console.log("Added:");
    //console.log(mutation.addedNodes);
    const addedNodes = Array.from(mutation.addedNodes);
    //const removedNodes = Array.from(mutation.removedNodes);
    //console.log("Removed:");
    //console.log(removedNodes);

    // Check if any removed node has the class "modal-backdrop" and "fade" (ie. it's the Quick Picker)

    mutation.addedNodes.forEach((node) => {
      if (node.classList?.contains("toast")){
        console.log("Refreshing details");
        costDetails();

      }
    });



  });
});

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
