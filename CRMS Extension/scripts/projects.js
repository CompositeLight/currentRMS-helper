console.log("Projects.js is active");

let totalCharge = 0;

// find every TD with data-label of "Charge:"
const chargeElements = document.querySelectorAll('td[data-label="Charge:"]');

// Loop through each, parse the text content such as "£ 31,238" or "$ 31,238" into a number and add to totalCharge
chargeElements.forEach(element => {
  const chargeText = element.textContent.trim();
  const chargeNumber = parseFloat(chargeText.replace(/[^0-9.-]+/g, ''));
  if (!isNaN(chargeNumber)) {
    totalCharge += chargeNumber;
  }
});

console.log(`Total Charge: ${totalCharge}`);




// find all i elements with class "icn-cobra-draft"
const draftIcons = document.querySelectorAll('i.icn-cobra-draft');

// find all i elements with class "icn-cobra-quote"
const quoteIcons = document.querySelectorAll('i.icn-cobra-quote');

// find all i elements with class "icn-cobra-enquiry"
const enquiryIcons = document.querySelectorAll('i.icn-cobra-enquiry');


if (draftIcons.length > 0 && quoteIcons.length > 0 && enquiryIcons.length > 0) {

    // find the UL element with classes stats-box three-col
    const statsBox = document.querySelector('ul.stats-box.three-col');

    let symbol = "";
    // check if statsBox exists
    if (statsBox) {

        const stat = statsBox.querySelector('div.stat');
        if (stat) {
            // Get the innerHTML content
            var innerHTML = stat.innerHTML;
        
            // Use a regular expression to extract the currency symbol
            var matches = innerHTML.match(/^[^\d]+/);
        
            // Check if a match is found
            if (matches && matches.length > 0) {
            symbol = matches[0];
            }
        }

        // create a new div element
        const totalChargeDiv = document.createElement('div');

        // add classes stat-container total-charge
        totalChargeDiv.className = 'stat-container total-charge quoted-total';

        // set the innerHTML to display the total charge
        totalChargeDiv.innerHTML = `
            <div class="stat">${symbol}${totalCharge.toLocaleString()}</div>
            <div class="title">Draft / Quote / Order Total</div>
        `;

    // add the new div to the start of the statsBox
        statsBox.insertAdjacentElement('afterbegin', totalChargeDiv);
    }

}