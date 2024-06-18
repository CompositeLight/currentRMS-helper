console.log("CurrentRMS Helper Activated - additem.js");

const textButton = document.getElementById("opportunity_item_item_type_textitem");
const productButton = document.getElementById("opportunity_item_item_type_item");

const productInput = document.getElementById("opportunity_item_item_name");
const textInput = document.getElementById("opportunity_item_name");

textButton.addEventListener('click', function(event) {
  textInput.value = productInput.value;
});
