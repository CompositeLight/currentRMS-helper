console.log("CurrentRMS productpage.js is active");


// Iterate over each table in the document
document.querySelectorAll('table').forEach(function(table) {
    // Attempt to find a thead within the table
    const thead = table.querySelector('thead');
    if (thead) {
        // Normalize innerHTML of the thead for comparison

        // Check if the normalized innerHTML matches the target HTML
        if (thead.innerHTML.includes('Organisation')) {
            console.log('Match found:', table);
            // Perform further actions with the table as needed
        }
    }
});
