console.log("CurrentRMS Helper Activated - costsview.js");

// Inject an external script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/cost-injected.js'); // Path to the external script
document.documentElement.appendChild(script);
script.remove();



// Reduce the unecessary width of the supplier column
document.querySelectorAll('td.quantity-column').forEach(function(element) {
  element.classList.add("center-column");
});


// Add a cost-type column immediately after the days column
document.querySelectorAll('td.optional-04.align-right.days-column').forEach(function(element) {

  var thisCostTypeCell = document.createElement('td');
  thisCostTypeCell.classList.add("force-left", "cost-type-select-column");
  element.insertAdjacentElement('afterend', thisCostTypeCell);

  
});




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



// New API Call for addDetails
async function opportunityApiCall(opportunityID, page = 1, type) {
  if (apiKey && apiSubdomain) {

    let apiUrl = `https://api.current-rms.com/api/v1/opportunities/${opportunityID}/opportunity_items?page=${page}&per_page=100`;

    if (type == "detail"){
      console.log("Calling detail API");
      apiUrl = `https://api.current-rms.com/api/v1/opportunities/${opportunityID}/opportunity_items?page=${page}&q[description_present]=1&per_page=100`;
    } else if (type == "update"){
      console.log("Calling update detail API");
      console.log(oppData.time);
      apiUrl = `https://api.current-rms.com/api/v1/opportunities/${opportunityID}/opportunity_items?page=${page}&per_page=100&q[updated_at_or_item_assets_updated_at_or_item_assets_opportunity_cost_updated_at_gt]=${oppData.time}`;
    }

    // Options for the fetch request
    const fetchOptions = {
      method: 'GET',
      headers: {
        'X-SUBDOMAIN': apiSubdomain,
        'X-AUTH-TOKEN': apiKey,
      },
    };

    try {
      // Make the API call
      const response = await fetch(apiUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse and return the JSON response
      return await response.json();
    } catch (error) {
      console.error('Error making API request:', error);
      console.error('Failed URL was:', apiUrl);

      // Retry logic if the error is a network issue
      if (error.message.includes('Failed to fetch')) {
        setTimeout(() => {
          makeToast("toast-error", "Helper failed to fetch from API. Retrying.", 5);
          addDetails();
        }, 5000);
      }

      throw error; // Re-throw the error for further handling
    }
  } else {
    throw new Error('API key or subdomain is missing.');
  }
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

function findDaysCostedByOpportunityCostId(opportunityCostId) {
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


function parseMoneyInputToFloat(input){
  var thisVal = input.replace(/,/g, '');
  return parseFloat(thisVal);
}


function formatCurrency(value, currencySymbol) {
  // Mapping of currency symbols/abbreviations to locales and currency codes
  const currencyInfo = {
    "$": { locale: "en-US", currency: "USD" }, // Default for dollar, used by multiple countries
    "A$": { locale: "en-AU", currency: "AUD" },
    "₼": { locale: "az-AZ", currency: "AZN" },
    "ب.د": { locale: "ar-BH", currency: "BHD" },
    "P": { locale: "en-BW", currency: "BWP" },
    "R$": { locale: "pt-BR", currency: "BRL" },
    "£": { locale: "en-GB", currency: "GBP" },
    "C$": { locale: "en-CA", currency: "CAD" },
    "Fr": { locale: "fr-CF", currency: "XAF" },
    "CLP$": { locale: "es-CL", currency: "CLP" },
    "¥": { locale: "zh-CN", currency: "CNY" },
    "COL$": { locale: "es-CO", currency: "COP" },
    "kn": { locale: "hr-HR", currency: "HRK" },
    "Kč": { locale: "cs-CZ", currency: "CZK" },
    "kr.": { locale: "da-DK", currency: "DKK" },
    "RD$": { locale: "es-DO", currency: "DOP" },
    "€": { locale: "de-DE", currency: "EUR" },
    "FJ$": { locale: "en-FJ", currency: "FJD" },
    "₵": { locale: "en-GH", currency: "GHS" },
    "Q": { locale: "es-GT", currency: "GTQ" },
    "L": { locale: "es-HN", currency: "HNL" },
    "HK$": { locale: "zh-HK", currency: "HKD" },
    "Ft": { locale: "hu-HU", currency: "HUF" },
    "kr": { locale: "is-IS", currency: "ISK" },
    "₹": { locale: "en-IN", currency: "INR" },
    "Rp": { locale: "id-ID", currency: "IDR" },
    "₪": { locale: "he-IL", currency: "ILS" },
    "J$": { locale: "en-JM", currency: "JMD" },
    "JD": { locale: "ar-JO", currency: "JOD" },
    "KSh": { locale: "en-KE", currency: "KES" },
    "د.ك": { locale: "ar-KW", currency: "KWD" },
    "RM": { locale: "ms-MY", currency: "MYR" },
    "MVR": { locale: "dv-MV", currency: "MVR" },
    "₨": { locale: "en-MU", currency: "MUR" },
    "MX$": { locale: "es-MX", currency: "MXN" },
    "د.م.": { locale: "ar-MA", currency: "MAD" },
    "MT": { locale: "pt-MZ", currency: "MZN" },
    "NT$": { locale: "zh-TW", currency: "TWD" },
    "NZ$": { locale: "en-NZ", currency: "NZD" },
    "₦": { locale: "en-NG", currency: "NGN" },
    "kr": { locale: "no-NO", currency: "NOK" },
    "₱": { locale: "en-PH", currency: "PHP" },
    "zł": { locale: "pl-PL", currency: "PLN" },
    "QR": { locale: "ar-QA", currency: "QAR" },
    "lei": { locale: "ro-RO", currency: "RON" },
    "₽": { locale: "ru-RU", currency: "RUB" },
    "SR": { locale: "ar-SA", currency: "SAR" },
    "S$": { locale: "en-SG", currency: "SGD" },
    "R": { locale: "en-ZA", currency: "ZAR" },
    "₩": { locale: "ko-KR", currency: "KRW" },
    "₺": { locale: "tr-TR", currency: "TRY" },
    "د.ت": { locale: "ar-TN", currency: "TND" },
    "฿": { locale: "th-TH", currency: "THB" },
    "TT$": { locale: "en-TT", currency: "TTD" },
    "₴": { locale: "uk-UA", currency: "UAH" },
    "د.إ": { locale: "ar-AE", currency: "AED" },
    "US$": { locale: "en-US", currency: "USD" },
    "USh": { locale: "en-UG", currency: "UGX" },
    "₫": { locale: "vi-VN", currency: "VND" },
  };

  // Determine the currency and locale from the mapping
  const info = currencyInfo[currencySymbol] || currencyInfo["$"]; // Fallback to USD for unrecognized symbols
  const formatter = new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.currency,
    currencyDisplay: 'narrowSymbol'
  });

  return formatter.format(value);
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
  let apiCallCount = 0;

  oppData = await recallOppDetails(opportunityID);
  console.log("Recalled oppData:");
  console.log(oppData);

  if (!oppData){
    console.log("No opp data found in local storage");

    const recallApiStartTime = performance.now();
    console.log(`Starting recallAPI function at ${recallApiStartTime}ms`);
    
    
    await recallApiDetails();
    pageNumber = 1;

    // initialise oppData
    oppData = {opportunity_items:[], meta:[]}


    const initialStartTime = performance.now();
    console.log(`Starting initial API call at ${initialStartTime}ms`);

    // First API call to get initial data and total row count
    const initialResult = await opportunityApiCall(opportunityID, 1 , "detail");

    const initialEndTime = performance.now();
    console.log(`Initial API call completed in ${initialEndTime - initialStartTime}ms`);



    oppData.opportunity_items.push(...initialResult.opportunity_items);
    oppData.meta = initialResult.meta;
    apiCallCount ++;

    console.log(oppData.meta);

    const totalRows = oppData.meta.total_row_count;
    const pageSize = 100;
    const totalPages = Math.ceil(totalRows / pageSize);

  

    console.log("Total pages: "+totalPages);
    console.log("Total rows: "+totalRows);
    
  
    
    // Helper function to log API call duration
    async function timedApiCall(opportunityID, page) {
      const startTime = performance.now();
      console.log(`Starting API call for page ${page} at ${startTime}ms`);

      const result = await opportunityApiCall(opportunityID, page, "detail");

      const endTime = performance.now();
      console.log(`API call for page ${page} completed in ${endTime - startTime}ms`);

      return result;
    }

    // Generate an array of promises for all pages
    const apiCalls = [];
    for (let page = 2; page <= totalPages; page++) {
      apiCalls.push(timedApiCall(opportunityID, page));
    }


    // Execute all API calls concurrently
    const results = await Promise.all(apiCalls);

    apiCallCount += results.length;
    

    // Combine results into oppData
    results.forEach(result => {
      oppData.opportunity_items.push(...result.opportunity_items);
      oppData.meta = result.meta;
    });

    console.log(oppData.opportunity_items);
    console.log(oppData.meta);

    const oppItemsString = JSON.stringify(oppData.opportunity_items);
    const oppMetaString = JSON.stringify(oppData.meta);
    const currentTimeString = new Date().toISOString();
    
    chrome.storage.local.set({ 
      [`opp-${opportunityID}`]: {
        opportunity_items: oppItemsString, 
        meta: oppMetaString,
        time: currentTimeString
      }
    }).then(() => {
      console.log(`Opportunity data saved for opp ID ${opportunityID}`);
    });

  } else {
    console.log("Recalled oppData:");
      console.log(oppData);

      // refreshing oppData
      const recallApiStartTime = performance.now();
      console.log(`Starting recallAPI function at ${recallApiStartTime}ms`);
      
      await recallApiDetails();
      pageNumber = 1;

      // initialise updateOppData
      let updateOppData = {opportunity_items:[], meta:[]}

      const initialStartTime = performance.now();
      console.log(`Starting initial update API call at ${initialStartTime}ms`);

      // First API call to get initial data and total row count
      const initialResult = await opportunityApiCall(opportunityID, 1 , "update");

      const initialEndTime = performance.now();
      console.log(`Initial API call completed in ${initialEndTime - initialStartTime}ms`);

      updateOppData.opportunity_items.push(...initialResult.opportunity_items);
      updateOppData.meta = initialResult.meta;
      apiCallCount ++;

      const totalRows = updateOppData.meta.total_row_count;
      const pageSize = 100;
      const totalPages = Math.ceil(totalRows / pageSize);

    

      console.log("Total pages: "+totalPages);
      console.log("Total rows: "+totalRows);
      
    
      
      // Helper function to log API call duration
      async function timedApiCall(opportunityID, page) {
        const startTime = performance.now();
        console.log(`Starting API call for page ${page} at ${startTime}ms`);

        const result = await opportunityApiCall(opportunityID, page , "update");

        const endTime = performance.now();
        console.log(`API call for page ${page} completed in ${endTime - startTime}ms`);

        return result;
      }

      // Generate an array of promises for all pages
      const apiCalls = [];
      for (let page = 2; page <= totalPages; page++) {
        apiCalls.push(timedApiCall(opportunityID, page));
      }


      // Execute all API calls concurrently
      const results = await Promise.all(apiCalls);

      apiCallCount += results.length;
      

      // Combine results into oppData
      results.forEach(result => {
        updateOppData.opportunity_items.push(...result.opportunity_items);
        updateOppData.meta = result.meta;
      });

      if (updateOppData.opportunity_items.length > 0){
        console.log("Updates to oppData:");
        console.log(updateOppData);
      }
      
      // now merge new data with existing oppData
      oppData.opportunity_items = mergeById(oppData.opportunity_items, updateOppData.opportunity_items);

      // In the normal content.js code for OrderView this is where we would check whether the number of items in oppData
      // matches the number of items in the table. However, in this cost view not every item is listed, so this step is skipped.
      // It shouldn't matter, but it is now possible that there is an item in the oppData that has been deleted elsewhere.
      // So, for example, totalling all cost items in the oppData might not be correct...

      // Now save the updated oppData to local storage
      const oppItemsString = JSON.stringify(oppData.opportunity_items);
      const oppMetaString = JSON.stringify(oppData.meta);
      const currentTimeString = new Date().toISOString();
      
      chrome.storage.local.set({ 
        [`opp-${opportunityID}`]: {
          opportunity_items: oppItemsString, 
          meta: oppMetaString,
          time: currentTimeString
        }
      }).then(() => {
        console.log(`Opportunity data updated for opp ID ${opportunityID}`);
      });

      cleanUpOldEntries();

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

        var thisDaysCosted = findDaysCostedByOpportunityCostId(thisProd.id);
        thisDaysCosted = parseFloat(thisDaysCosted);
        thisDaysCosted = parseFloat(thisDaysCosted.toFixed(1));



        //console.log("Item "+thisID+" ("+thisItemName+") is a "+thisType+" with a unit charge of "+thisUnitCharge+" and a total charge of "+ thisChargeTotal+" based on "+ thisChargeableDays + " days. But we are charging for "+thisDaysCosted+ " days. The charge type is "+thisChargeServiceRateType+" and the cost type is "+thisCostServiceRateType);



        if (thisType == "Service"){
          var daysBox = assetBodies[n].querySelector('td.optional-04.align-right.days-column');

          daysBox.classList.remove("cost-warning");
          daysBox.classList.remove("mismatch-warning");

          if (thisDaysCosted == thisChargeableDays || (thisChargeServiceRateType != thisCostServiceRateType)){


            var oldSpan = daysBox.querySelector('span.popover-help-added.days-tooltip');
            if (oldSpan){
              oldSpan.remove();
            }

            
            if (thisCostServiceRateType != "Flat Rate"){
              const newSpan = document.createElement('span');
              newSpan.classList.add("popover-help-added", "days-tooltip");

              var htmlString = (thisDaysCosted +'<span class="days-tooltiptext">'+thisCostServiceRateType+'s Costed: '+ thisDaysCosted +'<br>'+thisChargeServiceRateType+'s Charged: '+ thisChargeableDays +'</span>');
              newSpan.innerHTML += htmlString;
              daysBox.appendChild(newSpan);
              if (thisChargeServiceRateType != thisCostServiceRateType){
                daysBox.classList.add("mismatch-warning");
              }
              daysBox.dataset.costed = thisDaysCosted;
            }

          } else {

            var oldSpan = daysBox.querySelector('span.popover-help-added.days-tooltip');
            if (oldSpan){
              oldSpan.remove();
            }

            if (thisCostServiceRateType != "Flat Rate"){
              const newSpan = document.createElement('span');
              newSpan.classList.add("popover-help-added", "days-tooltip");
              var htmlString = `${thisDaysCosted} [${thisChargeableDays}]<span class="days-tooltiptext">${thisCostServiceRateType}s Costed: ${thisDaysCosted}<br>${thisChargeServiceRateType}s Charged: ${thisChargeableDays}</span>`;
              newSpan.innerHTML += htmlString;
              daysBox.appendChild(newSpan);
              daysBox.classList.add("cost-warning");
              daysBox.dataset.costed = thisDaysCosted;
            }

          }

          // Add cost type selectors
          var thisCostTypeCell = thisProd.querySelector('td.cost-type-select-column');

          var oldSelect = thisCostTypeCell.querySelector('select');
            if (oldSelect){
              oldSelect.remove();
            }



          let newSelectInput = document.createElement('select');
          newSelectInput.classList.add("cost-type-select");
          newSelectInput.setAttribute("data-cost-id", thisProd.id);
          newSelectInput.setAttribute("data-cost-type", thisCostServiceRateType);

          let shortServiceType;

          if (thisCostServiceRateType == "Day"){
            shortServiceType = "Day";
          } else if (thisCostServiceRateType == "Hour"){
            shortServiceType = "Hour";
          } else if (thisCostServiceRateType == "Distance"){
            shortServiceType = "Dist";
          } else if (thisCostServiceRateType == "Flat Rate"){
            shortServiceType = "Flat";
          }

          // now define your four rate‑types
          const rateTypes = ['Day','Hour','Dist','Flat'];

          // for each one, make an <option>…
          rateTypes.forEach(type => {
            const opt = document.createElement('option');
            // set the option’s value (you can customize this if you need a different value)
            opt.value = type.toLowerCase();
            // the visible text
            opt.textContent = type;
            // optionally pre‑select the one that matches your current rate type
            if (type === shortServiceType) {
              opt.selected = true;
            }

            newSelectInput.appendChild(opt);
          });


          thisCostTypeCell.appendChild(newSelectInput);
          


        } // end of if service
      } else { // this means a cost ID exists, but it isn't in the opp.data, so assume it's a manual cost entry.
        // Do nothing here?
      }

    } else if (thisProd.classList.contains("item-group")){ // the tr id contains the opporunity cost Id reference)
      var thisGroup = thisProd.closest("li.dd-haschildren");
      const thisGroupCostTotalCells = thisGroup.querySelectorAll('td.essential.align-right.predicted-cost-column');

      var thisGroupTotal = 0.0;
      for (let i = 0; i < thisGroupCostTotalCells.length; i++) {
        thisGroupCellCostSpan = thisGroupCostTotalCells[i].querySelector('span[data-original-title="Cost detail"]');
        thisGroupTotal += parseMoneyInputToFloat(thisGroupCellCostSpan.innerText);
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

      var thisFinalTotal = thisGroupTotal.toFixed(2);
      var thisFinalTotalString = formatCurrency(thisFinalTotal, currencyPrefix);



      thisGroupDiv.innerHTML = "<span class='cost-group-name'>"+thisGroupName +"</span><span class='cost-group-total'>("+thisFinalTotalString+") &#8681;</span>";

    }
  }

  document.querySelectorAll('td.quantity-column.align-right').forEach(function(element) {
    element.classList.add("force-left");

  });




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





// Add To Existing Purchase Order improvement section
const addToPoButton = document.querySelector('a[href="#add-to-purchase-order-modal"]');

if (addToPoButton) {
  addToPoButton.addEventListener('click', function(event) {
      //event.preventDefault(); // Prevent the default anchor behavior if needed
      getPoSupplier();
  });
} else {
    console.log("Add to PO Button not found.");
}



function getPoSupplier(){
  var supplier;
  const tickBoxes = document.querySelectorAll("input.item-select");
  for (let i = 0; i < tickBoxes.length; i++) {
    var item = tickBoxes[i];
    if (item.checked){
      var thisRow = item.closest("tr");
      supplier = thisRow.querySelector('td.optional-01.asset.asset-column').innerText;
      break;
    }
  };
  console.log(supplier);
  const poAddModal = document.getElementById("add-to-purchase-order-modal");
  const infoLine = poAddModal.querySelector("p.subtitle");
  infoLine.innerHTML = `Items will need to have the same supplier as the existing purchase order:<br><span class="supplier-name">${supplier}</span>`;

  chrome.runtime.sendMessage({
    messageType: "getPOsFor",
    supplier: supplier
  });

}

// List supplier POs when returned from a scrape
function listPOs(poArray){

  const poAddModal = document.getElementById("add-to-purchase-order-modal");
  const targetDiv = poAddModal.querySelector("div.modal-body");

  var poListDiv = document.getElementById('po-list');

  if (poListDiv){
    poListDiv.innerHTML = "";
  } else {
    poListDiv = document.createElement('div');
    poListDiv.classList.add("po-list");
    poListDiv.id = "po-list";
    targetDiv.appendChild(poListDiv);
  }

  const thisJob = document.querySelector("h1.subject-title").innerText.trim();
  console.log(thisJob);

  const sortedArray = prioritiseMatches(poArray, thisJob);

  sortedArray.forEach((item) => {
    const newElement = document.createElement('div');
    newElement.classList.add("po-select")
    newElement.innerHTML = `${item}`;
    poListDiv.appendChild(newElement);
  });


}

document.addEventListener('click', (event) => {
    // Check if the clicked element has the class "po-select"
    if (event.target.classList.contains('po-select')) {
        console.log(event.target.textContent);
        document.getElementById("purchase_order_name").value = event.target.textContent;
    }
});




// Messages from the extension service worker to trigger changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received from service-worker:");
  console.log(message);

  // Stop observing when the extension is disabled or uninstalled
  if (message.message === "stopObserver") {
    observer.disconnect();
  }

  if (message.messageType == "POsFound"){
      console.log("PO list was received");
      console.log(message.activePurchaseOrders);
      listPOs(message.activePurchaseOrders);

  }

});



