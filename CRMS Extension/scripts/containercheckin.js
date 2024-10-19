console.log("Container check-in script is live");

// Find the submit button with type "submit" and value "scan"
const submitButton = document.querySelector('input[type="submit"][value="Scan"]');

let containerRef;

// Check if this user can access Global Check-in
const globalOption = document.querySelector('a[href="/global_check_in"]');


// Check if the submit button was found and has a parent div
if (globalOption && submitButton && submitButton.parentElement.tagName === 'DIV') {
    // Get the parent div
    const parentDiv = submitButton.parentElement;

    // Create a new div with the specified classes
    const newDiv = document.createElement('div');
    newDiv.className = 'col-md-2 col-sm-2';
    newDiv.innerHTML = `<input type="button" id="check-in-button" name="check-in" value="Global Check-in" class="btn btn-primary global-check-button">`

    // Insert the new div directly after the parent div
    parentDiv.insertAdjacentElement('afterend', newDiv);

    // Select the previous sibling element
    const previousElement = newDiv.previousElementSibling;
    previousElement.classList.remove("col-md-2", "col-sm-2")
    previousElement.classList.add("col-md-1", "col-sm-1")


    // Add event listener for the new button
    document.getElementById('check-in-button').addEventListener('click', function(event) {
      checkincontainercomponents();
    });

} else {
    console.log('Submit button with value "scan" not found or it does not have a parent div.');
}


function checkincontainercomponents(){

    let componentsList = [];

    var componentTable = document.getElementById('serialised_components_body');
    var componentRows = componentTable.querySelectorAll("tr");

    componentRows.forEach((item) => {

      var essentialTDs = item.querySelectorAll("td.essential");
      var rowAsset = essentialTDs[0].innerText;
      var rowProduct = essentialTDs[1].innerText;
      var rowQuantity = essentialTDs[2].innerText;
      var itemObj = {asset: rowAsset, product: rowProduct, quantity: rowQuantity * 1};
      if (rowAsset != "Bulk Stock"){
        componentsList.push(itemObj);
      }

    });

    var containerAsset = document.querySelector("div.subtitle").innerText;

    const h1Element = document.querySelector('h1.subject-title');

    // Extract the text content of the <h1> without the subtitle
    const containerProduct = Array.from(h1Element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent.trim())
    .join('');

    var countainerObj = {asset: containerAsset, product: containerProduct, quantity: 1};
    componentsList.push(countainerObj);
    //componentsList.push(containerAsset);

    console.log("Components list:");
    console.log(componentsList);

    containerRef = Math.floor(10000000 + Math.random() * 90000000);

    chrome.storage.local.set({ [containerRef]: componentsList }).then(() => {
       console.log("container check-in list was saved");
       // Send message with current opp value
       chrome.runtime.sendMessage({
         messageType: "containercheckin",
         containerRef: containerRef
       });
       document.getElementById('check-in-button').value = "Please wait...";
       document.getElementById('check-in-button').disabled = true;

     });

}


// Messages from the extension service worker to trigger changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received from service-worker:");

  if (message.messageType == "autocheckinreport"){
      console.log(message);
      if (message.containerRef == containerRef){
        var checkedAssets = message.assets;
        var componentTable = document.getElementById('serialised_components_body');
        var componentRows = componentTable.querySelectorAll("tr");

        componentRows.forEach((item, i) => {
          var essentialTDs = item.querySelectorAll("td.essential");
          var rowAsset = essentialTDs[0].innerText;
          if (checkedAssets.includes(rowAsset)){
            var markerSpace = item.querySelector("td.optional-01");
            if (markerSpace.innerHTML.includes("checked")){
              // already marked
            } else {
              markerSpace.innerHTML += `
                <div class="label label-success checked">
                <i class="icn-cobra-checkmark-2" title="OK"></i>
                </div>`;
            }
          }



        });
        var containerAsset = document.querySelector("div.subtitle").innerText;
        if (checkedAssets.includes(containerAsset)){
          var containerSpace = document.querySelector("div.subtitle");
          if (containerSpace.innerHTML.includes("checked")){
            // already marked
          } else {
          containerSpace.innerHTML += `
            <div class="label label-success checked">
            <i class="icn-cobra-checkmark-2" title="OK"></i>
            </div>`;
          }
        }

        document.getElementById('check-in-button').value = "Global Check-in";
        document.getElementById('check-in-button').disabled = false;

        chrome.storage.local.remove(containerRef, () => {
          if (chrome.runtime.lastError) {
            console.error('Error removing item:', chrome.runtime.lastError);
          } else {
            console.log("container check-in list was removed");
          }
});


      }
  };

});
