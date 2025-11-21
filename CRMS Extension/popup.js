

var manifestData = chrome.runtime.getManifest();
document.getElementById("maifest-version").innerHTML = manifestData.version;
getApiTime();
getQuarantineTime();



// Event listener for Force Refresh button
var refreshButton = document.getElementById("force-refresh-button");
refreshButton.addEventListener('click', function() {
  refreshButton.disabled = true;
  refreshButton.value = "Refreshing...";
  console.log("Refresh clicked.");
  // Tell service worker to refresh the list
  chrome.runtime.sendMessage("refreshProducts");
});

// Event listener for Open Settings button
var settingsButton = document.getElementById("open-settings");
settingsButton.addEventListener('click', function() {
  chrome.runtime.sendMessage("fullSettings");
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








// API Settings section
// Get the current API details if stored.
chrome.storage.local.get(["api-details"]).then((result) => {
  console.log(result);
  if (result["api-details"].apiKey){
    //document.getElementById("api-key-input").value = result["api-details"].apiKey;
  } else {
    console.log("No API key saved in local storage.");
  }
  if (result["api-details"].apiSubdomain){
    //document.getElementById("api-subdomain-input").value = result["api-details"].apiSubdomain;
  } else {
    console.log("No API Subdomain saved in local storage.");
  }
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