function prioritiseMatches(array, input) {
    // Create a new array of matches, where each item includes the input string (case-insensitive)
    const matches = array.filter(item => item.toLowerCase().includes(input.toLowerCase()));

    // Create a new array of non-matches
    const nonMatches = array.filter(item => !item.toLowerCase().includes(input.toLowerCase()));

    // Combine matches and non-matches, with matches moved to the start of the array
    return [...matches, ...nonMatches];
}


async function recallOppDetails(oppID) {
  // Retrieve the stored data

  /* removal block used for dev testing
  try {
    await chrome.storage.local.remove([`opp-${oppID}`]);
    console.log(`opp-${oppID} removed`);
  } catch (err) {
    console.error('Error removing key:', err);
  }
  */

  const result = await chrome.storage.local.get([`opp-${oppID}`]);
  
  // Ensure the result exists and the specific key is available.
  if (result && result[`opp-${oppID}`]) {
    const oppData = result[`opp-${oppID}`];
    return {
      opportunity_items: JSON.parse(oppData.opportunity_items),
      meta: JSON.parse(oppData.meta),
      time: oppData.time
    };
  }
  return null;
}


// Remove any entries in chrome.storage.local whose value.time is older than one week.
 
async function cleanUpOldEntries() {
  try {
    // Grab all stored items
    const items = await chrome.storage.local.get(null);
    
    // Compute cutoff timestamp (one week ago)
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = now - oneWeekMs;
    
    // Collect keys to remove
    const keysToRemove = Object.entries(items)
      .filter(([key, value]) => {
        // Check existence of a .time property, and that it's a valid date
        if (value && typeof value.time === 'string') {
          const t = Date.parse(value.time);
          return !isNaN(t) && t < cutoff;
        }
        return false;
      })
      .map(([key]) => key);
    
    // Remove stale entries (if any)
    if (keysToRemove.length) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`Removed ${keysToRemove.length} stale entr${keysToRemove.length > 1 ? 'ies' : 'y'}:`, keysToRemove);
    } else {
      console.log('No entries older than one week found.');
    }
    
  } catch (err) {
    console.error('Error cleaning up old entries:', err);
  }
}


// function to use when combining oppData with updateOppData
function mergeById(arrayInitial, arrayUpdate) {
  // 1) Take only the initial items whose id isn’t in the updates
  const filtered = arrayInitial.filter(
    init => !arrayUpdate.some(upd => upd.id === init.id)
  );

  // 2) Concatenate those “survivors” with all of the updates
  return [...filtered, ...arrayUpdate];
}