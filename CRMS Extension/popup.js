

var manifestData = chrome.runtime.getManifest();
document.getElementById("maifest-version").innerHTML = manifestData.version;
getApiTime();
getQuarantineTime();

// Code for the Mark As Prepared setting:
chrome.storage.local.get(["setPrepared"]).then((result) => {
  if (result.setPrepared == "false"){
    document.querySelector(`input[name="markprepared"][value="false"]`).checked = true;
  }
});

document.querySelectorAll('input[name="markprepared"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "setPrepared": this.value }).then(() => {
       console.log("Mark as prepared set");
     });
  });
});

// Event listener for Force Refresh button
var refreshButton = document.getElementById("force-refresh-button");
refreshButton.addEventListener('click', function() {
  refreshButton.disabled = true;
  refreshButton.value = "Refreshing...";
  console.log("Refresh clicked.");
  // Tell service worker to refresh the list
  chrome.runtime.sendMessage("refreshProducts");
});


// message listener to reset the button
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Assuming the message contains some data
    console.log(message);
    if (message.messageType == "alert"){
      alert(message.messageText);
      if (message.messageText.includes("API")){
        refreshButton.disabled = false;
        refreshButton.value = "Force Refresh";
      }
    } else if (message == "apidatawasrefreshed"){
      refreshButton.disabled = false;
      refreshButton.value = "Force Refresh";
      getApiTime();
    } else if (message == "awaitingstock"){
      refreshButton.disabled = true;
      refreshButton.value = "Refreshing stock records...";
    } else if (message == "awaitingproducts"){
      refreshButton.disabled = true;
      refreshButton.value = "Refreshing product records...";
    } else if (message.messageType == "progress"){
      var progressBar = document.getElementById("api-progress-bar");
      progressBar.innerHTML = message.messageProgress+"%";
      progressBar.style.width = message.messageProgress+"%";
      progressBar.classList.add("w3-green");
    } else if (message == "quarantinedatarefreshed"){
      quarantinesRefreshButton.disabled = false;
      quarantinesRefreshButton.value = "Refresh Quarantines";
      getQuarantineTime();
    }


});

// Event listener for Refresh Quarantines button
var quarantinesRefreshButton = document.getElementById("quarantines-refresh-button");
quarantinesRefreshButton.addEventListener('click', function() {
  quarantinesRefreshButton.disabled = true;
  quarantinesRefreshButton.value = "Refreshing...";
  console.log("Refresh Quarantines clicked.");
  // Tell service worker to refresh the list
  chrome.runtime.sendMessage("refreshQuarantines");
});








// Get time of last API update stored in local storage
function getApiTime(){
  chrome.storage.local.get(["apiUpdateTime"]).then((result) => {
    if (result.apiUpdateTime){
      var progressBar = document.getElementById("api-progress-bar");
      progressBar.innerHTML = "Updated: "+result.apiUpdateTime;
      progressBar.style.width = "100%";
      progressBar.classList.remove("w3-green");
      progressBar.classList.remove("w3-white");
    }
  });
}


function getQuarantineTime(){
  chrome.storage.local.get(["quarantineUpdateTime"]).then((result) => {
    if (result.quarantineUpdateTime){
      var progressBar = document.getElementById("quarantine-progress-bar");

      var updateTime = convertMillisToDateTimeString(result.quarantineUpdateTime);


      progressBar.innerHTML = "Updated: "+updateTime;
      progressBar.style.width = "100%";
      progressBar.classList.remove("w3-green");
      progressBar.classList.remove("w3-white");
    }
  });
}

// Code for getting the Allocate by Default radio button to match the stored value
chrome.storage.local.get(["soundsOn"]).then((result) => {
  if (result.soundsOn == "false"){
    document.querySelector(`input[name="soundson"][value="false"]`).checked = true;
  }
});

// Code for watching the Extension sounds radio buttons for changes and updating local storage
document.querySelectorAll('input[name="soundson"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    chrome.storage.local.set({ "soundsOn": this.value }).then(() => {
       console.log("Extension sounds setting was changed");
       chrome.runtime.sendMessage("soundchanged");
     });

  });
});




// Code for getting the Allocate by Default radio button to match the stored value
chrome.storage.local.get(["allocateDefault"]).then((result) => {
  if (result.allocateDefault == "false"){
    document.querySelector(`input[name="allocatedefault"][value="false"]`).checked = true;
  }
});

// Code for watching the Allocate by Default radio buttons for changes and updating local storage
document.querySelectorAll('input[name="allocatedefault"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "allocateDefault": this.value }).then(() => {
       console.log("Allocate View by Default setting was changed");
     });

  });
});



// Code for getting the Prepared radio button to match the stored value
chrome.storage.local.get(["setPrepared"]).then((result) => {
  if (result.setPrepared == "false"){
    document.querySelector(`input[name="markprepared"][value="false"]`).checked = true;
  }
});



// Code for the Announce Inspections setting:
chrome.storage.local.get(["inspectionAlert"]).then((result) => {
  if (result.inspectionAlert){
    var selectedOption = "input[name='inspectionalert'][value='" + result.inspectionAlert + "']";
    document.querySelector(selectedOption).checked = true;
  }
});

document.querySelectorAll('input[name="inspectionalert"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "inspectionAlert": this.value }).then(() => {
       console.log("Inspection alert set");
       chrome.runtime.sendMessage({ inspectionAlerts: this.value });
     });

  });
});

