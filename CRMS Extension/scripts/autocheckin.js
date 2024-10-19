console.log("Auto check-in script is live");

const inputField = document.getElementById('global_check_in_stock_level_asset_number');
const submitButton = document.querySelector('input[type="submit"][value="check-in"]');

let listToCheckIn = [];
let listOfResponses = [];
let readyToProcess = true;

// Get the current page URL
const currentUrl = window.location.href;

// Get the last 8 characters of the URL
const containerRef = currentUrl.slice(-8);
console.log(containerRef);

window.addEventListener("load", function() {
  // Your code here
  console.log("Page is fully loaded, including all resources.");
});


function processItem(){
  if (readyToProcess){
  readyToProcess = false;
  console.log(listToCheckIn.length);
    if (listToCheckIn.length > 0){
      var nextItem = listToCheckIn[0];
      console.log(`Checking-in item: ${nextItem.asset}`);
      inputField.value = nextItem.asset;
      listToCheckIn.shift();
      submitButton.click();
    } else {
      harvestItems();
    }
  }
}

function harvestItems(){
  var checkedInSucessfully = [];
  const assetsIn = document.querySelectorAll("td.optional-01");
  assetsIn.forEach((item) => {
      var thisEntry = item.innerText.trim();
      if (thisEntry != "Rental"){
        const firstSpaceIndex = thisEntry.indexOf(' ');
        // If there's no space, return the entire string
        if (firstSpaceIndex === -1) {
          checkedInSucessfully.push(thisEntry);
        } else {
          thisEntry = thisEntry.substring(0, firstSpaceIndex);
          checkedInSucessfully.push(thisEntry);
        }
      }
  });
  console.log(`We have checked in:`);
  console.log(checkedInSucessfully);


  // Now click the element with the ID "show_complete_modal"
  const completeButton = document.getElementById("show_complete_modal");
  if (completeButton) {
      chrome.runtime.sendMessage({
        messageType: "autocheckinreport",
        containerRef: containerRef,
        assets: checkedInSucessfully
      });
      completeButton.click();
      const finalButton = document.querySelector('button.btn.btn-primary[data-disable-with="wait ..."]');
      if (finalButton) {
          finalButton.click();
          setTimeout(function () {
            chrome.runtime.sendMessage({ action: "closeTab" });
          }, 50);
      }
  }



}


chrome.storage.local.get([containerRef]).then((result) => {
  if (result) {
      console.log(result);
      listToCheckIn = result[containerRef];
      processItem();
  }
});




// function that looks for any changes to the webpage once it has loaded, and triggers responses if these are relevant.
const observer = new MutationObserver((mutations) => {



  mutations.forEach((mutation) => {

    const addedNodes = Array.from(mutation.addedNodes);


    // Code to dismiss the multi-opportunity box if it appears.
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


    const toastMessages = addedNodes.filter((node) => node.classList?.contains("toast")); // filters the ellements that have appeared on the webpage to spot toast messages

    addedNodes.forEach((node) => {

      if (node.classList?.contains("toast-success") || node.classList?.contains("toast-error")){
        if (node.classList?.contains("toast-success")){
          readyToProcess = true;
        } else if (node.classList?.contains("toast-error")){
          readyToProcess = true;
        }
        processItem();

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
