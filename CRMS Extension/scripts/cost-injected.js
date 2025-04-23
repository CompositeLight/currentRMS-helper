
(function() {
    console.log('Cost-injected script is running.');
    window.onload = function() {
    setTimeout(() => {
    
    // scrape the opportunity ID from the page URL if there is one
    let opportunityID = (function() {
        const currentUrl = window.location.href;
        // Use a regular expression to match the opportunity ID in the URL
        const match = currentUrl.match(/\/opportunities\/(\d+)/);
        // Check if there is a match and return the opportunity ID (group 1 in the regex)
        return match ? match[1] : null;
    })();
  

    if (typeof $ !== 'undefined') {
        console.log('jQuery is available.');
        if ($.fn && $.fn.editable) {
            console.log('$.fn.editable is available.');


            // SECTION TO LOG AJAX REQUESTS
            const originalAjax = $.ajax;
            $.ajax = function(settings) {
                console.log('AJAX request:', settings);
                return originalAjax.apply(this, arguments);
            };


            // SECTION TO ADD INLINE EDIT FUNCTIONALITY TO SERVICE TD ELEMENTS
            // Select the target TD elements
            const theItemsTable = $('#opportunity_item_costs_body');
            const newEditableTDs = theItemsTable.find('td.days-column:not(.editable)');

            // Add the "editable" class to visually indicate these elements are editable
            newEditableTDs.addClass('helper-editable');

            // Add click event listeners to make the elements editable
            newEditableTDs.on('click', function () {
                const $td = $(this);

                // Prevent multiple input fields from being added
                if ($td.find('input').length > 0) {
                    return;
                }

                // Get the current value to check if it has changed
                let originalValue = $td[0].innerHTML;
                console.log('Original value:', originalValue);
                let currentValue = $td.attr('data-costed');

      
             
                // Replace the content with an input field
                const $input = $(`<input type="text" class="editable-input no-suffix"><span></span>`)
                    .val(currentValue)
                    .appendTo($td.empty())
                    .focus()
                    .select();

                // Handle when the user finishes editing
                $input.on('blur', function () {
                    const newValue = $input.val().trim();

                    // check if the new value is different from the original value
                    if (newValue == currentValue) {
                        $td[0].innerHTML = originalValue; // Revert to original value
                        return;
                    }

                    // Update the TD with the new value
                    $td.text(newValue);

                    // Send the updated value to the server
                    updateValueOnServer($td, newValue);
                });

                // Handle pressing Enter to finish editing
                $input.on('keydown', function (e) {
                    if (e.key === 'Enter') {
                        $input.blur(); // Trigger the blur event
                    }
                });
            });

            // Function to send the updated value to the server
            function updateValueOnServer($td, newValue) {
                const dataId = $td.closest('[data-id]').attr('data-id');
            
                if (!dataId) {
                    console.error('Error: data-id is missing for the row.');
                    return;
                }
            
                const requestData = {
                    update_type: 'inline',
                    opportunity_cost: {
                        id: dataId,
                        chargeable_days: newValue
                    }
                };
            
                console.log('Sending PATCH request to server:', {
                    //url: `/opportunity_items/${dataId}`,
                    url: `/opportunities/${opportunityID}/update_opportunity_cost`,
                    data: requestData
                });

                $td.html('<img alt="Spinner 16" height="16" width="16" src="/images/spinner-16.gif" />').attr("data-editing", "true");
            
                $.ajax({
                    url: `/opportunities/${opportunityID}/update_opportunity_cost`,
                    type: 'PATCH',
                    data: requestData,
                    beforeSend: function(xhr, settings) {
                        // Set the request headers
                        if (typeof settings.dataType === 'undefined') {
                            xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                        }
                    },
                    success: function(response) {
                        console.log('Value updated successfully:', response);
                        $td.attr('data-costed', newValue);
                        $td.removeAttr('data-editing');
                    },
                    error: function(xhr, status, error) {
                        console.error('Error updating value:', {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            responseText: xhr.responseText
                        });
            
                        // Revert the value on error
                        const originalValue = $td.attr('data-original-value');
                        $td.text(originalValue).removeAttr('data-editing');
                    }
                });
            }


            // SECTION TO ADD INLINE EDIT FUNCTIONALITY TO SERVICE COST TYPE SELECTS

    
            // event listener for the select elements changing cost types
            $('#opportunity_item_costs_body')
            .on('change', 'select.cost-type-select', function () {
                const $theSelect = $(this);
                const newValue     = $theSelect.val();
                const originalVal  = $theSelect.attr('data-cost-type');

                console.log('Original:', originalVal, 'New:', newValue);
                if (newValue === originalVal) return;

                updateCostTypeOnServer($theSelect, newValue);
            });

            // Function to send the updated value to the server
            function updateCostTypeOnServer($theSelect, $newValue) {
                const dataId = $theSelect.closest('[data-id]').attr('data-id');
            
                if (!dataId) {
                    console.error('Error: data-id is missing for the row.');
                    return;
                }

                let newType;

                if ($newValue == "day"){
                    newType = 1;
                } else if ($newValue == "hour"){
                    newType = 2;
                } else if ($newValue == "dist"){
                    newType = 3;
                } else if ($newValue == "flat"){
                    newType = 4;
                }



            
                const requestData = {
                    update_type: 'inline',
                    opportunity_cost: {
                        id: dataId,
                        service_rate_type: newType
                    }
                };
            
                console.log('Sending PATCH request to server:', {
                   
                    url: `/opportunities/${opportunityID}/update_opportunity_cost`,
                    data: requestData
                });
                overlay_spinner();
                $theSelect.prop('disabled', true);
                $.ajax({
                    url: `/opportunities/${opportunityID}/update_opportunity_cost`,
                    type: 'PATCH',
                    data: requestData,
                    beforeSend: function(xhr, settings) {
                        // Set the request headers
                        if (typeof settings.dataType === 'undefined') {
                            xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                        }
                    },
                    success: function(response) {
                        console.log('Value updated successfully:', response);
                        $theSelect.removeAttr('data-original-value').removeAttr('data-editing');
                        $theSelect.prop('disabled', false);
                        remove_overlay_spinner();
                    },
                    error: function(xhr, status, error) {
                        console.error('Error updating value:', {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            responseText: xhr.responseText
                        });
            
                        $theSelect.prop('disabled', false);
                        remove_overlay_spinner();
                    }
                });
            }





        } else {
            console.warn('$.fn.editable is not available.');
        }
    } else {
        console.warn('jQuery is not available.');
    }
}, 1000); // Delay execution by 1 second
}
})();


function overlay_spinner() {
    div = $('<div id="spinner_modal" class="modal fade in" tabindex="-1" role="dialog"><div style="position: absolute; left: 50%; top: 50%; margin-left: -40px; margin-top: -40px;"><svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="80px" height="80px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve"><path fill="#666" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z" transform="rotate(290 25 25)"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"></animateTransform></path></svg></div></div>'),
    $("body").append(div),
    $("body").append('<div class="modal-backdrop fade in"></div>'),
    $(document.body).addClass("modal-open"),
    div.show()
}





function remove_overlay_spinner() {
    $("#spinner_modal").remove(),
    $(".modal-backdrop").remove(),
    $(document.body).removeClass("modal-open")
}

