console.log("Availability Scrape is active");

availabilityData = {};

function shouldScrape() {
    const currentUrl = window.location.href;
    return currentUrl.endsWith("?scrape");
}

function createBlockOutOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'block-out';
    var text = document.createElement('span');
    text.textContent = 'THIS DUMMY TAB IS FOR BACKGROUND SCRAPING BY CURRENT-RMS HELPER. IF YOU ARE READING THIS AN ERROR HAS OCCURED. SORRY!';
    overlay.appendChild(text);
    document.body.appendChild(overlay);
}


if (shouldScrape()) {
    console.log("Scraping availability.");
    createBlockOutOverlay();
    // Find the table with the ID 'availability-grid'
    var table = document.getElementById('availability-grid');

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
                for (var j = 0; j < periodCells.length; j++) {
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
        if (Object.keys(availabilityData).length > 0){
          chrome.runtime.sendMessage({messageType: "availabilityData", messageData: availabilityData});
        }
        chrome.runtime.sendMessage({ action: "closeTab" });
    } else {
        console.log('Table with ID "availability-grid" not found.');
    }

} else {
    console.log("This will not be scraped (URL is missing '?scrape' suffix).");
}
