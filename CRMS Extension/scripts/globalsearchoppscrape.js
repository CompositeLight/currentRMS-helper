
debugMode = false;

console.log("Global Search Opportunity Scrape is active");

availabilityData = {};
currentUrl = window.location.href;

ignoreStart = 0;
ignoreEnd = 0;

function shouldScrape() {
    return currentUrl.endsWith("scrape");
}

function shouldScrapeQty() {
    return currentUrl.endsWith("scrapeqty");
}


function createBlockOutOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'block-out';
    var text = document.createElement('span');
    text.textContent = 'THIS DUMMY TAB IS FOR BACKGROUND SCRAPING BY CURRENT-RMS HELPER. IF YOU ARE READING THIS AN ERROR HAS OCCURED. SORRY!';
    overlay.appendChild(text);
    if (!debugMode){
      document.body.appendChild(overlay);
    }
}

function convertToDateTime(timeStr) {
    var hours = parseInt(timeStr.substring(0, 2));
    var minutes = parseInt(timeStr.substring(2, 4));
    return hours * 60 + minutes;
}

function extractStartParameter(str) {
    // Split the string at "?"
    var parts = str.split('?');

    // Check if there is a part after "?"
    if (parts.length > 1) {
        // Further split the second part at "&" and return the first element
        return parts[1].split('&')[0];
    }

    // Return empty string if no "?" is found
    return '';
}

function extractEndParameter(str) {
    // Split the string at "&"
    var parts = str.split('&');

    // Check if there are at least two "&" characters
    if (parts.length > 2) {
        // Return the second element in the array, which is between the two "&"s
        return parts[1];
    }

    // Return empty string if not enough "&"s are found
    return '';
}


if (shouldScrape()) {
    console.log("Scraping for inactive Opportunities.");
    createBlockOutOverlay();

    // Find the table with the ID 'availability-grid'
    var contentArea = document.querySelector("div.main-content.opportunities");

    // Get the total number of matches found

    const topList = document.querySelector("ul.menu-select.inline-list")
    const countElement = topList.querySelector("span");
    if (countElement){
      const words = countElement.innerText.split(' ');
      var totalRecords = words[words.length - 1];
    }

    // If there are matches, get the names and status of the first five
    if (totalRecords && totalRecords > 0){

      var theRecords = [];

      var tbodys = contentArea.querySelectorAll("tbody");
      tbodys.forEach((item, i) => {
        if (i < 5){
          var titleElement = item.querySelector(".content-title");
          var stateElement = item.querySelector("span.avatar");
          var statusElement = item.querySelector("td[data-label='Status:']");
          var cobra = stateElement.querySelector("i").className;
          theRecords.push({title: titleElement.innerText, state: stateElement.innerText, oppid: getSectionBeforeLastSlash(titleElement.querySelector("a").href), status: statusElement.innerText.trim(), avatar: cobra});
        }

      });
      console.log(theRecords);
      if (theRecords.length > 0){
        chrome.runtime.sendMessage({messageType: "oppScrapeData", messageData: theRecords, messageCount: totalRecords});
      }
      chrome.runtime.sendMessage({ action: "closeTab" });

    } else {
      chrome.runtime.sendMessage({ action: "closeTab" });
    }


}  else {
    console.log("This will not be scraped (URL is missing 'scrape' suffix).");
}



function getSectionBeforeLastSlash(str) {
  // Find the index of the first question mark and the last slash before it
  const indexOfQuestionMark = str.indexOf("?");
  const indexOfLastSlash = str.lastIndexOf("/", indexOfQuestionMark - 1);

  // Check if both characters exist and the slash is not at the beginning
  if (indexOfQuestionMark !== -1 && indexOfLastSlash !== -1 && indexOfLastSlash > 0) {
    // Extract the substring between them (excluding the characters themselves)
    return str.slice(indexOfLastSlash + 1, indexOfQuestionMark);
  } else {
    // Return an empty string if no valid match is found
    return "";
  }
}
