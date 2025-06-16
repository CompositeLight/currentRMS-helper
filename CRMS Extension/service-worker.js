const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();


var removed = "";
var iAmScraping = false;

// handler for incoming messages from other js code (like content.js or popup.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);
  //if (removed){
  //  sendResponse({ message: "Background js received your message", removedAsset: removed});
  //} else {
  //  sendResponse({ message: "Background js received your message" });
  //}
  if (message.messageType == "removal"){
    console.log(sender);
    console.log("removeasset.js has removed:");
    console.log(message.removedAsset);
    removed = message.removedAsset;

  } else if (message.messageType == "check"){
    console.log("Check received");
    sendResponse({removedAsset: removed});
    removed = "";

  } else if (message == "refreshProducts"){
    console.log("Product refresh requested");
    retrieveApiData();
  } else if (message == "refreshQuarantines") {
    console.log("Quarantines refresh requested.");
    retreiveQuarantines();

  } else if (message.messageType == "forceAllStockUpdate"){
    console.log("All stock update requested");
    forceAllStockUpdate();

  } else if (message.messageType == "availabilityscape"){
      console.log("Availability scrape was requested for "+message.messageText);
      if (iAmScraping){
        console.log("Request denied as a scrape is already in progress");
      } else {
        //iAmScraping = true;
        //availabilityScrape(message.messageText, message.messageStartDate, message.messageEndDate);
        availabilityScrapeNonDom(message.messageText, message.messageStartDate, message.messageEndDate);
      }

  } else if (message.messageType == "qtyInUseScrape"){
      console.log("Qty in use scrape was requested for "+message.messageProduct);
      if (iAmScraping){
        console.log("Request denied as a scrape is already in progress");
      } else {
        iAmScraping = true;
        qtyInUseScrape(message.messageProduct, message.messageOpp);
      }

  } else if (message.messageType == "globalsearchscrape"){
      console.log("Global Search scrape was requested for "+message.messageText);
      if (iAmScraping){
        console.log("Request denied as a scrape is already in progress");
      } else {
        iAmScraping = true;
        globalSearchScrape(message.messageText);
      }

  } else if (message.messageType == "containercheckin"){
      console.log("Container check-in was requested for "+message.containerRef);
      containercheckin(message.containerRef);


  } else if (message.action === "closeTab") {
          // close the scraper tab on demand.
          chrome.tabs.remove(sender.tab.id);
          iAmScraping = false;

  } else if (message.messageType === "availabilityData") {
        iAmScraping = false;
        // Forward the message to Content Script B
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, messag, () => {/* swallow error */});
            });
          }
        });
        // now follow up by scraping detail view data
        if (iAmScraping){
          console.log("Request denied as a scrape is already in progress");
        } else {

          iAmScraping = true;
          warehouseNotesScrape(message.messageOpp);
        }
  } else if (message.messageType === "oppScrapeData") {
        // response regarding inactive opps found for global search
        iAmScraping = false;
        // Forward the message to Content Script B
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
            });
          }
        });
  } else if (message.messageType === "warehouseNotesData") {
        // response regarding scraping of warehouse notes
        iAmScraping = false;
        // Forward the message to Content Script
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
            });
          }
        });
        
  } else if (message.messageType === "productQtyData") {
      iAmScraping = false;
      // Forward the message to Content Script
      chrome.tabs.query({}, function(tabs) {
        if (tabs.length > 0){
          tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
          });
        }
      });

  } else if (message == "soundchanged") {
        // Forward the message to Content Script
        console.log("Sound change message received");
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
            });
          }
        });
  } else if (message == "errortimeoutchanged") {
        // Forward the message to Content Script
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
            });
          }
        });

  } else if (message == "bookOutContainers") {
        // Forward the message to Content Script
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
            });
          }
        });
  } else if (message == "detailDelete") {
        // Forward the message to Content Script
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
            });
          }
        });
  } else if (message == "nestedTotals") {
    // Forward the message to Content Script
    chrome.tabs.query({}, function(tabs) {
      if (tabs.length > 0){
        tabs.forEach(function(tab) {
            chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
        });
      }
    });

  } else if (message.messageType === "autocheckinreport") {
        // response regarding auto-checkin of items

        // Forward the message to all tabs
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
            });
          }
        });

  } else if (message.messageType === "getPOsFor") {
          purchaseOrderScrape(message.supplier);

  } else if (message.messageType === "POsFound") {
    // response regarding scraping of POs

    // Forward the message to all tabs
    chrome.tabs.query({}, function(tabs) {
      if (tabs.length > 0){
        tabs.forEach(function(tab) {
            chrome.tabs.sendMessage(tab.id, message, () => {/* swallow error */});
        });
      }
    });


  } else {
    console.log("Background js received a message");
    console.log(message);
    (async () => {
      // Sends a message to the service worker and receives a response
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          console.log(tabs.length);
          if (tabs.length > 0){
            if (tabs[0].url.match(/^https:\/\/.*\.current-rms\.com\/.*$/)) {
              chrome.tabs.sendMessage(tabs[0].id, {inspectionAlerts: message.inspectionAlerts, multiGlobal: message.multiGlobal, blockQuarantines: message.blockQuarantines}, function(response) {});
            }
          }
      });
    })();
  }
});

