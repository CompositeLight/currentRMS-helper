
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
          var cobraElement = stateElement.querySelector("span");
          var statusElement = item.querySelector("td[data-label='Status:']");
          var cobra = cobraElement.className;
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

    // Section to add quick shortcut to reach Detail View directly by clicking on the progress losenge
    // Add event listener to the document (or a parent element)
    document.addEventListener('click', function(event) {
        // Check if the clicked element or any of its ancestors is a span with class 'app-chip'
        const appChip = event.target.closest('span.app-chip');
        if (appChip) {
            // Find the parent tr element
            const trElement = appChip.closest('tr');
            if (trElement) {
                // Extract the reference number from the tr element's id
                const refNumber = trElement.id.split('-')[1];
                if (refNumber) {
                    // Construct the new URL
                    const baseURL = window.location.origin;
                    const newURL = `${baseURL}/opportunities/${refNumber}?view=d`;
                    // Navigate to the new URL
                    window.location.href = newURL;
                } else {
                    console.log('Reference number not found.');
                }
            } else {
                console.log('No parent tr element found.');
            }
        }
    });


    // Section to retain text entered into the search box when changing view, group etc.

    let dropdownArea = document.querySelector(".inline-list");

    let searchField = document.getElementById('q_subject_or_description_or_number_or_reference_or_member_name_or_tags_name_cont');

    if (dropdownArea && searchField){
        // Get all <a> elements inside the div
        let anchorElements = dropdownArea.querySelectorAll('a');

        // Add event listener to each <a> element
        anchorElements.forEach(function(anchor) {
            anchor.addEventListener('click', function(event) {
                // Prevent the default action of navigating to the link
                event.preventDefault();

                // Modify the href of the link
                let modifiedUrl = this.href + '&q%5Bsubject_or_description_or_number_or_reference_or_member_name_or_tags_name_cont%5D=' + searchField.value;
                // Redirect to the modified URL
                window.location.href = modifiedUrl;
            });
        });
    }

    // section to style the new progress lozenges based on progress status

    // inject the CSS into the page
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.type = 'text/css';
    css.href = chrome.runtime.getURL('style.css'); // Path to the external script
    document.documentElement.appendChild(css);


    document.querySelectorAll("span.app-chip").forEach(styleProgressChip);
  

    function getProgressFromString(text) {
            // Handles ordinary spaces and the thin spaces Current uses around "/"
            const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/u);

            if (!match) return null;

            const current = Number(match[1].replaceAll(",", ""));
            const total = Number(match[2].replaceAll(",", ""));

            if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
                return null;
            }

            // Clamp between 0 and 100
            return Math.max(0, Math.min(100, (current / total) * 100));
        }

        function styleProgressChip(element) {
        const label = element.querySelector(".app-chip__label");
        const surface = element.querySelector(".app-chip__surface");

        if (!label || !surface) return;

        const text = label.textContent.trim().toLowerCase();

        let mode;

        if (text.includes("prepared")) {
            mode = "prepared";
        } else if (text.includes("booked out")) {
            mode = "booked-out";
        } else if (text.includes("checked in")) {
            mode = "checked-in";
        } else {
            return;
        }

        const progress = getProgressFromString(text);
        if (progress === null) return;

        element.classList.add("helper-progress-chip");
        element.dataset.progressMode = mode;
        element.style.setProperty("--helper-progress", `${progress}%`);

        // Add progress fill if it doesn't already exist
        let fill = surface.querySelector(".helper-progress-fill");

        if (!fill) {
            fill = document.createElement("span");
            fill.className = "helper-progress-fill";
            surface.prepend(fill);
        }
    }
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
