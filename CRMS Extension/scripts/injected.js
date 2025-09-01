
// injected.js (page context)
window.addEventListener('message', event => {
    // only accept messages from your own content script
    if (event.source !== window || event.data.source !== 'MY_EXTENSION') return;

    if (event.data.type === 'TEST') {
        console.log("TEST TEST TEST")
    } else if (event.data.type === 'add-details') {
        addEditableDays();
    }
});


function addEditableDays() {
    
        setTimeout(() => {
    
        if (typeof $ !== 'undefined') {
            console.log('jQuery is available.');
            if ($.fn && $.fn.editable) {
          
    
    
                
    
    
                // SECTION TO ADD INLINE EDIT FUNCTIONALITY TO SERVICE TD ELEMENTS
                // Select the target TD elements
                const theItemsTable = $('#opportunity_items_body');
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
                    let originalValue = $td.text().trim();
                    let currentValue = $td.text().trim();
    
                    // get any suffix that is on the end of numbers of the value
                    const suffix = currentValue.match(/[^0-9]+$/);
                    if (suffix) {
                        // remove the suffix from the current value
                        currentValue = currentValue.replace(suffix[0], '');
                    }
                 
                    // Replace the content with an input field
                    const $input = $(`<input type="text" class="editable-input ${suffix ? `with-suffix` : 'no-suffix'}"><span>${suffix ? suffix[0] : ''}</span>`)
                        .val(currentValue)
                        .appendTo($td.empty())
                        .focus()
                        .select();
    
                    // Handle when the user finishes editing
                    $input.on('blur', function () {
                        const newValue = $input.val().trim();
    
                        // check if the new value is different from the original value
                        if (newValue === currentValue) {
                            $td.text(originalValue); // Revert to original value
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
                    const fieldName = 'chargeable_days';
                
                    if (!dataId) {
                        console.error('Error: data-id is missing for the row.');
                        return;
                    }
                
                    const requestData = {
                        update_type: 'inline',
                        [`opportunity_item[${fieldName}]`]: newValue
                    };
                
                    console.log('Sending PATCH request to server:', {
                        url: `/opportunity_items/${dataId}`,
                        data: requestData
                    });
    
                    $td.html('<img alt="Spinner 16" height="16" width="16" src="/images/spinner-16.gif" />').attr("data-editing", "true");
                
                    $.ajax({
                        url: `/opportunity_items/${dataId}`,
                        type: 'PATCH',
                        data: requestData,
                        beforeSend: function(xhr, settings) {
                            // Set the request headers
                            if (typeof settings.dataType === 'undefined') {
                                xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                            }
                        },
                        success: function(response) {
                            $td.removeAttr('data-editing');
                            // Update the original value attribute
                            $td.attr('data-original-value', newValue);
                            $td.html(newValue);
                            console.log('Value updated successfully');
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
    
                
                // SECTION TO DELETE ITEM DESCRIPTIONS WHEN YOU CLEAR THE DESCRIPTION
    
               
                // event listener for the description fields
    
                $('#opportunity_items_body')
                .on('change', 'textarea', function () {
                    const $theDescription = $(this);
                    // if the description is empty, remove the description
    
                    if ($theDescription.val().trim() === '') {
                        // log the parent of the textarea
                        const $theParent = $theDescription.closest('li');
                        // get the data-id of the parent
                        const dataId = $theParent.attr('data-id');
                        if (dataId) {
                            // send a request to the server to delete the description
                            ajaxRemoveDescription($theDescription);
                        }
                    }
    
                });
    
    
                // event listener for changes to input type text elements
    
                $('#opportunity_items_body')
                .on('change', 'input[type="text"]', function () {
    
                    const $theDescription = $(this);
        
                    console.log("GRoup description channge triggered");
    
                    // find the closest parent div
                    const $theParent = $theDescription.closest('div');
    
                    // if the parent div doesnt have the class opportunity-item-description, return
                    if (!$theParent.hasClass('opportunity-item-description')) {
                        return;
                    }
    
                    // if the description is empty, remove the description
                    if ($theDescription.val().trim() === '') {
                        // log the parent of the textarea
                        const $theParent = $theDescription.closest('li');
                        // get the data-id of the parent
                        const dataId = $theParent.attr('data-id');
                        if (dataId) {
                            // send a request to the server to delete the description
                            ajaxRemoveDescription($theDescription);
                        }
                    }
    
                });
    
    
    
    
    
                // Function to tell the server to delete the description
                function ajaxRemoveDescription($theDescription) {
                    const dataId = $($theDescription).closest('[data-id]').attr('data-id');
                
                    if (!dataId) {
                        console.error('Error: data-id is missing for the row.');
                        return;
                    }
                
                    const requestData = {
                        [`opportunity_item[description]`]: null
                    };
                
                    console.log('Sending PATCH request to server:', {
                        url: `/opportunity_items/${dataId}`,
                        data: requestData
                    });
    
                    $theDescription.prop('disabled', true);
                    overlay_spinner();
    
                    const $theParent = $theDescription.closest('li');
                
                    $.ajax({
                        url: `/opportunity_items/${dataId}`,
                        type: 'PATCH',
                        data: requestData,
                        beforeSend: function(xhr, settings) {
                            // Set the request headers
                            if (typeof settings.dataType === 'undefined') {
                                xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                            }
                        },
                        success: function(response) {
                            console.log('Value updated successfully');
    
                            // add the class delete-me to the description div
                            $theDescription.addClass('delete-me');
    
                            // Remove the description text area from the DOM (requires a debounce)
                            let removeTimeout;
                            const removeDescription = () => {
                                clearTimeout(removeTimeout);
                                removeTimeout = setTimeout(() => {
                                    
    
                                    const $descriptionDiv = $theParent.find('div.opportunity-item-description');
    
                                    if ($descriptionDiv.length) {
                                        $descriptionDiv.remove();
                                        console.log('Description div removed after debounce.');
                                    }
    
                                    // find the closest parent div
                                    const $theContainerDiv = $theDescription.closest('div');
    
                                     // if the parent div doesnt have the class opportunity-item-description, return
                                    if ($theContainerDiv.hasClass('opportunity-item-description')) {
                                        $theContainerDiv.remove();
                                    }
                                
    
                                }, 200);
                            };
    
                            remove_overlay_spinner();
                        },
                        error: function(xhr, status, error) {
                            console.error('Error updating value:', {
                                status: xhr.status,
                                statusText: xhr.statusText,
                                responseText: xhr.responseText
                            });
                
                            // Re-enable on error
                            $theDescription.prop('disabled', false);
                            remove_overlay_spinner();
                        }
                    });
                }
    
    
    
    
    
    
    
                // SECTION TO ADD ITEM DESCRIPTIONS VIA DROPDOWN MENU
                // event listener for the add description menu options
    
                $('#opportunity_items_body')
                .on('click', 'a.add-description-button', function (event) {
                    event.preventDefault(); // Prevent the default anchor behavior
                    const $theButton = $(this);
    
                    // get the data-id of the button
                    const $itemType = $theButton.attr('data-type');
                    
                    const parentRow = $theButton.closest('li[data-id]');
                    console.log('parentRow', parentRow);
    
                    // find the first div.dd-content in the parent row
                    const $ddContentDiv = parentRow.find('div.dd-content').first();
                    if ($ddContentDiv.length) {
                        // check if div editable opportunity-item-description exists
                        const existingDescriptionDiv = $ddContentDiv.find('div.opportunity-item-description');
                        if (existingDescriptionDiv.length) {
                            // focus the existing description div
                            existingDescriptionDiv.click();
                            return;
                        }
                    }
                    const theIdToAddTo = $theButton.attr('data-id');
                    console.log('theIdToAddTo', theIdToAddTo);
                    // send a request to the server to create the description
                    ajaxNewDescription(theIdToAddTo, parentRow, $itemType);
                    
    
                });
    
                // Function to tell the server to add the description
                function ajaxNewDescription($theItem, $parentRow, $itemType) {
    
                    console.log("item type is ", $itemType);
    
                    overlay_spinner();
          
                    const requestData = {
                        [`opportunity_item[description]`]: "Click to edit"
                    };
                
                    console.log('Sending PATCH request to server:', {
                        url: `/opportunity_items/${$theItem}`,
                        data: requestData
                    });
                
                    $.ajax({
                        url: `/opportunity_items/${$theItem}`,
                        type: 'PATCH',
                        data: requestData,
                        beforeSend: function(xhr, settings) {
                            // Set the request headers
                            if (typeof settings.dataType === 'undefined') {
                                xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                            }
                        },
                        success: function(response) {
                            console.log('Value updated successfully');
                            
                            // Add the description to the DOM
                            // Create a new div element
                            const descriptionDiv = document.createElement('div');
                            descriptionDiv.className = 'opportunity-item-description temp-description';
                            descriptionDiv.setAttribute('data-value', 'Click to edit');
                            descriptionDiv.innerHTML = `<em>Click to edit</em>`;
    
                            let ddContentDiv;
    
    
                            if ($itemType == "group"){
                                // find the first td with class dd-name
                                ddContentDiv = $parentRow.find('td.dd-name').first();
                                // add dd-content to the div to correct padding for group description
                                $(descriptionDiv).addClass('dd-content');
                            } else {
                                // Find the div.dd-content in the parent row
                                ddContentDiv = $parentRow.find('div.dd-content').first();
                            }
                            
                            if (ddContentDiv.length) {
                                // Check if a descriptionDiv already exists
                                const existingDescriptionDiv = ddContentDiv.find('.opportunity-item-description.temp-description');
                                if (existingDescriptionDiv.length) {
                                    // Replace the existing descriptionDiv
                                    existingDescriptionDiv.replaceWith(descriptionDiv);
                                } else {
                                    // Append the new div to the dd-content div
                                    ddContentDiv.append(descriptionDiv);
                                }
                                // click after delay to make it editable
                                setTimeout(() => {
                                    descriptionDiv.click(); // Trigger the click event to make it editable
                                }
                                , 100);
                                
                            } else {
                                console.error('div.dd-content not found in the parent row.');
                            }
    
                            remove_overlay_spinner();
            
                        },
                        error: function(xhr, status, error) {
                            console.error('Error updating value:', {
                                status: xhr.status,
                                statusText: xhr.statusText,
                                responseText: xhr.responseText
                            });
                
                            // Action on error
                            remove_overlay_spinner();
                            
                        }
                    });
                }
    
    
    
                // SECTION TO MAKE TEMP DESCRIPTIONS EDITABLE
    
                $('#opportunity_items_body')
                .on('click', 'div.temp-description', function () {
                    const $theDescription = $(this);
                    const originalValue = $theDescription.attr('data-value') || '';
            
                    // Create a form with a textarea
                    const $form = $('<form></form>');
                    const $textarea = $('<textarea name="value" style="height: 40px; width: 100%; resize: none;"></textarea>').val(originalValue)
                    .on('keydown', function(e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          $(this).blur();
                        }
                    });
                        
            
                    // Append the textarea to the form and replace the div content
                    $form.append($textarea);
                    $theDescription.empty().append($form);
            
                    // Focus and select the textarea
                    setTimeout(() => {
                        $textarea.focus().select();
                    }, 0);
            
                    // Handle form submission or blur event
                    $textarea.on('blur', function () {
                        const newValue = $textarea.val().trim();
                        const $div = $theDescription;
                        
                        // rebuild the DIV innerHTML in one go:
                        $div
                            .empty()                        
                            .attr('data-value', newValue)        
                            .append(`<em>${newValue}</em>`)
                            .addClass('temp-description');
                        
                        if (newValue !== originalValue) {
                            updateTempDescription($div, newValue);
                        }
                    });
            
                    // Prevent form submission on Enter key
                    $form.on('submit', function (e) {
                        e.preventDefault();
                        $textarea.blur(); // Trigger blur to save the value
                    });
            
                    // Function to send the updated value to the server
                    function updateTempDescription($theDescription, $newValue) {
                        const dataId = $($theDescription).closest('[data-id]').attr('data-id');
            
                        if (!dataId) {
                            console.error('Error: data-id is missing for the row.');
                            return;
                        }
            
                        const requestData = {
                            [`opportunity_item[description]`]: $newValue
                        };
            
                        console.log('Sending PATCH request to server:', {
                            url: `/opportunity_items/${dataId}`,
                            data: requestData
                        });
            
                        $theDescription.prop('disabled', true);
                        overlay_spinner();
            
                        $.ajax({
                            url: `/opportunity_items/${dataId}`,
                            type: 'PATCH',
                            data: requestData,
                            beforeSend: function (xhr, settings) {
                                // Set the request headers
                                if (typeof settings.dataType === 'undefined') {
                                    xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                                }
                            },
                            success: function (response) {
                                console.log('Value updated successfully');
                                $theDescription.prop('disabled', false);
                                if ($newValue == "") {
                                    // remove the description div
                                    $theDescription.remove();
                                }
                                remove_overlay_spinner();
                                
                            },
                            error: function (xhr, status, error) {
                                console.error('Error updating value:', {
                                    status: xhr.status,
                                    statusText: xhr.statusText,
                                    error: error
                                });
                                $theDescription.prop('disabled', false);
                                remove_overlay_spinner();
                            }
                        });
                    }
                });
    
    
                // section to make warehouse descriptions editable
                $('#opportunity_items_body')
                .on('click', 'a.add-warehouse-button, i.warehouse-edit', function (event) {
                    event.preventDefault(); // Prevent the default anchor behavior
                    const $theButton = $(this);
                    
                    const $theParent = $theButton.closest('li[data-id]');
                    const dataId = $theParent.attr('data-id');
    
                    // look for a warehouse-tooltiptext span in the parent row
                    const $theTooltipText = $theParent.find('span.warehouse-tooltiptext');
    
                    let existingWarehouseNote = 'New warehouse note';
    
                    if ($theTooltipText){
                        existingWarehouseNote =  $theTooltipText.attr('data-warehouse');
                    }
    
                    const theIdToAddTo = $theButton.attr('data-id');
                    console.log('theIdToAddTo', theIdToAddTo);
    
    
                    // Create the modal input
    
                    // <div aria-hidden="false" aria-labelledby="globalModalLabel" class="modal fade in" id="global_modal" role="dialog" tabindex="-1" style="display: block;"><div class="modal-dialog set-description-modal">
                        
                    const newModalElement = document.createElement('div');
                    newModalElement.className = 'modal fade in';
                    newModalElement.id = 'warehouse-note-modal';
                    // set aria-hidden to false
                    newModalElement.setAttribute('aria-hidden', 'false');
                    newModalElement.innerHTML = `
                        
                        <div class="modal-dialog set-description-modal">
                        <div class="modal-content">
                        <div class="modal-header clearfix">
                        <button class="helper-close">×</button>
                        <h4 class="modal-title">
                        <i class="icn-cobra-paste3"></i>
                        Warehouse Note
                        </h4>
                        </div>
                        <div class="form-page form-modal">
                        <form id="set_warehouse_note">
                        <div class="modal-body">
                        <div class="row form-block">
                        <div class="col-md-2 col-sm-2"></div>
                        <div class="col-md-8 col-sm-8 form-area">
                        <div class="row">
                        <div class="col-md-12 col-sm-12">
                        <label for="warehouse_note">Warehouse Note</label>
                        <textarea name="cost_description" id="warehouse-note-input" rows="5"></textarea>
                        </div>
                        </div>
                        </div>
                        </div>
                        </div>
                        <div class="modal-footer">
                        <div class="button-row">
                        <button class="btn btn-primary" id="save-warehouse-note">>
                        Add note
                        </button>
                        <button class="btn btn-default" id="dismiss-warehouse-modal">Cancel</button>
                        </div>
                        </div>
                        </form>
    
                        </div>
                        </div>
                        </div>`;
    
                    const newModalBackdrop = document.createElement('div');
                    
                    newModalBackdrop.className = 'modal-backdrop fade in';
    
                    // Append the modal to the body
                    document.body.appendChild(newModalElement);
    
                    // Append the backdrop to the body
                    document.body.appendChild(newModalBackdrop);
                    
                    // Show the modal
                    newModalElement.style.display = 'block';
    
                    // focus on the text area
                    const $theTextArea = $('#warehouse-note-input');
                    $theTextArea.val(existingWarehouseNote);
                    $theTextArea.focus();
                    $theTextArea.select();
    
                    // Handle the save button click
                    $('#save-warehouse-note').on('click', function (event) {
                        event.preventDefault(); // Prevent the default anchor behavior
                        const $theTextArea = $('#warehouse-note-input');
                        const warehouseNote = $theTextArea.val().trim();
                        if (warehouseNote === existingWarehouseNote){
                            // remove the modal
                            newModalElement.remove();
                            newModalBackdrop.remove();
                            return;
                        }
                        // send a request to the server to create the description
                        ajaxEditWarehouseNote(dataId, warehouseNote, $theTooltipText);
                    });
                    // Handle the dismiss button click
                    $('#dismiss-warehouse-modal').on('click', function (event) {
                        event.preventDefault(); // Prevent the default anchor behavior
                        newModalElement.remove();
                        newModalBackdrop.remove();
                    }
                    );
                    // Handle the close button click
                    $('.helper-close').on('click', function (event) {
                        event.preventDefault(); // Prevent the default anchor behavior
                        newModalElement.remove();
                        newModalBackdrop.remove();
                    }
                    );
    
    
    
                    // Function to send the updated note to the server
                    function ajaxEditWarehouseNote(theId, theWarehouseNote, noteField) {
                       
                        overlay_spinner();
                        const requestData = {
                            [`opportunity_item[warehouse_notes]`]: theWarehouseNote
                        };
            
                        console.log('Sending PATCH request to server:', {
                            url: `/opportunity_items/${theId}`,
                            data: requestData
                        });
        
            
                        $.ajax({
                            url: `/opportunity_items/${theId}`,
                            type: 'PATCH',
                            data: requestData,
                            beforeSend: function (xhr, settings) {
                                // Set the request headers
                                if (typeof settings.dataType === 'undefined') {
                                    xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                                }
                            },
                            success: function (response) {
                                console.log('Value updated successfully');
                                remove_overlay_spinner();
                                // remove the modal
    
                                newModalElement.remove();
                                newModalBackdrop.remove();
    
                                if (theWarehouseNote == ""){
                                    // find the closest span with the class warehouse-tooltip
                                    let warehouseSpan = noteField.closest('span.warehouse-tooltip');
                                    // remove the span
                                    warehouseSpan.remove();
                                } else {
                                    // set the data-warehouse attribute on the span
                                    noteField.attr('data-warehouse', theWarehouseNote);
                                    // set the text of the span to the new value
                                    noteField.html(`<u>WAREHOUSE NOTE:</u><br>${theWarehouseNote}`);
                                }
                            },
                            error: function (xhr, status, error) {
                                console.error('Error updating value:', {
                                    status: xhr.status,
                                    statusText: xhr.statusText,
                                    error: error
                                });
                                remove_overlay_spinner();
                             
                            }
                        });
                    }
    
                });
    
                function Sn(){
                    console.log ('function Sn blocked');
                }
    
    
                // FUNCTION TO GET THE IMAGES FOR PRODUCT POPUPS
                
                $('#opportunity_item_assets_body')
                .on('click', 'span.product-tip', function (event) {
                    // get the data-product-link of the span
                    const $theButton = $(this);
                    const productLink = $theButton.attr('data-product-link');
                    if (productLink && productLink !== 0){
                        $.ajax({
                            url: `/products/${productLink}`,
                            type: 'GET',
                            dataType: 'json',
                            data: {                
                                },
                              
                            beforeSend: function(xhr, settings) {
                              // match the page’s headers so you get JSON
                              xhr.setRequestHeader('Accept', 'application/json');
                            },
                            success: function(response) {
                                document.getElementById('modal-image').src = response.product.icon.url;
                            },
                            error: function(xhr, status, error) {
                              console.error('Error fetching opportunity:', status, error);
                            }
                          });
                    }
                
                
                });
    
    
                // AJAX TEST FUNCTION
                 // Function to tell the server to add the description
                function ajaxTest() {
                    console.log("AJAX TEST FUNCTION TRIGGERED");
                    let activityId = 128;
                    const testStartTime = performance.now();
                    // Build an absolute URL at the site root:
                    const url = new URL(`/activities/${activityId}`, window.location.origin).toString();

                    $.ajax({
                        //url: `/opportunities/${opportunityID}`,
                        //url: `/opportunities/${opportunityID}?include=[item_assets]`,
                        //url: `/opportunities/${opportunityID}/opportunity_items?q[sub_rent_eq]=true`,
                        //url: `/opportunities/${opportunityID}`,
                        //opportunities/:opportunity_id/opportunity_items/:opportunity_item_id/opportunity_item_assets
                        //url: `/availability/opportunity/${opportunityID}`,

                        url: url,
                        type: 'PUT',
                        dataType: 'json',
                        data: {
                                "activity": {
                                    "completed_at": "2025-09-01T14:35:00Z",
                                    "completed": true
                                }
                        },
                          
                        
                        beforeSend: function(xhr, settings) {
                          // match the page’s headers so you get JSON
                          xhr.setRequestHeader('Accept', 'application/json');
                        },
                        success: function(response) {
                            console.log('!!!!');
                            console.log('!!!!');
                            console.log('!!!!');
                            console.log('!!!!');
                            console.log('AJAX test payload:', response);
    
                            const testEndTime = performance.now();
                            console.log(`Test AJAX call completed in ${testEndTime - testStartTime}ms`);
                          
                        },
                        error: function(xhr, status, error) {
                          console.error('Error:', status, error);
                        }
                      });
                }
    
                //ajaxTest();
    
    
    
    
    
            } else {
                console.log('$.fn.editable is not available.');
            }
        } else {
            console.log('jQuery is not available.');
        }
    }, 500); // Delay execution by 0.5 second

}





(function() {
    window.onload = function() {
        addEditableDays();

        // SECTION TO LOG AJAX REQUESTS
        const originalAjax = $.ajax;
        $.ajax = function(settings) {
            console.log('AJAX request:', settings);
            return originalAjax.apply(this, arguments);
        };



        // FUNCTION TO CHECK ACCESSORIES
        window.addEventListener('message', (event) => {
            
            if (event.source !== window) return;
            if (!event.data || event.data.source !== 'extension') return;
            
            //console.log('injected.js got →', event.data.payload);

    
            if (event.data.payload.messageType == 'updateAccessories'){
                console.log('Check Accessories called:', Date.now()); // Add before postMessage
                var oppData = event.data.payload.oppData;
                oppData.opportunity_items.sort((a, b) => a.path.localeCompare(b.path));
            
                const allStock = JSON.parse(event.data.payload.allStock);
                const allProducts = event.data.payload.allProducts;

                console.log(allStock);
                console.log(oppData);
                console.log(allProducts);

                accessoryCheck(allStock, allProducts, oppData);
            } if (event.data.payload.messageType == 'completeActivity'){
                let activityId = event.data.payload.activityId;
                completeActivity(activityId);
            } else if (event.data.payload.messageType == 'AjaxTest'){
                ajaxTest();
            }

        });


        // FUNCTION TO MARK AN ACTIVITY AS COMPLETE
        function completeActivity(activityId) {
            console.log("AJAX COMPLETE ACTIVITY FUNCTION TRIGGERED");
            
            const testStartTime = performance.now();
            // Build an absolute URL at the site root:
            const url = new URL(`/activities/${activityId}`, window.location.origin).toString();

            const isoUTC = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

            $.ajax({

                url: url,
                type: 'PUT',
                dataType: 'json',
                data: {
                        "activity": {
                            "completed_at": isoUTC,
                            "completed": true
                        }
                },
                    
                beforeSend: function(xhr, settings) {

                    xhr.setRequestHeader('Accept', 'application/json');
                },
                success: function() {

                    console.log("Activity marked as complete");
                    const testEndTime = performance.now();
                    console.log(`AJAX call completed in ${testEndTime - testStartTime}ms`);

                    window.postMessage(
                        { source: 'injected', payload: {activityId: activityId, messageType: "activityCompleted"} },
                    );
                    
                },
                error: function(xhr, status, error) {
                    console.error('Error:', status, error);
                }
                });
        }





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




async function accessoryCheck(allStock, allProducts, oppData) {

    let itemsWithAccessoryIssues = [];
    var hasIssue;

    const itemsWithAccessories = new Set();

    for (const item of oppData.opportunity_items) {
        if (item.accessory_mode !== null){
            itemsWithAccessories.add(item.parent_opportunity_item_id);
        }
    }

    console.log('itemsWithAccessories', itemsWithAccessories);

    for (const item of oppData.opportunity_items) {
        hasIssue = false;
        if (itemsWithAccessories.has(item.id)) {
            console.log('item', item.name);
            const product = allProducts.products.find(p => p.id === item.item_id);
            if (product && product.accessories.length > 0) {

                let accessoriesItshouldHave = [];
                for (const accessory of product.accessories) {
                    accessoriesItshouldHave.push({
                        accessory_inclusion_type: accessory.inclusion_type,
                        name: accessory.related_name,
                        quantity: parseInt(accessory.quantity * item.quantity),
                        weight: parseFloat(accessory.item.weight),
                        price: parseFloat(accessory.item.rental_rate.price),
                        item_id: accessory.item.id,
                        sort_order: accessory.sort_order,
                        zero_priced: accessory.zero_priced
                    });
                }


                let accessoriesOfThisItem = [];
                let accessoriesItHas = [];

                // find all the accessories of this item (that have a parent_opportunity_item_id matching this item)
                for (const thisItem of oppData.opportunity_items) {
                    if (thisItem.parent_opportunity_item_id == item.id && thisItem.accessory_mode !== null){
                        accessoriesOfThisItem.push(thisItem);
                    }
                }
                

                let n = 0;
                for (const accessory of accessoriesOfThisItem) {
            
                    let thisZeroPrice = false;
                    if (parseFloat(accessory.price) == 0){
                        thisZeroPrice = true;
                    }

                    accessoriesItHas.push({
                        accessory_inclusion_type: accessory.accessory_inclusion_type,
                        name: accessory.name,
                        quantity: parseFloat(accessory.quantity),
                        weight: parseFloat(accessory.weight),
                        price: parseFloat(accessory.price),
                        item_id: accessory.item_id,
                        sort_order: n,
                        zero_priced: thisZeroPrice
                    });

                    n++;
                }

                console.log('accessoriesItshouldHave', accessoriesItshouldHave);
                console.log('accessoriesItHas', accessoriesItHas);

                // compare the two arrays and find the differences
                var missingAccessories = [];
                var extraAccessories = [];
                var extraManualAccessories = [];
                var differentQuantityAccessories = [];
                var differentPriceAccessories = [];
                var differentWeightAccessories = [];
                var differentSortOrderAccessories = [];
                var differentInclusionTypeAccessories = [];
                var differentZeroPriceAccessories = [];
                var differentNameAccessories = [];

                
               
                for (const accessory of accessoriesItshouldHave) {
                    const foundAccessory = accessoriesItHas.find(a => a.item_id === accessory.item_id);
                    if (!foundAccessory) {
                        if (accessory.accessory_inclusion_type !== 2){
                            missingAccessories.push(accessory);
                            hasIssue = true;
                        }
                    } else {
                        if (foundAccessory.quantity !== accessory.quantity) {
                            if (accessory.accessory_inclusion_type !== 2){
                                differentQuantityAccessories.push({
                                    name: accessory.name,
                                    expected: accessory.quantity,
                                    actual: foundAccessory.quantity,
                                    item_id: accessory.item_id
                                });
                                hasIssue = true;
                            }
                        }
                        if (foundAccessory.price !== accessory.price) {
                            differentPriceAccessories.push({
                                name: accessory.name,
                                expected: accessory.price,
                                actual: foundAccessory.price,
                                item_id: accessory.item_id
                            });
                            if (foundAccessory.price > 0 && accessory.zero_priced == false){
                                hasIssue = true;
                            }
                        }
                        if (foundAccessory.weight !== accessory.weight) {
                            differentWeightAccessories.push({
                                name: accessory.name,
                                expected: accessory.weight,
                                actual: foundAccessory.weight,
                                item_id: accessory.item_id
                            });
                            hasIssue = true;
                        }
                        if (foundAccessory.sort_order !== accessory.sort_order) {
                            differentSortOrderAccessories.push({
                                name: accessory.name,
                                expected: accessory.sort_order,
                                actual: foundAccessory.sort_order,
                                item_id: accessory.item_id
                            });
                            hasIssue = true;
                        }
                        if (foundAccessory.accessory_inclusion_type !== accessory.accessory_inclusion_type) {
                            differentInclusionTypeAccessories.push({
                                name: accessory.name,
                                expected: accessory.accessory_inclusion_type,
                                actual: foundAccessory.accessory_inclusion_type,
                                item_id: accessory.item_id
                            });
                            hasIssue = true;
                        }
                        if (foundAccessory.zero_priced !== accessory.zero_priced) {

                            if (foundAccessory.price > 0 && accessory.zero_priced == true){
                                differentZeroPriceAccessories.push({
                                    name: accessory.name,
                                    expected: accessory.zero_priced,
                                    actual: foundAccessory.zero_priced,
                                    item_id: accessory.item_id
                                });
                                
                                hasIssue = true;
                            }
                        }
                        if (foundAccessory.name !== accessory.name) {
                            differentNameAccessories.push({
                                name: accessory.name,
                                expected: accessory.name,
                                actual: foundAccessory.name,
                                item_id: accessory.item_id
                            });
                            hasIssue = true;
                        }

                    }
                }
                for (const accessory of accessoriesItHas) {
                    const foundAccessory = accessoriesItshouldHave.find(a => a.item_id === accessory.item_id);
                    if (!foundAccessory && accessory.accessory_inclusion_type == 99) {
                        extraManualAccessories.push(accessory);
                    } else if (!foundAccessory) {
                        extraAccessories.push(accessory);
                        hasIssue = true;
                    }
                }
                if (missingAccessories.length > 0) {
                    console.log('missingAccessories', missingAccessories);
                }
                if (extraAccessories.length > 0) {
                    console.log('extraAccessories', extraAccessories);
                }
                if (extraManualAccessories.length > 0) {
                    console.log('extraManualAccessories', extraManualAccessories);
                }
                if (differentQuantityAccessories.length > 0) {
                    console.log('differentQuantityAccessories', differentQuantityAccessories);
                }
                if (differentPriceAccessories.length > 0) {
                    console.log('differentPriceAccessories', differentPriceAccessories);
                }
                if (differentWeightAccessories.length > 0) {
                    console.log('differentWeightAccessories', differentWeightAccessories);
                }
                if (differentSortOrderAccessories.length > 0) {
                    console.log('differentSortOrderAccessories', differentSortOrderAccessories);
                }
                if (differentInclusionTypeAccessories.length > 0) {
                    console.log('differentInclusionTypeAccessories', differentInclusionTypeAccessories);
                }
                if (differentZeroPriceAccessories.length > 0) {
                    console.log('differentZeroPriceAccessories', differentZeroPriceAccessories);
                }
                if (differentNameAccessories.length > 0) {
                    console.log('differentNameAccessories', differentNameAccessories);
                }

            }
        }

        if (hasIssue) {
            console.log(`Item ${item.id} (${item.name}) has accessory issues`);
            itemsWithAccessoryIssues.push({
                item_id: item.id,
                name: item.name,
                missingAccessories: missingAccessories,
                extraAccessories: extraAccessories,
                extraManualAccessories: extraManualAccessories,
                differentQuantityAccessories: differentQuantityAccessories,
                differentPriceAccessories: differentPriceAccessories,
                differentWeightAccessories: differentWeightAccessories,
                differentSortOrderAccessories: differentSortOrderAccessories,
                differentInclusionTypeAccessories: differentInclusionTypeAccessories,
                differentZeroPriceAccessories: differentZeroPriceAccessories,
                differentNameAccessories: differentNameAccessories,
                item: item
            });

        }


    }
    console.log('itemsWithAccessoryIssues', itemsWithAccessoryIssues);
    if (itemsWithAccessoryIssues.length > 0) {

        let alertText = `There are ${itemsWithAccessoryIssues.length} item(s) with accessory issues:\n`;

        itemsWithAccessoryIssues.forEach(item => {
            alertText += `<ul class="accessory-check"><li>${item.name}</li><ul class="accessory-item">`;
            item.differentInclusionTypeAccessories.forEach(accessory => {
                alertText += `<li>${accessory.name} (Inclusion Type: ${accessory.expected} -> ${accessory.actual})</li>`;
            }
            );
            item.missingAccessories.forEach(accessory => {
                alertText += `<li>Missing: ${accessory.name}\n(Expected: ${accessory.quantity})</li>`;
            }
            );
            item.extraAccessories.forEach(accessory => {
                alertText += `<li>Extra: ${accessory.name}\n(Actual: ${accessory.actual})</li>`;
            }
            );
            item.extraManualAccessories.forEach(accessory => {
                alertText += `<li>Extra Manual: ${accessory.name}\n(Actual: ${accessory.actual})</li>`;
            }
            );
            item.differentQuantityAccessories.forEach(accessory => {
                alertText += `<li>Different Quantity: ${accessory.name}\n(Expected: ${accessory.expected}, Actual: ${accessory.actual})</li>`;
            }
            );
            item.differentPriceAccessories.forEach(accessory => {
                alertText += `<li>Different Price: ${accessory.name}\n(Expected: ${accessory.expected}, Actual: ${accessory.actual})</li>`;
            }
            );
            item.differentWeightAccessories.forEach(accessory => {
                alertText += `<li>Different Weight: ${accessory.name}\n(Expected: ${accessory.expected}, Actual: ${accessory.actual})</li>`;
            }
            );
            item.differentSortOrderAccessories.forEach(accessory => {
                alertText += `<li>Different Sort Order: ${accessory.name}\n(Expected: ${accessory.expected}, Actual: ${accessory.actual})</li>`;
            }
            );
            item.differentZeroPriceAccessories.forEach(accessory => {
                alertText += `<li>Different Zero Price: ${accessory.name}\n(Expected: ${accessory.expected}, Actual: ${accessory.actual})</li>`;
            }
            );
            item.differentNameAccessories.forEach(accessory => {
                alertText += `<li>Different Name: ${accessory.name}\n(Expected: ${accessory.expected}, Actual: ${accessory.actual})</li>`;
            }
            );
            alertText += `</ul></ul>`;

        });

        // Create the modal input
        const newModalElement = document.createElement('div');
        newModalElement.className = 'modal fade in';
        newModalElement.id = 'accessory-check-modal';
        // set aria-hidden to false
        newModalElement.setAttribute('aria-hidden', 'false');
        newModalElement.innerHTML = `
            
            <div class="modal-dialog set-description-modal">
            <div class="modal-content">
            <div class="modal-header clearfix">
            <button class="helper-close" id="accessory-check-close">×</button>
            <h4 class="modal-title">
            <i class="icn-cobra-paste3"></i>
            Accessory Check Results
            </h4>
            </div>
            <div class="form-page form-modal">
            <form id="set_warehouse_note">
            <div class="modal-body">
            <div class="row form-block">
            <div class="col-md-2 col-sm-2"></div>
            <div class="col-md-8 col-sm-8 form-area">
            <div class="row">
            <div class="col-md-12 col-sm-12">
            ${alertText}
            </div>
            </div>
            </div>
            </div>
            </div>
            <div class="modal-footer">
            <div class="button-row">
            <button class="btn btn-default" id="dismiss-accessory-check-modal">Cancel</button>
            </div>
            </div>
            </form>

            </div>
            </div>
            </div>`;

        const newModalBackdrop = document.createElement('div');
        
        newModalBackdrop.className = 'modal-backdrop fade in';

        // Append the modal to the body
        document.body.appendChild(newModalElement);

        // Append the backdrop to the body
        document.body.appendChild(newModalBackdrop);
        
        // Show the modal
        newModalElement.style.display = 'block';

        // focus on the text area

        // Handle the dismiss button click
        $('#dismiss-accessory-check-modal').on('click', function (event) {
            event.preventDefault(); // Prevent the default anchor behavior
            newModalElement.remove();
            newModalBackdrop.remove();
        }
        );
        // Handle the close button click
        $('#accessory-check-close').on('click', function (event) {
            event.preventDefault(); // Prevent the default anchor behavior
            newModalElement.remove();
            newModalBackdrop.remove();
        }
        );

















    } else {
        alert (`No accessory issues detected`);
    }
}