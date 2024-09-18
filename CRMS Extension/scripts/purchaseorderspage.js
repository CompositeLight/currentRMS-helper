console.log("CurrentRMS purchaseorderspage.js is active");


// retain text entered into the search box when changing view, group etc.

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