////////






var apiKey = '';
var apiSubdomain = '';

let allStock = {stock_levels:[], meta:[]};
let allProducts = {products:[], meta:[]};
let pageNumber = 1;
let quarantinePageNumber = 1;
var opportunityAssets = {opportunity_items:[], meta:[]};
let quarantineData = {quarantines:[], meta:[]};

checkQuarantineStatus(); // imediately check quarantine info status and update if necessary.

function checkQuarantineStatus(){
  // get the inspection alert setting from local storage
  chrome.storage.local.get(["quarantineUpdateTime"]).then((result) => {
      if (result.quarantineUpdateTime == undefined){
        console.log("No data set");
        retreiveQuarantines();
      } else {
        const timeNow = new Date().getTime();
        const timeElapsed = timeNow - result.quarantineUpdateTime;
        console.log("Time since last Quarantine data update (ms): "+timeElapsed);
        if (timeElapsed > 1800000){ // check every 30 minutes
          retreiveQuarantines();
        } else {
          var timeRemaining = (1800000 - timeElapsed + 10); // reschedule a check when the time expires.
          setTimeout(() => {
            checkQuarantineStatus();
          }, timeRemaining);

        }
      }
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


// API call to retrieve a list of assets on an opportunity

function getOpportunityAssets(opp){
  recallApiDetails();
  if (apiKey && apiSubdomain){
    return new Promise(function (resolve, reject) {
      const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'/opportunity_items/?include[]=item&include[]=item_assets&page='+pageNumber+'&per_page=100';
   
      console.log(apiUrl);
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
          opportunityAssets.opportunity_items = opportunityAssets.opportunity_items.concat(data.opportunity_items); // merge new page of data into stock_levels
          opportunityAssets.meta = data.meta; // merge new page of data into meta
          resolve("ok");
          console.log("Loading stock list page " + pageNumber);
          var totalRows = (data.meta.total_row_count);
          var currentRow = (data.meta.page * data.meta.per_page);
          var progressPercent = Math.floor((currentRow / totalRows) * 100);
          progressPercent = Math.min(progressPercent, 100);
          sendProgress(progressPercent);
          //console.log (progressPercent +"% complete");
          //console.log(data);

        })
        .catch(error => {
          // Handle errors here
          console.error('Error making API request:', error);
        });
    });
  }
}

async function retreiveOpportunityAssets(opp) {

    var result = await getOpportunityAssets(opp);
    while (stockList.meta.row_count > 0){
      pageNumber ++;
      var result = await getOpportunityAssets(opp);
    }
    console.log("API call complete");
    pageNumber = 1;
    console.log(opportunityAssets);

    /// end of test block
}








// API call to retrieve a list of products?

function getProducts(opp){
  return new Promise(function (resolve, reject) {
    const apiUrl = 'https://api.current-rms.com/api/v1/products/?page='+pageNumber+'&per_page=100&include[]=icon&include[]=accessories&filtermode=active';
    
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
        allProducts.products = allProducts.products.concat(data.products); // merge new page of data into stock_levels
        allProducts.meta = data.meta; // merge new page of data into meta
        resolve("ok");

        //console.log("Loading product list page " + pageNumber);
        var totalRows = (data.meta.total_row_count);
        var currentRow = (data.meta.page * data.meta.per_page);
        var progressPercent = Math.floor((currentRow / totalRows) * 100);
        progressPercent = Math.min(progressPercent, 100);
        console.log ("Product List download "+progressPercent +"% complete");
        sendProgress(progressPercent);


      })
      .catch(error => {
        // Handle errors here
        console.error('Error making API request:', error);
        sendAlert('Error making product API request: '+ error);
      });
  });
}

