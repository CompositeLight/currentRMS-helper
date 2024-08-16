
debugMode = false;

console.log("Availability Scrape is active");

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
    console.log("Scraping availability.");
    createBlockOutOverlay();

    // Find the table with the ID 'availability-grid'
    var table = document.getElementById('availability-grid');

    // check if we're working to a period less than a full day
    var timeDivide = 1;
    if (table.classList.contains("period2")){
      timeDivide = 2;
    } else if (table.classList.contains("period4")){
      timeDivide = 4;
    }

    if (timeDivide > 1){
      // get start and end time from the url
      var startString = extractStartParameter(currentUrl);
      var endString = extractEndParameter(currentUrl);
      var startTime = convertToDateTime(startString);
      var endTime = convertToDateTime(endString);

      console.log("Start string: " + startString);
      console.log("End string: " + endString);

      console.log("Start Time: " + startTime);
      console.log("End Time: " + endTime);



      console.log("timeDivide: " + timeDivide);


      if (timeDivide == 2){
        if (startTime > convertToDateTime("1200")){
          ignoreStart = 1;
        }
        if (endTime <= convertToDateTime("1200")){
          ignoreEnd = 1;
        }


      } else if (timeDivide == 4){
        if (startTime > convertToDateTime("1800")){
          ignoreStart = 3;
        } else if (startTime > convertToDateTime("1200")){
          ignoreStart = 2;
        } else if  (startTime > convertToDateTime("0600")){
          ignoreStart = 1;
        }

        if (endTime <= convertToDateTime("0600")){
          ignoreEnd = 3;
        } else if (endTime <= convertToDateTime("1200")){
          ignoreEnd = 2;
        } else if  (endTime <= convertToDateTime("1800")){
          ignoreEnd = 1;
        }

      }
      console.log("ignoreStart: " + ignoreStart);
      console.log("ignoreEnd: " + ignoreEnd);
    } // end if time divide > 1


    // Check if the table exists
    if (table) {
        // Find all <td> elements within the table
        var cells = table.getElementsByTagName('td');

        // Iterate through each cell
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            // Check if the cell has the class 'product_booking'
            if (cell.classList.contains('product_booking')) {
                // Log the trimmed innerText of the 'product_booking' cell
                var productName = cell.innerText.trim()
                console.log('Product Booking:', productName);

                // Get the parent row of the current cell
                var row = cell.parentElement;

                // Find all 'period-of-day' cells in the same row
                var periodCells = row.getElementsByClassName('period-of-day');
                var lowestValue = null;

                // Iterate through each 'period-of-day' cell to find the lowest value
                for (var j = ignoreStart; j < (periodCells.length - ignoreEnd); j++) {
                    var periodText = periodCells[j].innerText.trim();
                    var firstNumber = periodText.split('\n')[0]; // Get the first line (the number before any brackets)

                    // Convert the extracted number to an integer
                    var number = parseInt(firstNumber, 10);

                    // Update the lowest value if necessary
                    if (lowestValue === null || number < lowestValue) {
                        lowestValue = number;
                    }
                }

                // Log the lowest value if found
                if (lowestValue !== null) {
                    console.log('Lowest Period of Day:', lowestValue);
                    availabilityData[productName] = lowestValue;
                }
            }
        }
        console.log(availabilityData);
        console.log(Object.keys(availabilityData).length);

        // grab the opp number to pass back for warehouse notes
        var thisOpp = document.getElementById("opportunity_id").value;


        if (Object.keys(availabilityData).length > 0){
          chrome.runtime.sendMessage({messageType: "availabilityData", messageData: availabilityData, messageOpp: thisOpp});
        }
        chrome.runtime.sendMessage({ action: "closeTab" });
    } else {
        console.log('Table with ID "availability-grid" not found.');
    }

} else if (shouldScrapeQty()) {
    var prodString = extractStartParameter(currentUrl);
    console.log("Requested scrape of qty for item: " + prodString);

    // Get all <tr> elements in the document
    var trElements = document.querySelectorAll('tr');

    var searchString = "loadProductBookings("+prodString+");"

    // Loop through each <tr> element
    trElements.forEach(function(tr) {
        // Check if the onclick attribute of the current <tr> matches the desired value
        if (tr.getAttribute('onclick') === searchString) {

            // Find the first <td> element with the class "quantity"
            var quantityTd = tr.querySelector('td.quantity');

            // Check if the quantityTd exists
            if (quantityTd) {
                // Get the inner text of the quantityTd
                var quantityText = quantityTd.textContent.trim();
                console.log(quantityText);
                chrome.runtime.sendMessage({messageType: "productQtyData", messageData: quantityText});
            } else {
                console.log("No <td> element with class 'quantity' found.");
            }

            // end the forEach loop
            return;
        }
    });
    chrome.runtime.sendMessage({ action: "closeTab" });


} else {
    console.log("This will not be scraped (URL is missing 'scrape' suffix).");
}
