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

  } else if (message.messageType == "availabilityscape"){
      console.log("Availability scrape was requested for "+message.messageText);
      if (iAmScraping){
        console.log("Request denied as a scrape is already in progress");
      } else {
        iAmScraping = true;
        availabilityScrape(message.messageText, message.messageStartDate, message.messageEndDate);
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
                chrome.tabs.sendMessage(tab.id, message);
            });
          }
        });
  } else if (message.messageType === "oppScrapeData") {
        iAmScraping = false;
        // Forward the message to Content Script B
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message);
            });
          }
        });

  } else if (message.messageType === "productQtyData") {
      iAmScraping = false;
      // Forward the message to Content Script
      chrome.tabs.query({}, function(tabs) {
        if (tabs.length > 0){
          tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, message);
          });
        }
      });

  } else if (message == "soundchanged") {
        // Forward the message to Content Script
        console.log("Sound change message received");
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message);
            });
          }
        });
  } else if (message == "errortimeoutchanged") {
        // Forward the message to Content Script
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message);
            });
          }
        });

  } else if (message == "bookOutContainers") {
        // Forward the message to Content Script
        chrome.tabs.query({}, function(tabs) {
          if (tabs.length > 0){
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, message);
            });
          }
        });

  } else {

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




async function retreiveCurrentStockList() {
    var result = await getStock();
    while (stockList.meta.row_count > 0){
      pageNumber ++;
      var result = await getStock();
    }
    console.log("API call complete");
    pageNumber = 1;
    console.log(stockList.stock_levels);
    console.log(stockList.stock_levels[700]);
    console.log(stockList.stock_levels[703]);
    console.log(stockList.stock_levels[725]);
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
  return new Promise(function (resolve, reject) {
    const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'/opportunity_items/?include[]=item&include[]=item_assets&page='+pageNumber+'&per_page=100';
    //const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'?include[opportunity_items]=1&page='+pageNumber+'&per_page=100';
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

async function retreiveOpportunityAssets(opp) {

    var result = await getOpportunityAssets(opp);
    while (stockList.meta.row_count > 0){
      pageNumber ++;
      var result = await getOpportunityAssets(opp);
    }
    console.log("API call complete");
    pageNumber = 1;
    console.log(opportunityAssets);

    /// this bit just for testing
    /// end of test block
}








// API call to retrieve a list of products?

function getProducts(opp){
  return new Promise(function (resolve, reject) {
    const apiUrl = 'https://api.current-rms.com/api/v1/products/?page='+pageNumber+'&per_page=100&include[]=icon&include[]=stock_level&filtermode=active';
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
    // Refresh product list
    var result = await getProducts(opp);
    while (allProducts.meta.row_count > 0){
      pageNumber ++;
      var result = await getProducts(opp);
      chrome.runtime.sendMessage("awaitingproducts");
    }
    console.log("API call for Products complete");
    pageNumber = 1;
    var numberOfProducts = allProducts.products.length;
    console.log("Number of active products: " + numberOfProducts);
    // const objectWithId837 = allProducts.products.find(products => products.id === 148);
    const allProductsString = JSON.stringify(allProducts);
    console.log("Products list was updated")
    //chrome.storage.local.set({ 'allProducts': allProductsString, 'myTest': 1234 }).then(() => {
    //   console.log("Products list was updated");
    // });

     // Refresh stock item list
     var result = await getStock();
     while (allStock.meta.row_count > 0){
       pageNumber ++;
       var result = await getStock();
       chrome.runtime.sendMessage("awaitingstock");
     }
     console.log("API call for Stock complete");
     pageNumber = 1;
     var numberOfStock = allStock.stock_levels.length;
     console.log("Number of  stock items: " + numberOfStock);
     //console.log(allStock.stock_levels);
     //console.log(allStock.meta);


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
      chrome.runtime.sendMessage("apidatawasrefreshed");

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


function sendAlert(message){
  chrome.runtime.sendMessage({messageType: "alert", messageText: message});
}

function sendProgress(percent){
  chrome.runtime.sendMessage({messageType: "progress", messageProgress: percent});
}




// Function to get Quaratine data from the api

// Request quaratine list to prevent scans later
async function retreiveQuarantines() {

    await recallApiDetails();
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
     chrome.runtime.sendMessage("quarantinedatarefreshed");

}



// API Call for quarantines
function quarantineApiCall(){

    return new Promise(function (resolve, reject) {

      //const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'/opportunity_items?page='+pageNumber+'&q[description_present]=1&per_page=100';
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
          quarantineData.quarantines = quarantineData.quarantines.concat(data.quarantines); // merge new page of data into stock_levels
          quarantineData.meta = data.meta; // merge new page of data into meta
          resolve("ok");
        })
        .catch(error => {
          // Handle errors here
          console.error('Error making API request:', error);

        });

    });

}


async function availabilityScrape(opp, start, end){
  await recallApiDetails();
  if (apiSubdomain){
    //console.log(start);
    //console.log(end);
    const timeStart = start.split(' ')[1].replace(':', '');
    const timeEnd = end.split(' ')[1].replace(':', '');

    var scrapeURL = 'https://'+apiSubdomain+'.current-rms.com/availability/opportunity/'+opp+'?'+timeStart+'&'+timeEnd+'&scrape';
    console.log(scrapeURL);
    chrome.tabs.create({
        url: scrapeURL,
        active: false
      }, function(tab) {
      // You can perform actions here after the tab is created
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
      // You can perform actions here after the tab is created
    });
  }
}


async function globalSearchScrape(toSearch){
  await recallApiDetails();
  if (apiSubdomain){
https://amps.current-rms.com/opportunities?utf8=%E2%9C%93&per_page=48&view_id=0&filtermode%5B%5D=inactive
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