// API call to retrieve a list of stock items?

function getStock(){
  return new Promise(function (resolve, reject) {
    const apiUrl = 'https://api.current-rms.com/api/v1/stock_levels/?page='+pageNumber+'&per_page=100&include[]=icon&include[]=item&q[s][]=item_id+asc';
    
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
        allStock.stock_levels = allStock.stock_levels.concat(data.stock_levels); // merge new page of data into stock_levels
        allStock.meta = data.meta; // merge new page of data into meta
        resolve("ok");

        //console.log("Loading stock list page " + pageNumber);
        var totalRows = (data.meta.total_row_count);
        var currentRow = (data.meta.page * data.meta.per_page);
        var progressPercent = Math.floor((currentRow / totalRows) * 100);
        progressPercent = Math.min(progressPercent, 100);
        console.log ("Stock Level download "+progressPercent +"% complete");
        sendProgress(progressPercent);

      })
      .catch(error => {
        // Handle errors here
        console.error('Error making API request:', error);
        sendAlert('Error making stock_level API request: '+ error);
      });
  });
}







async function retrieveApiData(opp) {

  await recallApiDetails();
  if (apiKey && apiSubdomain){
    // Refresh product list
    allProducts = {products:[], meta:[]};
    allStock = {stock_levels:[], meta:[]};


    var result = await getProducts(opp);
    while (allProducts.meta.row_count > 0){
      pageNumber ++;
      var result = await getProducts(opp);
      try {
        await chrome.runtime.sendMessage("awaitingproducts");
      } catch (err) {
        if (err.message.includes('Receiving end does not exist')) {
          // fallback or retry logic
        }
      }
      
      
    }
    console.log("API call for Products complete");
    pageNumber = 1;
    var numberOfProducts = allProducts.products.length;
    console.log("Number of active products: " + numberOfProducts);
    
    const allProductsString = JSON.stringify(allProducts);
    console.log("Products list was updated")

     // Refresh stock item list
     var result = await getStock();
     while (allStock.meta.row_count > 0){
       pageNumber ++;
       var result = await getStock();
       try {
        await cchrome.runtime.sendMessage("awaitingstock");
      } catch (err) {
        if (err.message.includes('Receiving end does not exist')) {
          // fallback or retry logic
        }
      }
      
       
     }
     console.log("API call for Stock complete");
     pageNumber = 1;
     var numberOfStock = allStock.stock_levels.length;
     console.log("Number of  stock items: " + numberOfStock);


     const allStockString = JSON.stringify(allStock);
     chrome.storage.local.set({ 'allProducts': allProductsString, 'allStock': allStockString }).then(() => {
        console.log("Stock item list was updated");
      });


      // Get the current date and time
      const currentDate = new Date();

      // Format the date and time as (hh:mm:ss dd:mm:yy)
      const formattedTime = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()} ${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

      // Store the formatted time in Chrome local storage
      chrome.storage.local.set({ "apiUpdateTime": formattedTime }, function() {
          console.log('Current time stored in local storage:', formattedTime);
      });

      // update the api timestamp
      const timecheck = new Date().getTime();
      chrome.storage.local.set({ [`apidata-timestamp-${apiSubdomain}`]: timecheck });

      try {
        await chrome.runtime.sendMessage("apidatawasrefreshed");
      } catch (err) {
        if (err.message.includes('Receiving end does not exist')) {
          // fallback or retry logic
        }
      }
      
      
    }
}



//apiTest("opportunities/361/opportunity_items?q[description_present]=1&per_page=100");

async function apiTest(urlAFterv1Slash){
  await recallApiDetails();
  const apiUrl = 'https://api.current-rms.com/api/v1/' + urlAFterv1Slash;
  //const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'?include[opportunity_items]=1&page='+pageNumber+'&per_page=100';
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
      console.log(data);

    })
    .catch(error => {
      // Handle errors here
      console.error('Error making API request:', error);
    });
}