// Code for the Global Check-in setting:
chrome.storage.local.get(["multiGlobal"]).then((result) => {
  if (result.multiGlobal){
    var selectedOption = "input[name='multiglobal'][value='" + result.multiGlobal + "']";
    document.querySelector(selectedOption).checked = true;
  }
});

document.querySelectorAll('input[name="multiglobal"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "multiGlobal": this.value }).then(() => {
       console.log("Global check-in overide set");
       chrome.runtime.sendMessage({ multiGlobal: this.value });
     });

  });
});





// Code for the auto book out nested containers setting:
chrome.storage.local.get(["bookOutContainers"]).then((result) => {
  console.log(result.bookOutContainers);
  if (result.bookOutContainers){
    var selectedOption = "input[name='bookoutcontainers'][value='" + result.bookOutContainers + "']";
    document.querySelector(selectedOption).checked = true;
  }
});

document.querySelectorAll('input[name="bookoutcontainers"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "bookOutContainers": this.value }).then(() => {
       console.log("Auto Book Out nested containers changed");
       console.log(this.value);
       chrome.runtime.sendMessage("bookOutContainers");
     });

  });
});



// Code for the disable detail view delete function setting:
chrome.storage.local.get(["detailDelete"]).then((result) => {
  console.log(result.detailDelete);
  if (result.detailDelete){
  var selectedOption = "input[name='detaildelete'][value='" + result.detailDelete + "']";
    document.querySelector(selectedOption).checked = true;
  }
});

document.querySelectorAll('input[name="detaildelete"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "detailDelete": this.value }).then(() => {
       console.log("Disable Detail View Delete setting changed");
       console.log(this.value);
       chrome.runtime.sendMessage("detailDelete");
     });

  });
});






// Code for the block scan of quartantines setting:
chrome.storage.local.get(["blockQuarantines"]).then((result) => {
  if ("blockQuarantines" in result){
    console.log(result);
    var selectedOption = "input[name='blockquarantines'][value='" + result.blockQuarantines + "']";
    document.querySelector(selectedOption).checked = true;
  }

});

document.querySelectorAll('input[name="blockquarantines"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "blockQuarantines": this.value }).then(() => {
       console.log("Block Quarantines option set");
       chrome.runtime.sendMessage({ blockQuarantines: this.value });
     });

  });
});




// Code for the error timeout setting

var timeOutBox = document.getElementById('error-message-timeout');

chrome.storage.local.get(["errorTimeout"]).then((result) => {
  if ("errorTimeout" in result){
    console.log(result);
    console.log("errorTimeout:" + result.errorTimeout);
    timeOutBox.value = result.errorTimeout;
  }
});


timeOutBox.addEventListener('change', function() {
  console.log(this.value);
  chrome.storage.local.set({ "errorTimeout": this.value }).then(() => {
     console.log("errorTimeout value set");
     chrome.runtime.sendMessage("errortimeoutchanged");
   });

});



// Code for the Show Collapsed Item Totals setting:
chrome.storage.local.get(["nestedTotals"]).then((result) => {
  console.log(result.nestedTotals);
  if (result.nestedTotals){
  var selectedOption = "input[name='nestedtotals'][value='" + result.nestedTotals + "']";
    document.querySelector(selectedOption).checked = true;
  }
});

document.querySelectorAll('input[name="nestedtotals"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);

    chrome.storage.local.set({ "nestedTotals": this.value }).then(() => {
       console.log("Show Collapsed Item Totals setting changed");
       console.log(this.value);
       chrome.runtime.sendMessage("nestedTotals");
     });

  });
});













// API Settings section
// Get the current API details if stored.
chrome.storage.local.get(["api-details"]).then((result) => {
  console.log(result);
  if (result["api-details"].apiKey){
    document.getElementById("api-key-input").value = result["api-details"].apiKey;
  } else {
    console.log("No API key saved in local storage.");
  }
  if (result["api-details"].apiSubdomain){
    document.getElementById("api-subdomain-input").value = result["api-details"].apiSubdomain;
  } else {
    console.log("No API Subdomain saved in local storage.");
  }
});

// no add event listener to save api details button
var setAPIButton = document.getElementById("api-save");
setAPIButton.addEventListener('click', function() {

  var theApiKey = document.getElementById("api-key-input").value;
  var theApiSubdomain = document.getElementById("api-subdomain-input").value;
  var apiDetails = {apiKey: theApiKey, apiSubdomain: theApiSubdomain};

  setAPIButton.disabled = true;
  setAPIButton.value = "Saving...";
  chrome.storage.local.set({ "api-details": apiDetails }).then(() => {
     console.log("API details were saved into local storage.");
     setAPIButton.disabled = false;
     setAPIButton.value = "Save API Details";
   });


});



function convertMillisToDateTimeString(milliseconds) {
    const date = new Date(milliseconds);

    // Padding function to ensure single-digit numbers are preceded by a 0
    const pad = (num) => num.toString().padStart(2, '0');

    // Extracting date and time parts
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Months are zero-indexed
    const year = date.getFullYear().toString().substr(-2); // Getting last two digits of the year

    // Formatting to "hh:mm:ss dd:mm:yy"
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}




if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  // It's dark mode
  document.body.classList.add('dark-mode');
} else {
  console.log("Light mode");
  // It's light mode
  document.body.classList.add('light-mode');
}
