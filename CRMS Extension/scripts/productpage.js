console.log("CurrentRMS productpage.js is active");


// Create an array to collect opportunities listed as using this product
var oppsList = [];
apiKey = "";
apiSubdomain = "";

// scrape the product ID from the page URL if there is one
let productId = (function() {
  const currentUrl = window.location.href;
  // Use a regular expression to match the opportunity ID in the URL
  const match = currentUrl.match(/\/products\/(\d+)/);
    // Check if there is a match and return the opportunity ID (group 1 in the regex)
  return match ? match[1] : null;
})();

console.log(productId);


// Iterate over each table in the document
document.querySelectorAll('table').forEach(function(table) {
    // Attempt to find a thead within the table
    const thead = table.querySelector('thead');
    if (thead) {
        // Normalize innerHTML of the thead for comparison

        // Check if the normalized innerHTML matches the target HTML
        if (thead.innerHTML.includes('Organisation')) {

            // find the table itself
            var theTable = thead.closest('table');

            // Find all th elements
            var thElements = theTable.querySelectorAll('th');

            // Loop through each th element
            thElements.forEach(function(th) {
                // Check if the text content of the th element is "Status"
                if (th.textContent.trim() === 'Status') {
                    // Create a new th element with the text "Qty"
                    var qtyTh = document.createElement('th');
                    qtyTh.textContent = 'Qty';

                    // Insert the new th element after the found th element
                    th.parentNode.insertBefore(qtyTh, th.nextSibling);
                }
            });

            // Select all tbody elements
            var tbodyElements = theTable.querySelectorAll('tbody');



            // Loop through each tbody element
            tbodyElements.forEach(function(tbody) {
                // Find the td element with data-label="Status:"
                var statusTd = tbody.querySelector('td[data-label="Status:"]');

                // Check if statusTd exists and has a parent tr
                if (statusTd && statusTd.parentNode) {

                    // Get the first tr element after the statusTd
                    var firstTrAfterStatus = statusTd.parentNode;

                    // Check if firstTrAfterStatus is a tr element
                    if (firstTrAfterStatus && firstTrAfterStatus.tagName.toLowerCase() === 'tr') {

                        // Create a new td element
                        var newTd = document.createElement('td');
                        // Set the content of the new td to "?"
                        newTd.textContent = " ";

                        // Insert the new td element as the first child of the firstTrAfterStatus
                        firstTrAfterStatus.insertBefore(newTd, statusTd.nextSibling);
                    }
                }

                var titleTd = tbody.querySelector('td.content-title.essential');
                if (titleTd && titleTd.parentNode) {

                  // Get the first tr element after the statusTd
                  var firstTrBeforeStatus = titleTd.parentNode;

                  // Check if firstTrAfterStatus is a tr element
                  if (firstTrBeforeStatus && firstTrBeforeStatus.tagName.toLowerCase() === 'tr') {

                      // Create a new td element
                      var newTd = document.createElement('td');
                      // Set the content of the new td to "?"
                      newTd.classList.add("product-quantity");
                      newTd.textContent = "?";

                      // Insert the new td element as the first child of the firstTrAfterStatus
                      firstTrBeforeStatus.insertBefore(newTd, titleTd.nextSibling);
                  }

                  var bookingOppId = firstTrBeforeStatus.id;
                  newTd.id = (bookingOppId.substring(3));
                  oppsList.push(bookingOppId.substring(3));



                }

            });






        }
    }
});

//console.log(oppsList);
//chrome.runtime.sendMessage({messageType: "qtyInUseScrape", messageProduct:productId, messageOpp:468});


// Function to send message and wait for a specific response
function sendMessageAndWaitForResponse(productId, oppValue) {
  return new Promise((resolve, reject) => {
    // Listener for response messages
    function responseListener(message) {
      if (message.messageType === "productQtyData") {
        // When the desired messageType is received, remove listener and resolve the promise
        chrome.runtime.onMessage.removeListener(responseListener);
        resolve(message);
      }
    }

    // Add listener for response messages
    chrome.runtime.onMessage.addListener(responseListener);

    // Send message with current opp value
    chrome.runtime.sendMessage({
      messageType: "qtyInUseScrape",
      messageProduct: productId,
      messageOpp: oppValue
    });

    // Optional: Reject promise if no response within a timeout
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(responseListener);
      reject(new Error("Response timeout"));
    }, 10000); // 10 seconds timeout for example
  });
}

// Iterate through each item in the array, sending messages and waiting for responses
async function processOppsList(productId) {
  for (const opp of oppsList) {
    try {
      const response = await sendMessageAndWaitForResponse(productId, opp);
      console.log("Response received for opp:", opp, "Response:", response);
      document.getElementById(opp).innerText = response.messageData;
      // Process the response if needed
    } catch (error) {
      console.error("Error processing opp", opp, error);
      // Handle error, decide whether to continue or break
    }
  }
}

// run immediately
processProduct();

// check if we have API details before attempting to get info
async function processProduct(){
  await recallApiDetails();
  if (apiKey && apiSubdomain){
    processOppsList(productId);
  } else {
    console.log("API info was not found, so information could not be loaded");
  }
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