async function sendAlert(message){
  try {
    await chrome.runtime.sendMessage({messageType: "alert", messageText: message});
  } catch (err) {
    if (err.message.includes('Receiving end does not exist')) {
      // fallback or retry logic
    }
  }
  
}

async function sendProgress(percent){
  try {
    await chrome.runtime.sendMessage({messageType: "progress", messageProgress: percent});
  } catch (err) {
    if (err.message.includes('Receiving end does not exist')) {
      // fallback or retry logic
    }
  }
  
  
}




// Function to get Quaratine data from the api

// Request quaratine list to prevent scans later
async function retreiveQuarantines() {

    await recallApiDetails();
    if (apiKey && apiSubdomain){
      quarantineData = {quarantines:[], meta:[]};

      quarantinePageNumber = 1;
      var result = await quarantineApiCall();
      while (quarantineData.meta.row_count > 0){
        quarantinePageNumber ++;
        var result = await quarantineApiCall();
        console.log("Downloading Quarantine data");
      }
      console.log("Quarantine data download complete.");
      quarantinePageNumber = 1;
      var countQuarantines = quarantineData.quarantines.length;
      console.log(countQuarantines +" quarantine records retrieved.")


      // Get the current date and time
      const currentDate = new Date().getTime();

      //Store the last update time in Chrome local storage
      chrome.storage.local.set({ "quarantineUpdateTime": currentDate }, function() {
          console.log('Quarantine Update Time saved in local storage.', currentDate);
      });
      checkQuarantineStatus();

      const quarantineDataString = JSON.stringify(quarantineData);
      chrome.storage.local.set({ 'quarantineData': quarantineDataString }).then(() => {
         console.log("Quarantine data in local storage was updated");
      });
      try {
        await chrome.runtime.sendMessage("quarantinedatarefreshed");
      } catch (err) {
        if (err.message.includes('Receiving end does not exist')) {
          // fallback or retry logic
        }
      }
      
    }
}



// API Call for quarantines
function quarantineApiCall(){

  if (apiKey && apiSubdomain){
    return new Promise(function (resolve, reject) {

      const apiUrl = 'https://api.current-rms.com/api/v1/quarantines?page='+quarantinePageNumber+'&per_page=100&q[quarantine_type_not_eq]=3';
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
          //console.log(data);
          quarantineData.quarantines = quarantineData.quarantines.concat(data.quarantines); // merge new page of data
          quarantineData.meta = data.meta; // merge new page of data into meta
          resolve("ok");
        })
        .catch(error => {
          // Handle errors here
          console.error('Error making API request:', error);

        });

    });
  }
}


async function availabilityScrape(opp, start, end){
  await recallApiDetails();

  if (apiSubdomain){

    const timeStart = start.split(' ')[1].replace(':', '');
    const timeEnd = end.split(' ')[1].replace(':', '');

    var scrapeURL = 'https://'+apiSubdomain+'.current-rms.com/availability/opportunity/'+opp+'?'+timeStart+'&'+timeEnd+'&scrape';
    console.log(scrapeURL);
    chrome.tabs.create({
        url: scrapeURL,
        active: false
      }, function(tab) {
      // tab actions built into the scrape script
    });
  }
}


async function warehouseNotesScrape(opp){
  await recallApiDetails();
  if (apiSubdomain){
    var scrapeURL = 'https://'+apiSubdomain+'.current-rms.com/opportunities/'+opp+'?view=d&scrape';
    console.log(scrapeURL);
    chrome.tabs.create({
        url: scrapeURL,
        active: false
      }, function(tab) {
      // tab actions built into the scrape script
    });
  }
}



async function qtyInUseScrape(prod, opp){
  await recallApiDetails();
  if (apiSubdomain){
    var scrapeURL = 'https://'+apiSubdomain+'.current-rms.com/availability/opportunity/'+opp+'?'+prod+'&scrapeqty';
    console.log(scrapeURL);
    chrome.tabs.create({
        url: scrapeURL,
        active: false
      }, function(tab) {
      // tab actions built into the scrape script
    });
  }
}


