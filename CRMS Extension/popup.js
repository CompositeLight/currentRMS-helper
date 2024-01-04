// Function to be executed when a radio button is clicked
function handleRadioButtonClick(event) {
  // Access the value of the selected radio button
  const selectedValue = event.target.value;


  // Your code logic based on the selected radio button value
  console.log(`Selected value: ${selectedValue}`);
  chrome.runtime.sendMessage({ state: selectedValue });



}

// Add a click event listener to all radio buttons with class "w3-radio"
document.querySelectorAll('.w3-radio').forEach(radioButton => {
  radioButton.addEventListener('click', handleRadioButtonClick);
});


// Retrieve stored values from Chrome Storage API and set the radio button selections
    chrome.storage.sync.get(['viewmode', 'subhires'], function(result) {
      if (result.viewmode) {
        document.querySelector(`input[name="viewmode"][value="${result.viewmode}"]`).checked = true;
        chrome.runtime.sendMessage({ state: result.viewmode });
      }
      if (result.subhires) {
        document.querySelector(`input[name="subhires"][value="${result.subhires}"]`).checked = true;
        chrome.runtime.sendMessage({ state: result.subhires });
      }
    });

    // Add event listeners to store the selected values when radio buttons are changed
    document.querySelectorAll('input[name="viewmode"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        chrome.storage.sync.set({ 'viewmode': this.value });
      });
    });

    document.querySelectorAll('input[name="subhires"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        chrome.storage.sync.set({ 'subhires': this.value });
      });
    });
