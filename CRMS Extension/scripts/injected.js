

(function() {
    window.onload = function() {
    setTimeout(() => {

    if (typeof $ !== 'undefined') {
        console.log('jQuery is available.');
        if ($.fn && $.fn.editable) {
      


            // SECTION TO LOG AJAX REQUESTS
            const originalAjax = $.ajax;
            $.ajax = function(settings) {
                console.log('AJAX request:', settings);
                return originalAjax.apply(this, arguments);
            };


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
                        console.log('Value updated successfully:', response);
                        $td.removeAttr('data-original-value').removeAttr('data-editing');
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
                        console.log('Value updated successfully:', response);

                        // add the class delete-me to the description div
                        $theDescription.addClass('delete-me');

                        // Remove the description text area from the DOM (requires a debounce)
                        let removeTimeout;
                        const removeDescription = () => {
                            clearTimeout(removeTimeout);
                            removeTimeout = setTimeout(() => {
                                const $descriptionDiv = document.querySelector('div.opportunity-item-description');
                                if ($descriptionDiv) {
                                    $descriptionDiv.remove();
                                    console.log('Description div removed after debounce.');
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
                
                const parentRow = $theButton.closest('li[data-id]');
                console.log('parentRow', parentRow);

                const theIdToAddTo = $theButton.attr('data-id');
                console.log('theIdToAddTo', theIdToAddTo);
                 // send a request to the server to create the description
                ajaxNewDescription(theIdToAddTo, parentRow);

            });

            // Function to tell the server to add the description
            function ajaxNewDescription($theItem, $parentRow) {

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
                        console.log('Value updated successfully:', response);
                        
                        // Add the description to the DOM
                        // Create a new div element
                        const descriptionDiv = document.createElement('div');
                        descriptionDiv.className = 'opportunity-item-description temp-description';
                        descriptionDiv.setAttribute('data-value', 'Click to edit');
                        descriptionDiv.innerHTML = `<em>Click to edit</em>`;

                        // Find the div.dd-content in the parent row
                        const ddContentDiv = $parentRow.find('div.dd-content');
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
                            console.log('Value updated successfully:', response);
                            $theDescription.prop('disabled', false);
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

                let warehouseNoteEdit = prompt("Warehouse note", existingWarehouseNote);

                // if user clicks cancel, exit
                if (warehouseNoteEdit === null) {
                    return;
                }

                if (warehouseNoteEdit == existingWarehouseNote){
                    return;
                } else {
                    // send a request to the server to create the description
                    ajaxEditWarehouseNote(dataId, warehouseNoteEdit, $theTooltipText);
                }
                 


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
                            console.log('Value updated successfully:', response);
                            remove_overlay_spinner();

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


            // AJAX TEST FUNCTION
             // Function to tell the server to add the description
             function ajaxTest() {
                let opportunityID = 375;
                const testStartTime = performance.now();
                $.ajax({
                    //url: `/opportunities/${opportunityID}`,
                    //url: `/opportunities/${opportunityID}?include=[item_assets]`,
                    //url: `/opportunities/${opportunityID}/opportunity_items?q[sub_rent_eq]=true`,
                    //url: `/opportunities/${opportunityID}`,
                    //opportunities/:opportunity_id/opportunity_items/:opportunity_item_id/opportunity_item_assets
                    url: `/availability/opportunity/${opportunityID}`,
                    type: 'GET',
                    dataType: 'json',
                    data: {
                            //'id': opportunityID,
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
                      console.error('Error fetching opportunity:', status, error);
                    }
                  });
            }

            //ajaxTest();





        } else {
            console.warn('$.fn.editable is not available.');
        }
    } else {
        console.warn('jQuery is not available.');
    }
}, 500); // Delay execution by 0.5 second
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