async function globalSearchScrape(toSearch){
  await recallApiDetails();
  if (apiSubdomain){
    var scrapeURL = 'https://'+apiSubdomain+'.current-rms.com/opportunities?utf8=✓&per_page=48&view_id=0&q%5Bs%5D%5B%5D=starts_at+desc&filtermode%5B%5D=inactive&q%5Bsubject_or_description_or_number_or_reference_or_member_name_or_tags_name_cont%5D='+toSearch+'&scrape';
    console.log(scrapeURL);
    chrome.tabs.create({
        url: scrapeURL,
        active: false
      }, function(tab) {
      // You can perform actions here after the tab is created
    });
  }
}


async function containercheckin(containerRef){
  await recallApiDetails();
  if (apiSubdomain){
    chrome.tabs.create({
        url: `https://${apiSubdomain}.current-rms.com/global_check_in?autocheckin&${containerRef}`,
        active: false
      }, function(tab) {
      // You can perform actions here after the tab is created
    });
  }

}


async function purchaseOrderScrape(supplier){
  await recallApiDetails();

  if (apiSubdomain){

    var supplierSearchString = reformatString(supplier);

    chrome.tabs.create({
        url: `https://${apiSubdomain}.current-rms.com/purchase_orders?utf8=✓&per_page=48&view_id=0&q%5Bmember_name_cont%5D=${supplierSearchString}&supplierscrape`,
        active: false
      }, function(tab) {
      // You can perform actions here after the tab is created
    });
  }

}


function reformatString(input) {
    // Convert the string to lowercase
    const lowerCaseString = input.toLowerCase();

    // Encode the entire string to handle special characters like parentheses
    const encodedString = encodeURIComponent(lowerCaseString);

    // Replace encoded spaces ("%20") with "+"
    const finalString = encodedString.replace(/%20/g, '+');

    return finalString;
}





var updatedProducts = {products:[], meta:[]};
var updatedStock = {stock_levels:[], meta:[]};



// line to remove stored key for testing purposes
//chrome.storage.local.remove([`apidata-timestamp-${apiKey}`]);


checkApiDataStatus(); // check API data status and refresh if necessary

async function checkApiDataStatus(){
  await recallApiDetails();
  if (apiKey && apiSubdomain){
    // get the timestamp for the last apiData update
    chrome.storage.local.get([`apidata-timestamp-${apiSubdomain}`]).then((result) => {
        console.log(result); 
        if (result[`apidata-timestamp-${apiSubdomain}`] == undefined){
          console.log("No apiData time stamp set");
          updateApiData(600000);
        } else {
          const timeNow = new Date().getTime();

          const timeStamped = parseInt(result[`apidata-timestamp-${apiSubdomain}`]);
          const timeElapsed = timeNow - timeStamped;
          console.log("Time since last apiData update (ms): "+timeElapsed);
          if (timeElapsed > 3600000){ // check every 60 minutes
            updateApiData(timeStamped);
          } else {
            var timeRemaining = (3600000 - timeElapsed + 10); // reschedule a check when the time expires.
            setTimeout(() => {
              checkApiDataStatus();
            }, timeRemaining);

          }
        }
    });
  }
}


async function forceAllStockUpdate() {
  await recallApiDetails();

  if (apiKey && apiSubdomain) {
    // get the timestamp for the last apiData update
    const result = await chrome.storage.local.get([`apidata-timestamp-${apiSubdomain}`]);
    console.log(result);
    if (result[`apidata-timestamp-${apiSubdomain}`] == undefined) {
      console.log("No apiData time stamp set");
      await updateApiData(600000);
    } else {
      const timeNow = new Date().getTime();
      const timeStamped = parseInt(result[`apidata-timestamp-${apiSubdomain}`]);
      await updateApiData(timeStamped);
      chrome.tabs.query({}, function(tabs) {
        if (tabs.length > 0) {
          tabs.forEach(function(tab) {

            try {
              // Send a message to the content script in each tab
              chrome.tabs.sendMessage(tab.id, "forceAllStockUpdateComplete", function(response) {});
            }
            catch (error) {
              if (error.message.includes('Receiving end does not exist')) {
                // fallback or retry logic
              } else {
                console.error(`Error sending message to tab ${tab.id}: ${error}`);
              }
            }

          });
        }
      });
  
    }
  }
}




