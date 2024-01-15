
// handler for incoming messages from other js code (like content.js or popup.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);
  sendResponse({ message: "Background js received your message" });

  if (message == "refreshProducts"){
    console.log("Product refresh requested");
    retrieveApiData();
  } else {

    (async () => {
      // Sends a message to the service worker and receives a response
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {inpsectionAlerts: message.inpsectionAlerts, multiGlobal: message.multiGlobal}, function(response) {});
      });
    })();
  }
});

////////

var apiKey = '';
var apiSubdomain = '';






let allStock = {stock_levels:[], meta:[]};
let allProducts = {products:[], meta:[]}
let pageNumber = 1;
var opportunityAssets = {opportunity_items:[], meta:[]};

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
