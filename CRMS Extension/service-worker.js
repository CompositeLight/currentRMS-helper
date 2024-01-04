


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
    //console.log('Data saved: '+ this.value);

  });
});



// Code for the Announce Inspections setting:
chrome.storage.local.get(["inspectionAlert"]).then((result) => {

  var selectedOption = "input[name='inspectionalert'][value='" + result.inspectionAlert + "']";
  document.querySelector(selectedOption).checked = true;

});

document.querySelectorAll('input[name="inspectionalert"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    console.log(this.value);
    //await chrome.storage.session.set({ prepareSet: this.value });
    chrome.storage.local.set({ "inspectionAlert": this.value }).then(() => {
       console.log("Inspection alert set");
       chrome.runtime.sendMessage({ inpsectionAlerts: this.value });
     });

  });
});

// Code for the Global Check-in setting:
chrome.storage.local.get(["multiGlobal"]).then((result) => {

  var selectedOption = "input[name='multiglobal'][value='" + result.multiGlobal + "']";
  document.querySelector(selectedOption).checked = true;

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