// new function to update api data rather than download the whole thing
async function updateApiData(timeStamped) {

  console.log("Update API data requested");

  await recallApiDetails();

  if (apiKey && apiSubdomain){


  // reset data
  updatedProducts = {products:[], meta:[]};
  updatedStock = {stock_levels:[], meta:[]};

  var updatePageNumber = 1;

  const time = timeStamped - 600000; // subtract 1 hour from the timestamp JIC

  console.log("Time to check for updates: "+time);

  // Refresh product list
  var result = await updateProducts(updatePageNumber, time);
  while (updatedProducts.meta.row_count > 0){
    updatePageNumber ++;
    var result = await updateProducts(updatePageNumber, time);
    try {
      await chrome.runtime.sendMessage("awaitingproducts");
    } catch (err) {
      if (err.message.includes('Receiving end does not exist')) {
        // fallback or retry logic
      }
    }
    
    
  }
  console.log("API call for Products complete");
  updatePageNumber = 1;
  var numberOfProducts = updatedProducts.products.length;
  console.log("Number of updated products: " + numberOfProducts);

  
  
  console.log("Products list was updated")

  console.log(updatedProducts);



  // Refresh stock list
  var result = await updateStock(updatePageNumber, time);
  while (updatedStock.meta.row_count > 0){
    updatePageNumber ++;
    var result = await updateStock(updatePageNumber, time);
    try {
      await chrome.runtime.sendMessage("awaitingstock");
    } catch (err) {
      if (err.message.includes('Receiving end does not exist')) {
        // fallback or retry logic
      }
    }
    
    
  }
  console.log("API call for Stock complete");
  updatePageNumber = 1;
  var numberOfProducts = updatedStock.stock_levels.length;
  console.log("Number of updated stock items: " + numberOfProducts);

  console.log("Stock list was updated")

  console.log(updatedStock);

  let existingAllStock = {stock_levels:[], meta:[]};
  let existingAllProducts = {products:[], meta:[]};

  if (time > 0){
    var productsResult = await chrome.storage.local.get(["allProducts"]);
    console.log(productsResult);
    if (productsResult.allProducts != undefined){
      var allProductsString = productsResult.allProducts;
      existingAllProducts = JSON.parse(allProductsString);
    }

    var stockResult = await chrome.storage.local.get(["allStock"]);
    console.log(stockResult);
    
    if (stockResult.allStock != undefined){
      var allStockString = stockResult.allStock;
      existingAllStock = JSON.parse(allStockString);
    }
  
    
  }


  console.log("Existing all stock: ");
  console.log(existingAllStock);
  console.log("Existing all products: ");
  console.log(existingAllProducts);
  console.log("Updated stock: ");
  console.log(updatedStock);
  console.log("Updated products: ");
  console.log(updatedProducts);
  console.log("Merging data...");


  allProducts.products = mergeById(existingAllProducts.products, updatedProducts.products);
  allStock.stock_levels = mergeById(existingAllStock.stock_levels, updatedStock.stock_levels);

  const newAllStockString = JSON.stringify(allStock);
  const newAllProductsString = JSON.stringify(allProducts);

  console.log("New after merge:")
  console.log(allStock);
  console.log(allProducts);

  await chrome.storage.local.set({ 'allProducts': newAllProductsString, 'allStock': newAllStockString });
    console.log("apiData for products and stock was updated");
    
    // Get the current date and time
    const currentDate = new Date();

    // Format the date and time as (hh:mm:ss dd:mm:yy)
    const formattedTime = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()} ${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

    // Store the formatted time in Chrome local storage
    chrome.storage.local.set({ "apiUpdateTime": formattedTime }, function() {
        console.log('Current time stored in local storage:', formattedTime);
    });

    // update the api timestamp
    const timecheck = new Date().getTime();
    chrome.storage.local.set({ [`apidata-timestamp-${apiSubdomain}`]: timecheck });
    try {
        await chrome.runtime.sendMessage("apidatawasrefreshed");
    } catch (err) {
      if (err.message.includes('Receiving end does not exist')) {
        // fallback or retry logic
      }
    }
    
    // run the check again in 60 minutes
    checkApiDataStatus();

 


  }
}



function updateProducts(thisPage, time){

  const timeString = new Date(time).toISOString();
  return new Promise(function (resolve, reject) {
    const apiUrl = `https://api.current-rms.com/api/v1/products/?page=${thisPage}&per_page=100&include[]=icon&include[]=accessories&filtermode=active&q[updated_at_or_product_group_updated_at_or_icon_updated_at_gt]=${timeString}`;
  
    

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
        updatedProducts.products = updatedProducts.products.concat(data.products); // merge new page of data into stock_levels
        updatedProducts.meta = data.meta; // merge new page of data into meta
        resolve("ok");

        //console.log("Loading product list page " + pageNumber);
        var totalRows = (data.meta.total_row_count);
        var currentRow = (data.meta.page * data.meta.per_page);
        var progressPercent = Math.floor((currentRow / totalRows) * 100);
        progressPercent = Math.min(progressPercent, 100);
        console.log ("Product List download "+progressPercent +"% complete");
        sendProgress(progressPercent);


      })
      .catch(error => {
        // Handle errors here
        console.error('Error making API request:', error);
        sendAlert('Error making product API request: '+ error);
      });
  });
}


// API call to update a list of stock items?

function updateStock(thisPage, time){

  const timeString = new Date(time).toISOString();

  return new Promise(function (resolve, reject) {
    const apiUrl = `https://api.current-rms.com/api/v1/stock_levels/?page=${thisPage}&per_page=100&include[]=icon&include[]=item&q[s][]=item_id+asc&q[updated_at_or_icon_updated_at_or_item_updated_at_gt]=${timeString}`;

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
        updatedStock.stock_levels = updatedStock.stock_levels.concat(data.stock_levels); // merge new page of data into stock_levels
        updatedStock.meta = data.meta; // merge new page of data into meta
        resolve("ok");

        //console.log("Loading stock list page " + pageNumber);
        var totalRows = (data.meta.total_row_count);
        var currentRow = (data.meta.page * data.meta.per_page);
        var progressPercent = Math.floor((currentRow / totalRows) * 100);
        progressPercent = Math.min(progressPercent, 100);
        console.log ("Stock Level download "+progressPercent +"% complete");
        sendProgress(progressPercent);

      })
      .catch(error => {
        // Handle errors here
        console.error('Error making API request:', error);
        sendAlert('Error making stock_level API request: '+ error);
      });
  });
}



// function to use when combining oppData with updateOppData
function mergeById(arrayInitial, arrayUpdate) {
  console.log(arrayInitial);
  console.log(arrayUpdate);
  // 1) Take only the initial items whose id isn’t in the updates
  const filtered = arrayInitial.filter(
    init => !arrayUpdate.some(upd => upd.id === init.id)
  );

  // 2) Concatenate those “survivors” with all of the updates
  return [...filtered, ...arrayUpdate];
}


async function availabilityScrapeNonDom(opp, start, end){
  const thisStarted = Date.now();

  function textFromHtml(raw) {
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  }


  var availabilityData = {};

  function convertToDateTime(timeStr) {
    var hours = parseInt(timeStr.substring(0, 2));
    var minutes = parseInt(timeStr.substring(2, 4));
    return hours * 60 + minutes;
  }

  await recallApiDetails();
  const timeStart = start.split(' ')[1].replace(':', '');
  const timeEnd = end.split(' ')[1].replace(':', '');
  
  const response = await fetch(`https://${apiSubdomain}.current-rms.com/availability/opportunity/${opp}?${timeStart}&${timeEnd}&scrape`, { credentials: 'include' });
  if (!response.ok) throw new Error(`Failed to fetch detail page: ${response.status}`);

  const html = await response.text();


  //console.log(html);


  /* ─────────────────── <h1> ─────────────────── */
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const scraped = h1Match ? textFromHtml(h1Match[1]) : '';
  console.log('Heading:', scraped);

  /* ───────────── <table id="availability-grid"> (order‑agnostic) ───────────── */
  const tableTagMatch = html.match(
    /<table\b[^>]*\bid\s*=\s*(["'])availability-grid\1[^>]*>([\s\S]*?)<\/table>/i
  );

  if (!tableTagMatch) {
    console.warn('No #availability-grid table found');
    return {};
  }

  const tableOpenTag = tableTagMatch[0].match(/<table\b[^>]*>/i)[0]; // just the <table …> start tag
  const tableHtml    = tableTagMatch[2];                             // inner HTML between <table>…</table>

  /* extract the class attribute, whatever its position */
  const classAttrMatch = tableOpenTag.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
  const tableClasses   = classAttrMatch ? classAttrMatch[2].split(/\s+/) : [];


  /* ─────── replicate your period-split logic ─────── */
  let timeDivide = 1;
  if (tableClasses.includes('period2')) timeDivide = 2;
  else if (tableClasses.includes('period4')) timeDivide = 4;

  let ignoreStart = 0;
  let ignoreEnd   = 0;

  if (timeDivide > 1) {
    const startTime = convertToDateTime(timeStart); // ← your helpers
    const endTime   = convertToDateTime(timeEnd);

    if (timeDivide === 2) {
      if (startTime > convertToDateTime('1200')) ignoreStart = 1;
      if (endTime   <= convertToDateTime('1200')) ignoreEnd   = 1;
    } else if (timeDivide === 4) {
      if      (startTime > convertToDateTime('1800')) ignoreStart = 3;
      else if (startTime > convertToDateTime('1200')) ignoreStart = 2;
      else if (startTime > convertToDateTime('0600')) ignoreStart = 1;

      if      (endTime <= convertToDateTime('0600')) ignoreEnd = 3;
      else if (endTime <= convertToDateTime('1200')) ignoreEnd = 2;
      else if (endTime <= convertToDateTime('1800')) ignoreEnd = 1;
    }
  }

  /* ───────────────── rows & cells ───────────────── */

  // iterate every <tr> inside the table
  for (const [, rowHtml] of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    // cell with class="product_booking"
    const bookingMatch = rowHtml.match(
      /<td[^>]*class=(?:"[^"]*\bproduct_booking\b[^"]*"|'[^']*\bproduct_booking\b[^']*')[^>]*>([\s\S]*?)<\/td>/i
    );
    if (!bookingMatch) continue;

    const productName = textFromHtml(bookingMatch[1]);
    //console.log('Product Booking:', productName);

    // all the period-of-day cells in the same row
    const periods = [...rowHtml.matchAll(
      /<td[^>]*class=(?:"[^"]*\bperiod-of-day\b[^"]*"|'[^']*\bperiod-of-day\b[^']*')[^>]*>([\s\S]*?)<\/td>/gi
    )].map((m) => textFromHtml(m[1]));

    let lowestValue = null;

    for (let i = ignoreStart; i < periods.length - ignoreEnd; i++) {
      const firstLine = periods[i].split('\n')[0];
      const number = parseInt(firstLine, 10);

      if (!Number.isNaN(number) && (lowestValue === null || number < lowestValue)) {
        lowestValue = number;
      }
    }

    if (lowestValue !== null) {
      //console.log('Lowest Period of Day:', lowestValue);
      availabilityData[productName] = lowestValue;
    }
  }

  console.log(availabilityData);
  console.log(Object.keys(availabilityData).length);

  if (Object.keys(availabilityData).length > 0){
    console.log({messageType: "availabilityData", messageData: availabilityData, messageOpp: opp});
    
    chrome.tabs.query({}, function(tabs) {
      if (tabs.length > 0){
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, {messageType: "availabilityData", messageData: availabilityData, messageOpp: opp}, () => {/* swallow error */});
        });
      }
    });



  }
  const thisEnded = Date.now();
  console.log("Availability nonDom took " + (thisEnded - thisStarted) + "ms");
      
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'speak') {
    chrome.tts.speak(msg.text, {
      enqueue: false,         // whether to wait for any ongoing speech to finish
      rate: 1.0,              // 0.1–10
      pitch: 1.0,             // 0–2
      volume: 1.0,            // 0–1
      lang: 'en-GB',          // BCP-47 language tag
      voiceName: ''           // get available voices via chrome.tts.getVoices()
    }, () => {
      if (chrome.runtime.lastError)
        console.error(chrome.runtime.lastError.message);
      else
        sendResponse({spoken: true});
    });
    return true; // indicates we’ll call sendResponse asynchronously
  }
});