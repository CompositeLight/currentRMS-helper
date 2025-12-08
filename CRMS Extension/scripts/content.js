// NOTE: This code deals with two types of messages. ToastMessages are the type that appear via websocket message to the page. This includes things like sucess messages when an item is scanned. The other type I have called toastPosts, which appear following a php page refresh. This applies to certain scenarios, like reverting the status on an item. FYI Current calls the dialog boxes in the top corner "toast messages", which is where the toast thing comes from.
console.log("CurrentRMS Helper Activated.");



// Inject an external script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/injected.js'); // Path to the external script
document.documentElement.appendChild(script);
script.remove();

// inject the CSS into the page
const css = document.createElement('link');
css.rel = 'stylesheet';
css.type = 'text/css';
css.href = chrome.runtime.getURL('style.css'); // Path to the external script
document.documentElement.appendChild(css);
css.remove();



// MAKE THIS VARIABLE true IF YOU WANT TO MUTE THE SUCCESS / FAIL SOUNDS FROM THE EXTENSION //
// NOTE: THIS METHID IS NOW DEPRECIATED. USE THE SOUNDS SETTING IN THE EXTENSION POP-UP INSTEAD //
muteExtensionSounds = false;

// errorTimeout default value. This is the period after which a toast error message will vanish
errorTimeout = 0;

assetsOnTheJob = [];
assetsBookedOut = [];
assetsGlobalScanned = [];
assetsInContainer = [];

notesHidden = false;
preparedHidden = false;
bookedOutHidden = false;
checkedInHidden = false;
bulkOnly = false;
subhiresHidden = false;
nonsubsHidden = false;
nonShortsHidden = false;
weightUnit = "kgs"; // default to kgs for weight unit
inspectionAlerts = "";
multiGlobal = true;
bookOutContainers = false;
detailDelete = true;
nestedTotals = true;
containerScan = false;
scanningContainer = "";
freeScanReset = false;
var currencyPrefix; 

wrongItem = "";

containers = [];
containerList = [];

let containerisationData;

let containerUnderEdit;

bookedOutWeight = 0;
subhireWeight = 0;
stockWeight = 0;


detailViewMode = "functions";
allProducts = {};
allStock = {};
containerDataList = [];
containerData = {};
storeLocation = "";
apiKey="";
apiSubdomain="";
lastScan="";
smartScan = false;
smartScanCandidates = {};
revertScan = false;
removeScan = false;
addDetailsRunning = false;
firstTimeLoadingApiData = true;

pickerPageMemory = new Map();
pickerQtyMemory = new Map();
pickerChosenQtyMemory = new Map();
pickerPageStorage = new Map();
rowsAdded = false;


blockQuarantines = true;

pageNumber = 1;
let oppData = {opportunity_items:[], meta:[]}

quarantineData = {quarantines:[], meta:[]};
quarantinedItemList = [];
quarantineCounts = [];


console.log(`Content.js was triggered at ${performance.now()}ms`);


// check if we're scraping warehouse notes for another window
pageUrl = window.location.href;


if (pageUrl.endsWith("view=d&scrape")){
	createBlockOutOverlay();
	var warehouseNotesLog = {};
	var warehouseNotesDivs = document.querySelectorAll("div.opportunity-item-warehouse-notes");
	warehouseNotesDivs.forEach((note, i) => {
		var thisNote = note.innerText.trim();
		var noteOwner = note.closest("li");
		var noteGroup = noteOwner.dataset.id;
		var noteItemId = noteOwner.querySelector(`tr#${CSS.escape(noteGroup)}`);
		var itemRef = noteItemId.dataset.oiId;
		warehouseNotesLog[itemRef] = thisNote;
	});
	console.log("NOTES:");


	
	// get all td elements with class "optional-01 asset asset-column"
	var assetColumns = document.querySelectorAll('td.optional-01.asset.asset-column');

	let members = {};

	assetColumns.forEach((asset, i) => {
		// check if the td inner text starts with "Sub-Rent Booking"
		if (asset.innerText.startsWith("Sub-Rent Booking")){

			// check if there is an <a> element inside the td
			const thisLink = asset.querySelector("a");
			if (thisLink){
				// get the text content of the <a> element inside the td
				var memberName = asset.querySelector("a").innerText;
		
				// get the HREF of the <a> element inside the td
				var memberLink = asset.querySelector("a").href;
				// get the asset number from the HREF
				const memberMatch = memberLink.match(/\/members\/(\d+)(?=\?)/);
				if (memberMatch) {
					const memberId = memberMatch[1];
					
					// add this member to members
					members[memberId] = memberName;

				} else {
					console.log("No member ID found");
				}
			}
		}

		});

		if (Object.keys(warehouseNotesLog).length > 0 || Object.keys(members).length > 0){
			chrome.runtime.sendMessage({messageType: "warehouseNotesData", messageData: {warehouseNotesLog: warehouseNotesLog, members: members}});
		}




	chrome.runtime.sendMessage({ action: "closeTab" });
}


// block to retrieve the error timeout setting from local storage
try {
	chrome.storage.local.get(["errorTimeout"]).then((result) => {
		console.log("errorTimeout = "+result.errorTimeout);
		if (result.errorTimeout){
			errorTimeout = result.errorTimeout;
		} else {
			console.log("errorTimeout not retrieved");
		}
	});
} catch (e) {
	console.log(e);
}







function createBlockOutOverlay() {
		var overlay = document.createElement('div');
		overlay.className = 'block-out';
		var text = document.createElement('span');
		text.textContent = 'THIS DUMMY TAB IS FOR BACKGROUND SCRAPING BY CURRENT-RMS HELPER. THIS TAB SHOULD AUTO-CLOSE AFTER SCRAPING, SO IF YOU ARE READING THIS AN ERROR HAS OCCURED. SORRY!';
		overlay.appendChild(text);
		document.body.appendChild(overlay);

}







const exists = sel => document.querySelector(sel) !== null;

// Detect views
orderView          = exists('div.row.sticky.quick-add-section');
detailView         = exists('#quick_prepare.tab-pane');
editOppView        = exists('form.simple_form.edit_opportunity, form.simple_form.new_opportunity');
editContainerView  = document.getElementById('container_mode_div') !== null; // ID lookup is fastest
globalCheckinView  = exists('div.col-sm-12.global_check_ins.main-content');
globalSearchView   = exists('div.global-search-summary');

// Lazy-load transfer out module.
if (detailView) {
    import(chrome.runtime.getURL('scripts/transfer-out.js')).then((mod) => {
        if (mod && typeof mod.initTransferOut === 'function') {
            mod.initTransferOut();
        }
    }).catch((err) => {
        console.error('Failed to load transfer out module', err);
    });
}




if (orderView){
	console.log("Order view: "+orderView);
}

if (detailView){
	console.log("Detail view: "+detailView);
}

if (editOppView){
	console.log("Edit Opportunity View: "+editOppView);
}

if (globalCheckinView){
	console.log("Global Check-in view: "+globalCheckinView);
}

if (editContainerView){
	console.log("Edit container view: "+editContainerView);
}


// Code chunk to enable auto-scrolling to last position in Order or Detail View.
if (detailView){

	var currentView = "detail";
	
	chrome.storage.local.get(["last-scroll"]).then((result) => {
			if (result){
				console.log(result);
				if (result["last-scroll"].opp == opportunityID && result["last-scroll"].view == currentView){
					console.log("Reloading filters!");

					if (result["last-scroll"].notesHidden == true){
						document.getElementById("notes-button").click();
					}

					if (result["last-scroll"].preparedHidden == true){
						document.getElementById("prepared-button").click();
					}

					if (result["last-scroll"].bookedOutHidden == true){
						document.getElementById("booked-out-button").click();
					}

					if (result["last-scroll"].checkedInHidden == true){
						document.getElementById("checked-in-button").click();
					}

					if (result["last-scroll"].bulkOnly == true){
						document.getElementById("bulk-button").click();
					}

					if (result["last-scroll"].subhiresHidden == true){
						document.getElementById("subhires-button").click();
					}

					if (result["last-scroll"].nonsubsHidden == true){
						document.getElementById("nonsubs-button").click();
					}

					if (result["last-scroll"].nonShortsHidden == true){
						document.getElementById("nonshorts-button").click();
					}

				} else {

				}
			}
	});

	// Save scroll position on click
	document.addEventListener('click', () => {

			var currentView = "detail";
			
			chrome.storage.local.set({ 'last-scroll': {opp: opportunityID, view: currentView, notesHidden: notesHidden, preparedHidden: preparedHidden, bookedOutHidden: bookedOutHidden, checkedInHidden:checkedInHidden, bulkOnly: bulkOnly, subhiresHidden: subhiresHidden, nonsubsHidden: nonsubsHidden, nonShortsHidden: nonShortsHidden} }).then(() => {
				 console.log("Saved filters updated");
			});
	});

}





// If in a detail/order/check in view create the modal ready for reference image.
if (detailView || orderView || globalCheckinView){
	// Create the modal element
	const modalElement = document.createElement('div');
	modalElement.id = 'product-image-modal';
	modalElement.className = 'product-modal';

	// Create the inner elements
	modalElement.innerHTML = `
		<img class="product-modal-content" id="modal-image" src="https://s3.amazonaws.com/current-rms/94ed60d0-735f-0138-9f28-0a907833e252/icons/98/original/xlr-cable.jpg">
		<div id="product-modal-caption" class="product-modal-caption">Main Warehouse - Bay 12 - Bin 17</div>
		<div id="product-modal-weight" class="product-modal-caption"></div>
		<div id="product-modal-location" class="product-modal-caption"></div>
	`;

	// Append the modal element to the end of the body
	document.body.appendChild(modalElement);

	// Create event listener to close the modal if clicked
	modalElement.addEventListener('click', function() {
			modalElement.style.display = "none";
	});
}






try {
	// Scrape the store name:
	storeLocation = document.getElementById("storelocation").textContent.trim();
	console.log("Store location is: " + storeLocation);
}
catch(err) {
	console.log("Store location not collected.")
}

// scrape the opportunity ID from the page URL if there is one
let opportunityID = (function() {
	const currentUrl = window.location.href;
	// Use a regular expression to match the opportunity ID in the URL
	const match = currentUrl.match(/\/opportunities\/(\d+)/);
		// Check if there is a match and return the opportunity ID (group 1 in the regex)
	return match ? match[1] : null;
})();



// get the multi global check in setting from local storage
chrome.storage.local.get(["multiGlobal"]).then((result) => {
		if (result.multiGlobal == undefined){
			multiGlobal = true;
		} else if (result.multiGlobal == "false"){
			multiGlobal = false;
		}
		console.log("Global check-in overide: "+multiGlobal);
});


// get the bookOutContainers setting from local storage
chrome.storage.local.get(["bookOutContainers"]).then((result) => {
		if (result.bookOutContainers == undefined){
			bookOutContainers = false;

		} else if (result.bookOutContainers == "false"){
			bookOutContainers = false;
		} else if (result.bookOutContainers == "true"){
			bookOutContainers = true;
		} else {
			bookOutContainers = result.bookOutContainers;
		}
		console.log("Auto book out nested containers setting: "+bookOutContainers);
});

// get the detailDelete setting from local storage
chrome.storage.local.get(["detailDelete"]).then((result) => {
		if (result.detailDelete == undefined){
			detailDelete = true;

		} else if (result.detailDelete == "false"){
			detailDelete = false;
		} else if (result.detailDelete == "true"){
			detailDelete = true;
		} else {
			detailDelete = result.detailDelete;
		}
		console.log("Disable Detail View Delete setting: "+detailDelete);

		if (detailView){
			hideDeleteButtons();
		}
});

// get the nestedTotals setting from local storage
chrome.storage.local.get(["nestedTotals"]).then((result) => {
	if (result.nestedTotals == undefined){
		nestedTotals = true;

	} else if (result.nestedTotals == "false"){
		nestedTotals = false;
	} else if (result.nestedTotals == "true"){
		nestedTotals = true;
	} else {
		nestedTotals = result.nestedTotals;
	}
	console.log("Show Collapsed Item Totals setting: "+nestedTotals);


});









if (detailView){
	// get the inspection alert setting from local storage
	chrome.storage.local.get(["inspectionAlert"]).then((result) => {
			if (result.inspectionAlert == undefined){
				inspectionAlerts = "full";
			} else {
				inspectionAlerts = result.inspectionAlert;
			}
			console.log("Inspection alert mode: "+inspectionAlerts);
	});


	// get the blockQuarantines setting from local storage
	chrome.storage.local.get(["blockQuarantines"]).then((result) => {
			if (result.blockQuarantines == undefined){
				blockQuarantines = true;
			} else if (result.blockQuarantines == "false"){
				blockQuarantines = false;
			}
			console.log("Block Quarantines setting: "+blockQuarantines);
	});
}



if (detailView || orderView || globalCheckinView){

	// Load the all products list from local storage
	chrome.storage.local.get(["allProducts"]).then((result) => {
			if (result.allProducts == undefined){
				// If the variable is empty, it might not have been got yet (first use)
				chrome.storage.local.get(["api-details"]).then((result) => {
					const details = result["api-details"];
					if (details && details.apiKey && details.apiSubdomain){
						console.log("Products list was not found. Requesting refresh.");
						makeToast("toast-info", "Products list was not found. Requesting refresh.", 5);
						chrome.runtime.sendMessage("refreshProducts");
					} else {
						console.log("API details have not been found in local storage.");
						//makeToast("toast-info", "API details have not found.", 5);
					}
				});
			} else {
				const allProductsString = result.allProducts;
				// Parse the JSON string back into an object
				allProducts = JSON.parse(allProductsString);
				console.log("Retrieved allProducts from storage.");
				//console.log(allProducts.products);
			}
			//console.log("Global check-in overide: "+multiGlobal);
	});

	// Load the quarantineData from local storage
	chrome.storage.local.get(["quarantineData"]).then((result) => {
			if (result.quarantineData == undefined){
			// If the variable is empty, it might not have been got yet (first use)
			if (apiKey){
				console.log("Quarantines list was not found.");
				makeToast("toast-error", "Quarantines list was not found. Feature disabled!");
			}
		} else {
			const quarantinesString = result.quarantineData;
			quarantineData = JSON.parse(quarantinesString);
			console.log("Retrieved quarantine data from storage");
			console.log(quarantineData);
			console.log(typeof quarantineData);  

			quarantinedItemList = [];
			for (let n = 0; n < quarantineData.quarantines.length; n++) {
				var thisAsset = quarantineData.quarantines[n].stock_level.asset_number;
				quarantinedItemList.push(thisAsset);
			}
			console.log("List of quarantined items was created.");

			function tallyByNameAndStatus(data) {
				return data.reduce((acc, { name, quantity, quarantine_type }) => {
					// coerce quantity to a number
					const qty = Number(quantity) || 0;
					// coerce type to number too
					const type = typeof quarantine_type === 'string'
						? parseInt(quarantine_type, 10)
						: quarantine_type;
			
					// decide which bucket this entry goes into
					let bucket;
					if (type == 2 || type == 4) {
						bucket = 'lost';
					} else if (type == 1 || type == 3) {
						bucket = 'damaged';
					} else if (type == 5) {
						bucket = 'service';
					} else {
						// ignore any other types
						return acc;
					}
			
					// initialize the name grouping if needed
					if (!acc[name]) {
						acc[name] = { lost: 0, damaged: 0, service: 0 };
					}
			
					// add to the right bucket
					acc[name][bucket] += qty;
					return acc;
				}, {});
			}
			

			quarantineCounts = tallyByNameAndStatus(quarantineData.quarantines);
			console.log(quarantineCounts);
		}
	});



	// Load the stock item list from local storage
	chrome.storage.local.get(["allStock"]).then((result) => {
			if (result.allStock == undefined){
				// If the variable is empty, it might not have been got yet (first use)
				console.log("Stock list was not found. Requesting refresh.");
				chrome.runtime.sendMessage("refreshProducts");
			} else {
				const allStockString = result.allStock;
				// Parse the JSON string back into an object
				allStock = JSON.parse(allStockString);
				console.log("Retrieved allStock from storage:");
				//console.log(allStock.stock_levels);
				chrome.storage.local.get(["api-details"]).then((result) => {
						if (result["api-details"].apiKey && result["api-details"].apiSubdomain){
							apiKey = result["api-details"].apiKey;
							apiSubdomain = result["api-details"].apiSubdomain;
						} else {
							console.log("API details have not been found.");
							//makeToast("toast-info", "API details have not found.", 5);
						}
				});
				addDetails();
				console.log(allStock);
			}
	});

	// load the containerList and containerData from local storage
	chrome.storage.local.get(["containerList"]).then((result) => {
			if (result.containerList != undefined){
			
				containerDataList = result.containerList;
				console.log("Retrieved containerDataList from storage:");
				console.log(containerDataList);
			}
	});

	// load the containerData from local storage
	chrome.storage.local.get(["containerData"]).then((result) => {
		if (result.containerData != undefined){
			containerData = result.containerData;
			console.log("Retrieved containerData from storage:");
			console.log(containerData);
		}
	});
	

};

if (editContainerView){
	// Load the stock item list from local storage
	chrome.storage.local.get(["allStock"]).then((result) => {
			if (result.allStock == undefined){
				// If the variable is empty, it might not have been got yet (first use)
				console.log("Stock list was not found. Requesting refresh.");
				chrome.runtime.sendMessage("refreshProducts");
			} else {
				const allStockString = result.allStock;
				// Parse the JSON string back into an object
				allStock = JSON.parse(allStockString);
				console.log("Retrieved allStock from storage:");
				//console.log(allStock.stock_levels);
				chrome.storage.local.get(["api-details"]).then((result) => {
						if (result["api-details"].apiKey && result["api-details"].apiSubdomain){
							apiKey = result["api-details"].apiKey;
							apiSubdomain = result["api-details"].apiSubdomain;
						} else {
							console.log("API details have not been found.");
							//makeToast("toast-info", "API details have not found.", 5);
						}
				});
				console.log(allStock);

				let thisContainerWeight = 0;
				let thisContainerSelfWeight = 0;
				let thisContainerTotalWeight = 0;

				const containerID = document.querySelector("div.subtitle").innerText.trim();

				if (containerID){
					const thisContainer = allStock.stock_levels.find(item => item.asset_number === containerID);
					if (thisContainer){
						thisContainerSelfWeight = parseFloat(thisContainer.item.weight);
						thisContainerSelfWeight = Math.round(thisContainerSelfWeight * 100) / 100;
					}
				}





				const serialisedComponentsBody = document.getElementById('serialised_components_body');
				if (serialisedComponentsBody){
					const serialisedComponentRows = serialisedComponentsBody.querySelectorAll('tr');
					serialisedComponentRows.forEach((row, i) => {
						const assetNumber = row.querySelector('td.essential').innerText.trim();
						const thisItem = allStock.stock_levels.find(item => item.asset_number === assetNumber);
						if (thisItem){
							const thisWeight = thisItem.item.weight;
							if (thisWeight && thisWeight != null){
								thisContainerWeight = thisContainerWeight + parseFloat(thisWeight);
							}
						}
						
					});
					// rounding to fix float issues
					thisContainerWeight = Math.round(thisContainerWeight * 100) / 100;

					thisContainerTotalWeight = Math.round((thisContainerWeight + thisContainerSelfWeight) * 100) / 100;


					console.log("Container weight: "+thisContainerWeight);
					console.log("Container self weight: "+thisContainerSelfWeight);
					console.log("Total weight: "+thisContainerTotalWeight);

					// add info to the side bar
					const attributeList = document.querySelector("ul.number-list");
					const newHtml = `
					<li><span>Container Total Weight: ${thisContainerTotalWeight} ${weightUnit}</span></li>
					<li><span><i>&#8627; Container Contents: ${thisContainerWeight} ${weightUnit}</i></span></li>
					<li><span><i>&#8627; Container Item: ${thisContainerSelfWeight} ${weightUnit}</i></span></li>
					`;
					attributeList.insertAdjacentHTML('beforeend', newHtml);


				}


			}
	});


	// work out which container we're editing
	const containerSection = document.querySelector("div.content.detailspage.row.serialised_containers");
	if (containerSection){
		containerUnderEdit = containerSection.querySelector("div.subtitle").innerText.trim();
		console.log(containerUnderEdit);
	}

	// start monitoring the scan box
	var scanComponentBox = document.getElementById('component_stock_level_asset_number');

	scanComponentBox.addEventListener("keypress", function(event) {
		if (event.key === "Enter") {

			var myScan = scanComponentBox.value;

			if (myScan == containerUnderEdit){
				// we have scanned the container, so we should go back to the list
				event.preventDefault();
				containerScanSound();
				const backButton = document.querySelector("i.icn-cobra-goback");
				setTimeout(function () {
					backButton.click();
				}, 250);
			}
		}
	});




}





if (editOppView){

	// Create Reset All Dates button

	const schedule = Array.from(document.querySelectorAll('div')).find(el => el.textContent.trim() === 'Scheduling');

	if (schedule) {
		// Do something with the link
		// Create the new element you want to add
		const newElement = document.createElement('li');
		newElement.classList.add("helper-btn");
		newElement.classList.add("helper-bar");
		newElement.id = "reset-all-dates";
		newElement.innerText = "Clear All Dates";
		// Insert the new element after the tr
		schedule.insertAdjacentElement('afterend', newElement);

		document.getElementById('reset-all-dates').addEventListener('click', function(event) {
			var clearButtons = document.querySelectorAll('li.clear[data-range-key="Clear"]');

			clearButtons.forEach((item, i) => {
				if (i > 2){
					item.click();
				}
			});

		});

	} else {
		console.log('Schedule not found');
	}

	// Prevent form from submitting if any input has a value of "Required"
	let oppForm = document.querySelector('form.simple_form.edit_opportunity');
	if (!oppForm) {
		oppForm = document.querySelector('form.simple_form.new_opportunity');
	}

	if (oppForm) {

		let hasError = false;
		let buttonText;

		oppForm.addEventListener('submit', function(event) {
			hasError = false;
			let firstErrorElement = null;
			
			// Select all input elements within the form
			// Get all select elements on the page
			const selects = Array.from(oppForm.querySelectorAll('select'));

			// Filter select elements that have at least one option whose textContent starts with "required"
			const matchingSelects = selects.filter(select => {
				return Array.from(select.options).some(option => {
					return option.textContent.trim().toLowerCase().startsWith('required');
				});
			});
			
			// now iterate through the matching selects
			matchingSelects.forEach(select => {
				// Find the option whose text starts with "required"
				const requiredOption = Array.from(select.options).find(option =>
					option.textContent.trim().toLowerCase().startsWith('required')
				);
			
				// If such an option exists and its value equals the select's current value...
				if (requiredOption && select.value === requiredOption.value) {
					hasError = true;
					firstErrorElement = select;
					select.classList.add('requirement-error');
				}
			});
			
			// Prevent the form submission if any input had the error
			if (hasError) {
				event.preventDefault();
				
				oppForm.querySelectorAll('input[type="submit"]').forEach(button => {
					console.log("Enable buttons");
					button.removeAttribute('disabled');
				});

				if (firstErrorElement) {
					firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
		});

		oppForm.querySelectorAll('input[type="submit"]').forEach(button => {
			// Ensure the button is enabled initially.
			button.disabled = false;
			button.removeAttribute('disabled');
			buttonText = button.value;
		
			// Create an observer to watch for changes to the disabled attribute.
			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (mutation.attributeName === 'disabled' && button.hasAttribute('disabled') && hasError) {
						button.disabled = false;
						button.removeAttribute('disabled');
						button.value = buttonText;
					}
				});
			});
			
			// Start observing the button for attribute changes.
			observer.observe(button, { attributes: true });
		});
	
	}


	// Create button to delete the locally stored data for this opportunity

	// find the element with the id "rp"
	const rpValue = document.getElementById("rp").value;

	// value will be something like "/opportunities/375" so extract just the bit after the final "/"
	const opportunityID = rpValue.substring(rpValue.lastIndexOf("/") + 1);

	let opportunityItemsLength = 0;

	// retreive the locally stored data for this opportunity

	chrome.storage.local.get([`opp-${opportunityID}`]).then((result) => {
			if (result && result[`opp-${opportunityID}`]) {
				const localOppData = result[`opp-${opportunityID}`];
				
					const local_opportunity_items = JSON.parse(localOppData.opportunity_items);
					opportunityItemsLength = local_opportunity_items.length;
					
			} else {
				console.log("No locally stored data for this opportunity");
			}



		 
		




	const subjectDiv = document.querySelector('div.row.string.required.opportunity_subject');

	// find the closest div with col-md-12 col-sm-12
	const parentDiv = subjectDiv.closest('div.col-md-12.col-sm-12');

	// Create the new element you want to add
	const localDataDiv = document.createElement('div');
	localDataDiv.classList.add("form-block");

	localDataDiv.innerHTML = `
	<fieldset class="row">
	<div class="col-md-2 col-sm-2 form-icon">
	<i class="icn-cobra-shuffle"></i>
	</div>
	<div class="col-md-8 col-sm-8 form-area">
		<div class="row check_boxes optional opportunity_assigned_surcharge_group_ids">
			<div class="col-md-12 col-sm-12">
			<H3>Helper Extension Local Opportunity Data</H3>
			<p>Locally stored opportunity items: <span id="opp-data-length">${opportunityItemsLength}</span></p>
			<li class="helper-btn helper-bar" id="clear-local-data">Clear Local Data</li>
			</div>
		</div>

	</div>
	</fieldset>
	</div>`

	// Append the new element at the end of the div
	parentDiv.appendChild(localDataDiv);

	document.addEventListener('click', function(event) {
		if (event.target && event.target.id === 'clear-local-data') {
			console.log("Clicked clear local data button");
			// remove the locally stored data for this opportunity
			chrome.storage.local.remove(`opp-${opportunityID}`, function() {
				console.log(`Removed opp-${opportunityID} from local storage`);
				makeToast("toast-info", `Removed opp-${opportunityID} from local storage`, 5);
				document.getElementById("opp-data-length").innerText = "0";
			});
		}
	});

});







}





// Function to add inspector details and item descriptions to the Details page
async function addDetails(mode) {
	// send message to injected code
	window.postMessage({
		source: 'MY_EXTENSION',
		type: 'add-details',
		payload: { foo: 'bar' }
	}, '*');


	if (!addDetailsRunning){
		
		
		const overallStartTime = performance.now();
		console.log(`addDetails started at ${overallStartTime}ms`);


		addDetailsRunning = true;

		const startTime = performance.now();
	


	if (detailView){

		if (!mode){

				//console.log("No opp data found in local storage");
			 
				const recallApiStartTime = performance.now();
				console.log(`Starting recallAPI function at ${recallApiStartTime}ms`);
				
				
				await recallApiDetails();
				pageNumber = 1;

				// initialise oppData
				oppData = {opportunity_items:[], meta:[]}


				const initialStartTime = performance.now();
				console.log(`Starting oppData API call at ${initialStartTime}ms`);

				// First API call to get initial data and total row count
				const initialResult = await opportunityApiCall(opportunityID, "detail");

				const initialEndTime = performance.now();
				console.log(`oppData API call completed in ${initialEndTime - initialStartTime}ms`);



				oppData.opportunity_items.push(...initialResult.opportunity_items);
				oppData.meta = initialResult.meta;
		 

				console.log(oppData.meta);

				const totalRows = oppData.meta.total_row_count;

		} else {
			console.log("Running offline addDetails");
		}

		console.log("oppData:");
		console.log(oppData);

		// Find all elements with class "optional-01 asset asset-column"
		var assetColumns = document.querySelectorAll('td.optional-01.asset.asset-column');

		var notedOppAssetIds = [];
		var thisDescription = "";

	
		for (var i = 0; i < assetColumns.length; i++) {
			var parentRow = assetColumns[i].closest('tr');
			var oppItemId = parentRow.getAttribute("data-oi-id");
			var parentTableBody = assetColumns[i].closest('tbody');
			var nameElement = parentRow.querySelector('.essential.asset.dd-name');
			var nameDiv = nameElement.querySelector('div:last-child');
			// Find the span with class 'product-tip' within nameDiv
			var productTip = nameDiv.querySelector('span.product-tip');
			// If the element exists, remove it
			if (productTip) {
					productTip.remove();
			}

			var prodName = nameElement.innerText;
			
				if (!assetColumns[i].innerHTML.includes("Sub-Rent Booking") && !assetColumns[i].innerHTML.includes("Non-Stock Booking")){

					if (prodName.startsWith("Collapse")) {
						// Remove the prefix and return the rest of the string
						prodName = prodName.slice("Collapse\n".length);
					} else if (prodName.startsWith("Expand")) {
						// Remove the prefix and return the rest of the string
						prodName = prodName.slice("Expand\n".length);
					}

					// find the closest <a>
					const closestLink = nameElement.querySelector('a').href;
					let linkId = 0;
					const lastSlash = closestLink.lastIndexOf('/');
					const firstQuestion = closestLink.indexOf('?', lastSlash + 1); // search *after* the last “/”

					// Guard against edge‑cases
					if (lastSlash !== -1 && firstQuestion !== -1 && firstQuestion >= lastSlash) {
						linkId = closestLink.slice(lastSlash + 1, firstQuestion);
					}

					const newSpan = document.createElement('span');
					newSpan.className = 'product-tip';
					newSpan.innerHTML = '&#128270; &nbsp;';
					const newSpanId = 'product-tip-'+i;
					newSpan.id = newSpanId;
					newSpan.setAttribute("data-product-link", linkId);

					nameDiv.appendChild(newSpan);

					// Attach the event listener to the element
				 
					(function (theId, name){
						// Attach the event listener to the element
						document.getElementById(theId).addEventListener('click', function() {
								openProductImageModal(name);
						});
					})(newSpanId, prodName);
					

				} // end of if not sub rent or non stock

			thisDescription = "";

			for (let i = 0; i < oppData.opportunity_items.length; i++) { // iterate through the oppData to see if there's a description
				if (oppData.opportunity_items[i].id == oppItemId && oppData.opportunity_items[i].description) {
				thisDescription = oppData.opportunity_items[i].description;
				}
			}


			if (thisDescription && !notedOppAssetIds.includes(oppItemId)){
				notedOppAssetIds.push(oppItemId);
				// add item description/note section
				const numberOfPadElemenets = parentRow.getElementsByClassName("essential padding-column");

				// Count the number of matching elements
				const padCount = numberOfPadElemenets.length;

				const newNoteRow = document.createElement('tr');
				newNoteRow.className = 'item-description-row';
				const padCell = "<td class='essential padding-column'></td>"
				const padCells = padCell.repeat(1+padCount);
				newNoteRow.innerHTML = padCells+"<td class='item-description-cell' colspan='5'>"+thisDescription+"</td>";

				// Check if there's already a note row
				var oldNote = parentTableBody.querySelector('tr.item-description-row');
				// If the element exists, remove it
				if (oldNote) {
					oldNote.remove();
				}



				parentTableBody.appendChild(newNoteRow);
			}
		}

		// now add group item descriptions
		var groupRows = document.querySelectorAll('tr.item-group');


		// Loop through each element to find the one with the matching asset number
		for (var i = 0; i < groupRows.length; i++) {
			var groupListContainer = groupRows[i].closest('li');
			var oppItemId = groupListContainer.getAttribute("data-group-id");

			thisDescription = "";

			for (let n = 0; n < oppData.opportunity_items.length; n++) {
				if (oppData.opportunity_items[n].id == oppItemId && oppData.opportunity_items[n].description) {
				thisDescription = oppData.opportunity_items[n].description;
				}
			}

			if (thisDescription && !notedOppAssetIds.includes(oppItemId)){
				notedOppAssetIds.push(oppItemId);
				// add item description/note section
				const numberOfPadElemenets = groupRows[i].getElementsByClassName("essential padding-column");

				// Count the number of matching elements
				const padCount = numberOfPadElemenets.length;

				const newNoteRow = document.createElement('tr');
				newNoteRow.className = 'item-description-row';
				const padCell = "<td class='essential padding-column'></td>"
				const padCells = padCell.repeat(1+padCount);
				newNoteRow.innerHTML = padCells+"<td class='item-description-cell' colspan='1'>"+thisDescription+"</td>";
				var parentTableBody = groupRows[i].closest('tbody');

				// Check if there's already a note row
				var oldNote = parentTableBody.querySelector('tr.item-description-row');
				// If the element exists, remove it
				if (oldNote) {
					oldNote.remove();
				}


				parentTableBody.appendChild(newNoteRow);
			}
		}

		if (firstTimeLoadingApiData){
			firstTimeLoadingApiData = false;
			makeToast("toast-info", "API information loaded.", 3);

		}

		// catching changes to the table functions header
		const tableFunctionsHeader = document.querySelector('div.row.sticky.quick-function-section');

		if (tableFunctionsHeader) {
				const helperButtonRow = document.querySelector('div.row.helper-sticky');
				const observer = new MutationObserver(function(mutations) {
						mutations.forEach(function(mutation) {
								if (mutation.target === tableFunctionsHeader) {
										// Your logic for handling changes to tableFunctionsHeader
										const topValue = tableFunctionsHeader.style.top; // Get the current 'top' style value
										console.log('Top style value changed:', topValue);
										console.log('Helper row heigh: ', helperButtonRow.offsetHeight);
										//tableFunctionsHeader.style.top = (parseInt(topValue) + helperButtonRow.offsetHeight) + 'px';




								}
						});
				});

				observer.observe(tableFunctionsHeader, {
						attributes: true, // Observe attribute changes
						attributeFilter: ['style'], // Only observe changes to the 'style' attribute
				});
		} else {
				console.warn('Element with class "tableFunctionsHeader" not found.');
		}
		
		const newScript = document.createElement('script');
		newScript.src = chrome.runtime.getURL('scripts/detail-header-injected.js'); // Path to the external script
		document.documentElement.appendChild(newScript);
		newScript.remove();



	} else if (orderView){
		console.log("add Details order view");

		// Find empty descriptions and remove them
		const allEditableDescs = document.querySelectorAll('div.editable.opportunity-item-description');
		const emptyDescs = Array.from(allEditableDescs)
		.filter(el => el.innerText === '');
		// remove any empty descriptions
		emptyDescs.forEach(el => {
			el.remove();
		});
	


		// get the start date and time
		const thisSidebar = document.getElementById("sidebar_content");
		const spans = thisSidebar.querySelectorAll('span');
		// Iterate over each <span>
		let startDateValue = null;
		let endDateValue = null;
		spans.forEach((span, index) => {
				// Check if the text content of this <span> is 'Start Date:'
				if (span.textContent.trim() === 'Start Date:') {
						// The next sibling element should be the <span> with the date
						const nextSpan = spans[index + 1];
						if (nextSpan) {
								startDateValue = nextSpan.textContent.trim();
						}
				} else if (span.textContent.trim() === 'End Date:') {
						// The next sibling element should be the <span> with the date
						const nextSpan = spans[index + 1];
						if (nextSpan) {
								endDateValue = nextSpan.textContent.trim();
						}
				}
		});


		// Original scrape version
		//chrome.runtime.sendMessage({messageType: "availabilityscape", messageText: opportunityID, messageStartDate:startDateValue, messageEndDate:endDateValue});

		// Local parse text version
		availabilityScrapeNonDom(opportunityID, startDateValue, endDateValue);

		// Scrape warehouse notes
		warehouseNotesScrapeNonDom(opportunityID);

		
		currencyPrefix = getCurrencySymbol();


		oppData = await recallOppDetails(opportunityID);

		if (!oppData){
			console.log("No opp data found in local storage");

			console.log(`Calling recallApiDetails at ${performance.now()}ms`);

			await recallApiDetails();

			// remove any existing opp data
			oppData = {opportunity_items:[], meta:[]}

			const startTime = performance.now();
			console.log(`Starting oppData API call at ${startTime}ms`);

			const result = await opportunityApiCall(opportunityID);

			const endTime = performance.now();
			console.log(`API call for full details of ${opportunityID} completed in ${endTime - startTime}ms`);


			oppData.opportunity_items.push(...result.opportunity_items);
			oppData.meta = result.meta;
	

			console.log(oppData.opportunity_items);
			console.log(oppData.meta);

			const oppItemsString = JSON.stringify(oppData.opportunity_items);
			const oppMetaString = JSON.stringify(oppData.meta);

			// create an ISO time string that is 1 minute in the past to account for CurrentRMS having a slow clock!
			const currentTimeString = new Date(Date.now() - 60 * 1000).toISOString();
			
			chrome.storage.local.set({ 
				[`opp-${opportunityID}`]: {
					opportunity_items: oppItemsString, 
					meta: oppMetaString,
					time: currentTimeString
				}
			}).then(() => {
				console.log(`Opportunity data saved for opp ID ${opportunityID}`);
			});


		} else {
			console.log("Recalled oppData:");
			console.log(oppData);

			// refreshing oppData
			const recallApiStartTime = performance.now();
			console.log(`Starting recallAPI function at ${recallApiStartTime}ms`);
			
			await recallApiDetails();
			pageNumber = 1;

			// initialise updateOppData
			let updateOppData = {opportunity_items:[], meta:[]}

			const initialStartTime = performance.now();
			console.log(`Starting update opportunity API call at ${initialStartTime}ms`);

			// API call to get new data
			const initialResult = await opportunityApiCall(opportunityID, "update");

			const initialEndTime = performance.now();
			console.log(`Update API call completed in ${initialEndTime - initialStartTime}ms`);

			updateOppData.opportunity_items.push(...initialResult.opportunity_items);
			updateOppData.meta = initialResult.meta;

			const totalRows = updateOppData.meta.total_row_count;
 
			console.log("Total rows of updates: "+totalRows);
			
			if (updateOppData.opportunity_items.length > 0){
				console.log("Updates to oppData:");
				console.log(updateOppData);
			}
			
			// now merge new data with existing oppData
			oppData.opportunity_items = mergeById(oppData.opportunity_items, updateOppData.opportunity_items);

			// now check that the length of oppData.opportunity_items is the same as the number of rows (ie. none have been deleted)
			const thisRowsCount = Array.from(document.getElementById("opportunity_items_body").querySelectorAll("li.grid-body-row"))
			.filter(row => row.hasAttribute("data-id"))
			.length;

			let currentTimeString = new Date(Date.now() - 60 * 1000).toISOString();

			if (oppData.opportunity_items.length > thisRowsCount){
				//makeToast("toast-error", `Warning: the number of product rows in the table (${thisRowsCount}) is less than the number of items in the oppData (${oppData.opportunity_items.length}). oppData will now be purged of deleted items`, 5);
				console.log(`Warning: the number of rows in the table (${thisRowsCount}) is less than the number of items in the oppData (${oppData.opportunity_items.length}). oppData will now be purged of deleted items`);

				// purge oppData of items that are not in the table
				// grab all the rows and build a Set of their IDs
				const ItemRows = document.querySelectorAll('#opportunity_items_body li.grid-body-row');
				const rowIds = new Set(Array.from(ItemRows, row => row.getAttribute('data-id')));

				// overwrite opportunity_items with only those whose id is in rowIds
				oppData.opportunity_items = oppData.opportunity_items.filter(item =>
				rowIds.has(String(item.id))
				);
				
			} else if (oppData.opportunity_items.length < thisRowsCount){
				makeToast("toast-error", `Warning: the number of rows in the table (${thisRowsCount}) is more than the number of items in the oppData (${oppData.opportunity_items.length}). Refresh this page to reload earlier entries.`, 5);
				console.log(`Warning: the number of rows in the table (${thisRowsCount}) is more than the number of items in the oppData (${oppData.opportunity_items.length}). Refresh this page to reload earlier entries.`);
				// get the oppData.time and make a new ISOString that is 12 hours earlier
				const oppDataTime = new Date(oppData.time);
				const twelveHoursEarlier = new Date(oppDataTime.getTime() - (12 * 60 * 60 * 1000));
				currentTimeString = twelveHoursEarlier.toISOString();
				

			}

			// Now save the updated oppData to local storage
			const oppItemsString = JSON.stringify(oppData.opportunity_items);
			const oppMetaString = JSON.stringify(oppData.meta);
			
			
			chrome.storage.local.set({ 
				[`opp-${opportunityID}`]: {
					opportunity_items: oppItemsString, 
					meta: oppMetaString,
					time: currentTimeString
				}
			}).then(() => {
				console.log(`Opportunity data updated for opp ID ${opportunityID}`);
			});

			cleanUpOldEntries();

		}

		console.log("oppData:");
		console.log(oppData);

		let servicesWithDateErrors = [];
		let startDate = null;
		let endDate = null;

		console.log("Start date value: "+startDateValue);

		if (startDateValue && endDateValue){
			// convert the start and end date values to date objects
			//startDate = new Date(startDateValue);
			
			let [dmy, hm] = startDateValue.split(" ");
			let [day, month, year] = dmy.split("/").map(Number);
			let [hour, minute] = hm.split(":").map(Number);

			// Local time on this machine:
			const startDate = new Date(year, month - 1, day, hour, minute);

			[dmy, hm] = endDateValue.split(" ");
			[day, month, year] = dmy.split("/").map(Number);
			[hour, minute] = hm.split(":").map(Number);

			// Local time on this machine:
			const endDate = new Date(year, month - 1, day, hour, minute);
			
			
			
			//endDate = new Date(endDateValue);
			console.log("Start date: "+startDate);
			console.log("End date: "+endDate);
		}

		for (let n = 0; n < oppData.opportunity_items.length; n++) {

			if (oppData.opportunity_items[n].opportunity_item_type_name != "Group" && oppData.opportunity_items[n].opportunity_item_type_name != false) {


				if (oppData.opportunity_items[n].item_type == "Service" && oppData.opportunity_items[n].starts_at && oppData.opportunity_items[n].ends_at && startDate && endDate) {
					// convert the item start and end date values to date objects
					const itemStartDate = new Date(oppData.opportunity_items[n].starts_at);
					const itemEndDate = new Date(oppData.opportunity_items[n].ends_at);
					console.log("Item start date: "+itemStartDate);
					console.log("Item end date: "+itemEndDate);
					// check if the item start date is before the opportunity start date or after the opportunity end date
					if (itemStartDate < startDate || itemEndDate > endDate || itemEndDate < startDate || itemStartDate > endDate) {
						// add the item to the servicesWithDateErrors array
						servicesWithDateErrors.push(oppData.opportunity_items[n]);
					}
				}

				
				var thisName = oppData.opportunity_items[n].name;
				var thisID = oppData.opportunity_items[n].id;
				var thisTotalCharge = parseFloat(oppData.opportunity_items[n].charge_excluding_tax_total);
				var thisTotalCost = 0.0;
				for (let i = 0; i < oppData.opportunity_items[n].item_assets.length; i++) {
					if (oppData.opportunity_items[n].item_assets[i].opportunity_cost){
						if (oppData.opportunity_items[n].item_assets[i].opportunity_cost.actual_cost != "0.0"){
							thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[n].item_assets[i].opportunity_cost.actual_cost);
						} else {
							thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[n].item_assets[i].opportunity_cost.provisional_cost);
						}
					}
				}

				var thisProfitLoss = (thisTotalCharge - thisTotalCost).toFixed(2);
				var thisProfitLossString = "";
				if (thisProfitLoss < 0){
					thisProfitLossString = "Loss: -"+currencyPrefix+(thisProfitLoss * -1);
				} else {
					thisProfitLossString = "Profit: "+currencyPrefix + thisProfitLoss;
				}

				// Now work out the combined charge_excluding_tax_total of this item and it's accessories
				var accessoriesCharge = 0.0;

				// get the accessories for this item
				var thisAccessories = getAllAccessories(oppData.opportunity_items, thisID);
				// loop through the accessories, and add the charge_excluding_tax_total of each accessory
				for (let i = 0; i < thisAccessories.length; i++) {
					// check if the id is present in thisAccessories
					var accessoryID = thisAccessories[i];
					var accessory = oppData.opportunity_items.find(item => item.id == accessoryID);
					if (accessory){
						// add the charge_excluding_tax_total of the accessory
						if (accessory.charge_excluding_tax_total){
							accessoriesCharge = accessoriesCharge + parseFloat(accessory.charge_excluding_tax_total);
						}
					}
				}
				// add the accessoriesCharge to the thisTotalCharge
				var thisNestedTotalCharge = thisTotalCharge + accessoriesCharge;

				function getAllAccessories(oppData, thisID) {
					const accessories = [];
			
					// Helper function for recursion
					function findAccessories(parentID) {
							// Find all items where parent_opportunity_item_id matches the current parentID
							const childAccessories = oppData.filter(item => item.parent_opportunity_item_id === parentID);
			
							// Add the IDs of the child accessories to the list
							childAccessories.forEach(child => {
									accessories.push(child.id); // Assuming each item has an 'id' property
									// Recursively find accessories for the current child
									findAccessories(child.id);
							});
					}
			
					// Start the recursion with the given thisID
					findAccessories(thisID);
			
					return accessories;
				}


				var liElement = document.querySelector('li.grid-body-row[data-id="'+thisID+'"]');

				if (liElement){

					if (accessoriesCharge > 0){
						liElement.dataset.nestedcharge = thisNestedTotalCharge;
						liElement.dataset.accessoriescharge = accessoriesCharge;
						liElement.dataset.originalcharge = thisTotalCharge
					}

					var tdElement = liElement.querySelector('td.total-column.align-right.item-total');
					if (!tdElement){
						console.log("issue finding td element for "+thisName);
					}
				}


				if (!oppData.opportunity_items[n].is_in_deal){
				// SECTION TO ADD POP UP DATA
				var spanElement = tdElement.querySelector('span');
				var currentDataContent = "";

				if (spanElement.classList.contains("popover_help")){
					if (spanElement.hasAttribute("data-original-content")){
						currentDataContent = spanElement.getAttribute("data-original-content");
					} else {
						currentDataContent = spanElement.getAttribute("data-content");
						spanElement.setAttribute("data-original-content", currentDataContent);
					}

					var dataContentToAdd = "<br><br>Total Cost: "+currencyPrefix+thisTotalCost.toFixed(2)+"<br>"+thisProfitLossString;
					// Append a new string to the existing value
					var newContent = currentDataContent + dataContentToAdd;
					spanElement.setAttribute("data-content", newContent);

				} else {
					var oldSpan = spanElement.querySelector('span.cost-tooltiptext');
					if (oldSpan){
						oldSpan.remove();
					}
					spanElement.classList.add("popover-help-added", "cost-tooltip");
					//var newContent = "Total Cost: "+thisTotalCost.toFixed(2);
					var htmlString = '<span class="cost-tooltiptext">Total Charge: '+currencyPrefix+thisTotalCharge.toFixed(2)+'<br>Total Cost: '+currencyPrefix+thisTotalCost.toFixed(2)+'<br>'+thisProfitLossString+'</span>';
					spanElement.innerHTML += htmlString;


				}
				if (thisTotalCost > thisTotalCharge){
					spanElement.classList.add("loss-warning");
					const spanToDeClass = spanElement.closest("tr.item-price-below-cost")
					if (spanToDeClass){
						spanToDeClass.classList.remove("item-price-below-cost");
					}
				} else {
					spanElement.classList.remove("loss-warning");
				}
			}

				// SECTION TO LIST ALLOCATED SERVICES BELOW ITEMS
			if (oppData.opportunity_items[n].item_type == "Service"){
				// logging for dev purposes
				//console.log(oppData.opportunity_items[n]);

				var trElement = tdElement.closest("tr");

				// remove previous rows in case they have changed
				const rowsToRemove = liElement.querySelectorAll('.allocation-detail-tr');
				// Loop through each element and remove it
				rowsToRemove.forEach(function(element) {
					element.parentNode.removeChild(element);
				});


				var elementToGoAfter = trElement;

				if (oppData.opportunity_items[n].status == 5 && oppData.opportunity_items[n].item_assets[0].stock_level_asset_number == "Group Booking"){
					trElement.classList.add("unallocated");
				} else {
					trElement.classList.remove("unallocated");
					// Iterate through the item_assets in reverse order
					var assetCount = 1;
					//for (let i = oppData.opportunity_items[n].item_assets.length - 1; i >= 0; i--) {
					for (let i = 0; i < oppData.opportunity_items[n].item_assets.length; i++) {
						var thisAsset = oppData.opportunity_items[n].item_assets[i];
						if (thisAsset.stock_level_asset_number == "Group Booking"){
							var quantityOfGroup = parseInt(thisAsset.quantity);
								trElement.classList.add("unallocated");

						} else {

							var textForTheAllocation = thisAsset.stock_level_asset_number;
							if (apiSubdomain && thisAsset.stock_level_member_id){
								textForTheAllocation = `<a href="https://${apiSubdomain}.current-rms.com/members/${thisAsset.stock_level_member_id}" class="allocation-link"  target="_blank" data-memberemail="${thisAsset.stock_level_member_work_email_address ? thisAsset.stock_level_member_work_email_address : ''}">${thisAsset.stock_level_asset_number}</a>`;

							} else if (apiSubdomain && thisAsset.supplier_id){
								textForTheAllocation = `<a href="https://${apiSubdomain}.current-rms.com/members/${thisAsset.supplier_id}" class="allocation-link"  target="_blank">${thisAsset.stock_level_asset_number}</a>`;
							}


							// Create the new element you want to add
							const newElement = document.createElement('tr');
							newElement.classList.add("allocation-detail-tr");
							newElement.innerHTML = `<td>&nbsp;</td><td class="allocation-detail" colspan="11">${assetCount}: ${textForTheAllocation}</td>`;
							// Insert the new element after the tr
							elementToGoAfter.insertAdjacentElement('afterend', newElement);
							elementToGoAfter = newElement;
							assetCount ++;
						}

					}
				}

			}      // end of service item allocation section

			// section to highlight sub-rent lines with no supplier set
			if (oppData.opportunity_items[n].sub_rent == true){
				var trElement = tdElement.closest("tr");
				let missingSupplier = false;
				oppData.opportunity_items[n].item_assets.forEach((asset) => {
					if (asset.stock_level_asset_number == "Sub-Rent Booking" && asset.supplier_id == null){
						missingSupplier = true;
					}
				});
				if (missingSupplier){
					trElement.classList.add("missing-supplier");
				} else {
					trElement.classList.remove("missing-supplier");
				}

			}




			} else if (oppData.opportunity_items[n].opportunity_item_type_name = "Group" && oppData.opportunity_items[n].has_group_deal && !oppData.opportunity_items[n].is_in_deal) {
				// this means the item is a group with a group discount set
				var thisID = oppData.opportunity_items[n].id;
				var thisTotalCharge = parseFloat(oppData.opportunity_items[n].charge_excluding_tax_total);
				var thisGroupPath = oppData.opportunity_items[n].path;
				var thisTotalCost = 0.0;

				for (let g = n+1; g < oppData.opportunity_items.length; g++) {
					if (oppData.opportunity_items[g].opportunity_item_type_name != "Group" && oppData.opportunity_items[g].path.startsWith(thisGroupPath)) {
						for (let i = 0; i < oppData.opportunity_items[g].item_assets.length; i++) {
							if (oppData.opportunity_items[g].item_assets[i].opportunity_cost){
								if (oppData.opportunity_items[g].item_assets[i].opportunity_cost.actual_cost != "0.0"){
									thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[g].item_assets[i].opportunity_cost.actual_cost);
								} else {
									thisTotalCost = thisTotalCost + parseFloat(oppData.opportunity_items[g].item_assets[i].opportunity_cost.provisional_cost);
								}
							}
						}
					}
				}

				var thisProfitLoss = (thisTotalCharge - thisTotalCost).toFixed(2);
				var thisProfitLossString = "";
				if (thisProfitLoss < 0){
					thisProfitLossString = "Loss: -"+currencyPrefix+(thisProfitLoss * -1);
				} else {
					thisProfitLossString = "Profit: "+currencyPrefix + thisProfitLoss;
				}
				var liElement = document.querySelector('li.grid-body-row[data-id="'+thisID+'"]');
				var tdElement = liElement.querySelector('td.align-right.group-deal.group-total.total-column');
				var spanElement = tdElement.querySelector('span');

				var oldSpan = spanElement.querySelector('span.cost-tooltiptext');
				if (oldSpan){
					oldSpan.remove();
				}
				spanElement.classList.add("cost-tooltip");

				var htmlString = '<span class="cost-tooltiptext">Total Charge: '+currencyPrefix+thisTotalCharge.toFixed(2)+'<br>Total Cost: '+currencyPrefix+thisTotalCost.toFixed(2)+'<br>'+thisProfitLossString+'</span>';
				spanElement.innerHTML += htmlString;



			if (thisTotalCost > thisTotalCharge){
				spanElement.classList.add("loss-warning");
			} else {
				spanElement.classList.remove("loss-warning");
			}


			}// end of if a group with deal set

		}

		// now check if there were any service items with date errors
		console.log(servicesWithDateErrors);
		if (servicesWithDateErrors.length == 1){
			createTopAlert('warn', `There is ${servicesWithDateErrors.length} service item with dates outside of the opportunity.`, 1);
		} else if (servicesWithDateErrors.length > 0){
			createTopAlert('warn', `There are ${servicesWithDateErrors.length} service items with dates outside of the opportunity.`, 1);
		}

		applyNestedCharges();

			// Sort out listing charged days for serviced items
			var daysHeader = document.querySelector('td.days-column.align-right');
			if (daysHeader){

				var typeColumnSpans = document.querySelectorAll('td.type-column');

				for (let i = 0; i < (typeColumnSpans.length); i++) {
					if (typeColumnSpans[i].innerText.includes("Service")){


						var parentLi = typeColumnSpans[i].closest('li');
						var daysTd = parentLi.querySelector('td.days-column.align-right');

						var popOverSpan = parentLi.querySelector('span.popover_help');
						var popOverContent = popOverSpan.getAttribute('data-content');

						if (popOverContent.startsWith("Days") || popOverContent.startsWith("Hours") || popOverContent.startsWith("Miles") || popOverContent.startsWith("Kilometres")) {
							var timeSuffix = "";
							if (popOverContent.startsWith("Hours")){
								var timeSuffix = "H";
								daysTd.classList.add("makeItalic");
								daysTd.classList.add("time-h");
							} else if (popOverContent.startsWith("Miles")){
								var timeSuffix = "Mi";
								daysTd.classList.add("makeItalic");
								daysTd.classList.add("distance-mi");
							} else if (popOverContent.startsWith("Kilometres")){
								var timeSuffix = "km";
								daysTd.classList.add("makeItalic");
								daysTd.classList.add("distance-km");
							} else {
								daysTd.classList.remove("makeItalic");
							}
							// Find the position of the first "<br>"
							var brPosition = popOverContent.indexOf("<br>");
							// Check if "<br>" is found
							if (brPosition !== -1) {
								// Extract the portion of the string before the first "<br>"
								popOverContent = popOverContent.substring(0, brPosition);
								var wordsArray = popOverContent.split(/\s+/);
								var popOverContent = wordsArray[wordsArray.length - 1];


								daysTd.innerHTML = popOverContent+timeSuffix;
							}
						}

					}
				}




			}

			// create a Set Deal Price link for the grand total if we're not already in a deal
			const grandTotal = document.querySelector('td.grand-total, td.opportunity-total');
			if (grandTotal){
				if (!grandTotal.querySelector('a')) {
					const valueString = grandTotal.innerText;
					grandTotal.innerHTML = `
					<a data-remote="" href="/opportunities/${opportunityID}/set_deal_price_modal">
					<span>${valueString}</span>
				</a>`;
				}
			}

			// add sub hired weight info
			orderViewWeights();

			// Create add description buttons to each item dropdown menu
			const itemRows = document.querySelectorAll('#opportunity_items_body li.grid-body-row');
			itemRows.forEach((itemRow) => {

				const itemId = itemRow.getAttribute('data-id');
				const itemType = itemRow.getAttribute('data-type');
				const itemDropdown = itemRow.querySelector('ul.dropdown-menu');


				const existingDescription = itemRow.querySelector('a.add-description-button');
				

			
					if (!existingDescription){
						
						if (itemDropdown) {
							const addDescriptionButton = document.createElement('li');

							addDescriptionButton.innerHTML = `
									<a data-rp="true" class="add-description-button" data-type="${itemType}" data-id="${itemId}" href="#">
									<i class="icn-cobra-edit"></i>
									Add description
									</a>`;

							// find the item in the dropdown that has the class danger
							const dangerItem = itemDropdown.querySelector('li.danger');
							if (dangerItem) {
								// Insert the new element before the danger item
								itemDropdown.insertBefore(addDescriptionButton, dangerItem);
							} else {
								// If no danger item, insert before the last item
							const lastItem = itemDropdown.lastElementChild;
							itemDropdown.insertBefore(addDescriptionButton, lastItem);
							}
						}
					}
				

				// add warehouse note button

				const existingWarehouseButton = itemRow.querySelector('a.add-warehouse-button');
				if (itemType != "group"){
					if (!existingWarehouseButton){
						if (itemDropdown) {
							const addWarehouseButton = document.createElement('li');

							addWarehouseButton.innerHTML = `
									<a data-rp="true" class="add-warehouse-button" data-id="${itemId}" href="#">
									<i class="icn-cobra-paste3"></i>
									Warehouse note
									</a>`;

							// find the item in the dropdown that has the class danger
							const dangerItem = itemDropdown.querySelector('li.danger');
							if (dangerItem) {
								// Insert the new element before the danger item
								itemDropdown.insertBefore(addWarehouseButton, dangerItem);
							} else {
								// If no danger item, insert before the last item
							const lastItem = itemDropdown.lastElementChild;
							itemDropdown.insertBefore(addWarehouseButton, lastItem);
							}
						}
					}
				}

				
			});


		const newScript = document.createElement('script');
		newScript.src = chrome.runtime.getURL('scripts/order-header-injected.js'); // Path to the external script
		document.documentElement.appendChild(newScript);
		newScript.remove();

		document.addEventListener("click", function(event) {
			// Check if the clicked element is an <button> with data-action "expand" or "collapse"
			if (event.target.matches('button') && (event.target.getAttribute('data-action') === 'expand' || event.target.getAttribute('data-action') === 'collapse')) {
				applyNestedCharges();
			}
			
		});

		// add event listener for mouse hovering over an element with class nested-charge

		// select all li elements with data-nestedcharge
		const nestedChargeElements = document.querySelectorAll('li.grid-body-row[data-nestedcharge]');

	 

		nestedChargeElements.forEach((row) => {
			const element = row.querySelector('.popover_help');
			element.addEventListener('mouseover', function() {
				if (nestedTotals){
					element.innerText = `${currencyPrefix}${parseFloat(row.dataset.originalcharge).toFixed(2)}`
				}
			});
			element.addEventListener('mouseout', function() {
				if (nestedTotals){

					//closestRow = element.closest('li.grid-body-row');
					if (row.classList.contains("dd-collapsed")){

						element.innerText = `${currencyPrefix}${parseFloat(row.dataset.nestedcharge).toFixed(2)}`;
					}
				}
			});

			element.addEventListener('click', function() {
				if (nestedTotals){
					const theRow = element.closest('tbody');
					const theExpandButton = theRow.querySelector('button[data-action="expand"]');
					if (theExpandButton){
						theExpandButton.click();
						applyNestedCharges();
					}
				}
			});
		});




	} // end of order view

		addDetailsRunning = false;
		const endTime = performance.now();
		const duration = endTime - startTime;
		console.log(`addDetails took ${duration} milliseconds`);
		console.log("Total opportunity_items with available data: ", oppData.opportunity_items.length);

	}
}









// New API Call for addDetails
async function opportunityApiCall(opportunityID, type) {
	if (apiKey && apiSubdomain) {

		let apiUrl = `https://api.current-rms.com/api/v1/opportunities/${opportunityID}/opportunity_items`;

		if (type == "detail"){
			console.log("Calling detail API");
			apiUrl = `https://api.current-rms.com/api/v1/opportunities/${opportunityID}/opportunity_items?q[description_present]=1`;
		} else if (type == "update"){
			console.log("Calling update detail API");
			apiUrl = `https://api.current-rms.com/api/v1/opportunities/${opportunityID}/opportunity_items?&q[updated_at_or_item_assets_updated_at_or_item_assets_opportunity_cost_updated_at_gt]=${oppData.time}`;
		}

		// Options for the fetch request
		const fetchOptions = {
			method: 'GET',
			headers: {
				'X-SUBDOMAIN': apiSubdomain,
				'X-AUTH-TOKEN': apiKey,
			},
		};

		try {
			// Make the API call
			const response = await fetch(apiUrl, fetchOptions);

			if (!response.ok) {
				console.error ("API subdomain: "+apiSubdomain);
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			// Parse and return the JSON response
			return await response.json();
		} catch (error) {
			console.error('Error making API request:', error);
			console.error('Failed URL was:', apiUrl);
			console.error("API subdomain: "+apiSubdomain);

			// Retry logic if the error is a network issue
			if (error.message.includes('Failed to fetch')) {
				setTimeout(() => {
					makeToast("toast-error", "Helper failed to fetch from API. Retrying.", 5);
					addDetails();
				}, 5000);
			}

			throw error; // Re-throw the error for further handling
		}
	} else {
		throw new Error('API key or subdomain is missing.');
	}
}



function recallApiDetails(){
	return new Promise(function (resolve, reject) {
		chrome.storage.local.get(["api-details"]).then((result) => {
			const details = result["api-details"];
			if (details && details.apiKey){
				apiKey = details.apiKey;
			} else {
				console.log("No API key saved in local storage.");
			}
			if (details && details.apiSubdomain){
				apiSubdomain = details.apiSubdomain;
			} else {
				console.log("No API Subdomain saved in local storage. Scraping from webpage URL.");
				apiSubdomain = getSubdomainFromUrl(window.location.href);
			}
			resolve();
		});
	});
}





// API Call for quarantines
function quarantineApiCall(){
	return new Promise(function (resolve, reject) {

		//const apiUrl = 'https://api.current-rms.com/api/v1/opportunities/'+opp+'/opportunity_items?page='+pageNumber+'&q[description_present]=1&per_page=100';
		const apiUrl = 'https://api.current-rms.com/api/v1/quarantines?page='+pageNumber+'&per_page=100&q[quarantine_type_not_eq]=3';
		// Options for the fetch request
		const fetchOptions = {
			method: 'GET',
			headers: {
				'X-SUBDOMAIN': apiSubdomain,
				'X-AUTH-TOKEN': apiKey,
			},
		};
		// Make the API call
		fetch(apiUrl, fetchOptions)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then(data => {
				// Handle the API response data here
				//console.log(data);
				quarantineData.quarantines = quarantineData.quarantines.concat(data.quarantines); // merge new page of data into stock_levels
				quarantineData.meta = data.meta; // merge new page of data into meta
				resolve("ok");
			})
			.catch(error => {
				// Handle errors here
				console.error('Error making API request:', error);
				if (error.message.includes('Failed to fetch')) {
					console.log("Failed to fetch from API");
				}
			});

	});
}




function getProdWeight(prod){
	var itemWeight = "0";
	try {
		const prodObject = allProducts.products.find(products => products.name === prod);
		itemWeight = prodObject ? prodObject.weight : null;
	}
		catch(err) {
	}
	if (itemWeight){
		return itemWeight;
	} else {
		return "?"
	}
}

function getProdLocation(prod){

	try {

		const prodObject = allStock.stock_levels.filter(stock_levels => stock_levels.item_name === prod && stock_levels.store_name == storeLocation && stock_levels.location !== "");
		//console.log(prodObject)
		// Extract the "location" property from each object
		const locations = prodObject.map(obj => obj.location);

		// remove duplicate inventories
		const uniqueLocations = [...new Set(locations)];

		console.log(uniqueLocations);

		// Create a string with locations separated by commas
		const locationsString = uniqueLocations.join(', ');
		return locationsString;
	}
		catch(err) {
			console.log(err);
		return "Location error";
	}

}




async function openProductImageModal(prodName){
	var theModal = document.getElementById('product-image-modal');
	var theModalImage = document.getElementById('modal-image');
	var theModalCaption = document.getElementById('product-modal-caption');
	var theModalWeightCaption = document.getElementById('product-modal-weight');
	var theModalLocationCaption = document.getElementById('product-modal-location');
	const theImageUrl = "/assets/ui/product-f16087aa267a8d2b0f689433609f05faba1561eacccf4be8bf9a8052ea4a2fc2.png"
	const itemWeight = getProdWeight(prodName);
	const itemLocation = getProdLocation(prodName)
	theModalImage.src = theImageUrl;
	theModalCaption.innerHTML = prodName;
	theModalWeightCaption.innerHTML = itemWeight+" "+weightUnit;
	theModalLocationCaption.innerHTML = itemLocation + " (" +storeLocation+")";
	theModal.style.display = 'block';

}





// function to get the weight units in use
function getWeightUnit() {
				var element = document.getElementById('weight_total');
				if (element){
					var innerText = element.innerText.trim();
					var words = innerText.split(' ');
					var lastWord = words[words.length - 1];
					weightUnit = lastWord;
				}
		}

// Function to find the closest <li> parent
function findClosestLi(element) {
		while (element && element.tagName !== "LI") {
				element = element.parentNode;
		}
		return element;
}

function sayWord(speakWord){
	if (!muteExtensionSounds){
		console.log("Speaking: "+speakWord);

		chrome.runtime.sendMessage({action: 'speak', text: speakWord}, response => {
			if (response?.spoken) {
				console.log('Speech complete');
			}
		});

 
	}
}

// Function that takes in a string and returns the first word inside single quotes. This is to extract the asset number from a message.
function extractAsset(inputString) {
	const match = inputString.match(/'([^']+)'/);
	return match ? match[1] : null;
}

// This is a special version of extractAsset that returns the asset number, but with with spaces inbetween each character. This is so that it will be spoken like "one zero zero six" instead of "one-thousand-and-six"
function extractAssetToSay(inputString) {
	const match = inputString.match(/'([^']+)'/);
	if (match) {
		const word = match[1];
		return word.split('').join(' ');
	} else {
		return null;
	}
}


// function to find the name of an asset if it appears on the page already (ie. an item already scanned)
function findAssetName(assetToName) {
		// Find all elements with class "optional-01 asset asset-column"
		var assetColumns = document.querySelectorAll('.optional-01.asset.asset-column');

		// Loop through each element to find the one with the matching asset number
		for (var i = 0; i < assetColumns.length; i++) {
				var assetNumberElement = assetColumns[i].querySelector('a');

				// Check if the asset number matches the input
				if (assetNumberElement && assetNumberElement.innerText === assetToName) {
						// Find the parent row (tr) element
						var parentRow = assetColumns[i].closest('tr');

						// Find the preceding "essential asset dd-name" element within the same row
						var essentialAssetElement = parentRow.querySelector('.essential.asset.dd-name');

						// Check if the essentialAssetElement exists
						if (essentialAssetElement) {
								// Return the inner text of the essentialAssetElement
								const nameString = essentialAssetElement.innerText.trim();

								// Check if the inputString starts with "Collapse"
								if (nameString.startsWith("Collapse")) {
									// Remove the prefix and return the rest of the string
									return nameString.slice("Collapse".length);
								} else {
									// Return the original string if it doesn't start with "Collapse"
									return nameString;
								}
						}
				}
		}

		// Return null if the assetToName is not found
		return null;
}



// function to find the toast-message element that is the child of toast-container
function findSecondDescendant(parent, tagname)
{
	 parent = document.getElementById(parent);
	 var descendants = parent.getElementsByTagName(tagname);
	 if ( descendants.length > 2 )
			return descendants[2];
	 return null;
}

function indexOfSecondSingleQuote(inputString) {
	// Find the index of the first single quote
	const firstQuoteIndex = inputString.indexOf("'");

	// If the first quote is found, find the index of the second quote starting from the position after the first quote
	if (firstQuoteIndex !== -1) {
		const secondQuoteIndex = inputString.indexOf("'", firstQuoteIndex + 1);

		// If the second quote is found, return its index; otherwise, return -1
		if (secondQuoteIndex !== -1) {
			return secondQuoteIndex;
		}
	}
	// If no second quote is found, return -1
	return -1;
}



// Function that scrapes the page for every asset listed and add it to a global array. This is to be able to check if an item is already allocated, etc
function listAssets() {
		// Select all table cells with the specified class
	const cells = document.querySelectorAll('.optional-01.asset.asset-column');

	// Create an array to store the cell values
	assetsOnTheJob = [];

	// Create an array to store values that are also booked out
	assetsBookedOut = [];
	// Loop through each cell
	cells.forEach((cell) => {
		// Get the trimmed text content of the cell
		const cellValue = cell.textContent.trim();

		// Exclude values that are "Group Booking" or "Bulk Stock"
		if (cellValue !== "Group Booking" && cellValue !== "Bulk Stock") {
			assetsOnTheJob.push(cellValue); // Add the cell value to the array
			const cellRow = cell.closest("tr");
			const statusCell = cellRow.querySelector("td.status-column");
			if (statusCell.innerText == "Booked Out"){
				assetsBookedOut.push(cellValue); // Add the cell value to the array
			}
		}
	});
}

// function that scrapes the global check-in page for items listed as being already scanned.
function listGlobalCheckedItems() {
	const cells = document.querySelectorAll('.optional-01');
	// Create an array to store the cell values
	assetsGlobalScanned = [];
	cells.forEach((cell) => {
		// Get the trimmed text content of the cell
		const cellValue = cell.textContent.trim();
		assetsGlobalScanned.push(cellValue); // Add the cell value to the array
	});
}


// function that scrapes the global check-in page for items listed as being already scanned.
function listContainerAssets() {
	assetsInContainer = [];
	const containerBody = document.getElementById('serialised_components_body');

	const containerRows = containerBody.querySelectorAll('tr');

	containerRows.forEach((row) => {
		const rowValue = row.querySelector('td.essential').innerText.trim();
		if (rowValue != "Bulk Stock"){
			assetsInContainer.push(rowValue); // Add the cell value to the array
		}
	});
}



// Function that scrapes the page for every product listed and returns it as an array
function listProducts() {
	const cells = document.querySelectorAll('.essential.asset.dd-name');
  
	return Array.from(cells, cell => {
	  // grab the raw text
	  let text = cell.textContent;
  
	  // remove the literal words, icons, and collapse all runs of whitespace/newlines to a single space
	  text = text
		.replace(/CollapseExpand/g, '')
		.replace(/🔎/g, '')
		.replace(/\s+/g, ' ')
		.trim();
  
	  return text;
	});

}
// Function that scrapes the page for every product listed and in status Reserved, and returns it as an array
function listReservedProducts() {
	// grab all product-name cells
	const cells = document.querySelectorAll('.essential.asset.dd-name');
  
	return Array.from(cells)
	  // first filter down to only rows where status === "Reserved"
	  .filter(cell => {
		// climb to the enclosing row
		const row = cell.closest('tr');
		if (!row) return false;
		// find the status cell in that row
		const statusCell = row.querySelector('td.essential.status-column');
		return statusCell && statusCell.textContent.trim() === 'Reserved';
	  })
	  // then map each remaining cell to its cleaned text
	  .map(cell => {
		let text = cell.textContent;
		return text
		  .replace(/CollapseExpand/g, '')
		  .replace(/🔎/g, '')
		  .replace(/\s+/g, ' ')
		  .trim();
	  });
}





// This function helps to reformat crazy long lists that sometimes occur.
function processHtmlToList(html) {
	// Create a temporary element to hold the HTML
	const tempElement = document.createElement('div');
	tempElement.innerHTML = html;

	// Remove all formatting tags and the specified phrase
	const listItems = tempElement.querySelectorAll('ul li');
	listItems.forEach((item) => {



		if (item.innerHTML.includes("Inspect Now")){

			var inspectionLink = extractHref(item.innerHTML)
			// Remove formatting tags
			item.innerHTML = item.innerHTML.replace(/<[^>]*>/g, '');

			// Remove the specified phrase
			item.innerHTML = item.innerHTML.replace(/Inspect Now/g, '');

			// Add a test link to the end
			item.innerHTML = item.innerHTML.concat(" " + "<span class='inspect-link'><a href='"+inspectionLink+"'> Inspect Now </a></span>");

		} else {
			// Remove formatting tags
			item.innerHTML = item.innerHTML.replace(/<[^>]*>/g, '');
		}


	});

	// Convert the list items to an array of strings
	//const resultList = Array.from(listItems, (item) => item.textContent.trim());
	const resultList = Array.from(listItems, (item) => item.innerHTML.trim());

	// Clean up the temporary element
	tempElement.remove();
	//console.log(resultList);
	return resultList;
}


function extractHref(htmlString) {
		// Create a temporary element to parse the HTML string
		var tempElement = document.createElement('div');
		tempElement.innerHTML = htmlString;

		// Find the first <a> tag inside the temporary element
		var anchorElement = tempElement.querySelector('a');

		// Check if the <a> tag is found and return its href attribute
		if (anchorElement) {
				return anchorElement.getAttribute('href');
		} else {
				return null; // Return null if no <a> tag is found
		}
}

function extractButton(htmlString) {
		// Create a temporary element to parse the HTML string
		var tempElement = document.createElement('div');
		tempElement.innerHTML = htmlString;

		// Find the first button inside the temporary element
		var buttonElement = document.querySelector('.btn.btn-success');

		// Check if the button is found and return its href attribute
		if (buttonElement) {

				return buttonElement.outerHTML;
		} else {
				return null; // Return null if no button is found
		}
}






// Notes button pressed
function notesButton(){
	var element = document.getElementById("notes-button");
	if (notesHidden){
		notesHidden = false;
		unhideItemDescriptions();
		element.classList.remove("turned-on");
		element.classList.remove("strike-through");
		//element.innerHTML = "Hide Notes";
	} else {
		notesHidden = true;
		hideItemDescriptions();
		element.classList.add("turned-on");
		element.classList.add("strike-through");
		//element.innerHTML = "Notes Hidden";
	}
	focusInput();
}

// hide item description rows
function hideItemDescriptions() {
	// Get all elements with the class "item-description-cell"
	const elements = document.getElementsByClassName("item-description-row");

	// Iterate through the elements and add the class "hide-description"
	for (let i = 0; i < elements.length; i++) {
		elements[i].classList.add("hide-description");
	}
}

// unhide item description rows
function unhideItemDescriptions() {
	// Get all elements with the class "item-description-cell"
	const elements = document.getElementsByClassName("item-description-row");

	// Iterate through the elements and add the class "hide-description"
	for (let i = 0; i < elements.length; i++) {
		elements[i].classList.remove("hide-description");
	}
}









// Prepared button pressed
function preparedButton(){
	var element = document.getElementById("prepared-button");
	if (preparedHidden){
		preparedHidden = false;
		unhidePrepared();
		element.classList.remove("turned-on");
		element.classList.remove("strike-through");
		//element.innerHTML = "Hide Prepared";
	} else {
		preparedHidden = true;
		hidePrepared();
		element.classList.add("turned-on");
		element.classList.add("strike-through");
		//element.innerHTML = "Prepared Hidden";
	}
	focusInput();
}



function hidePrepared() {
		// Find the <ol> with id "opportunity_item_assets_body"
		var opportunityList = document.getElementById("opportunity_item_assets_body");

		// Check if the list exists
		if (opportunityList) {
				// Get all <li> elements within the <ol>
				var listItems = opportunityList.getElementsByTagName("li");

				// Iterate through each <li> element
				for (var i = 0; i < listItems.length; i++) {

						// Get all <tr> elements with class "status-column" within the current <li>
						var statusRows = listItems[i].getElementsByClassName("status-column");
						// Assume the default background color is yellow
						var hideThis = true;

						// Check if any <tr> has inner text not including "Prepared"
						for (var j = 0; j < statusRows.length; j++) {
								if (statusRows[j].innerText.indexOf("Prepared") === -1) {
										// If found, set the background color to red
										hideThis = false;
										break; // No need to check further
								}
						}

						// ignore dropdown menu elements
						if (listItems[i].parentElement.tagName === 'UL' && listItems[i].parentElement.classList.contains('dropdown-menu')) {
							// If the parent is a UL with class "dropdown-menu"
							hideThis = false;
						}


						// Hide the row
						if (hideThis){
							listItems[i].classList.add("hide-prepared");

							//uncheck the check box for this row
							try {
								listItems[i].querySelector("input.item-select").checked = false;
							} catch (e) {
							}

						}
				}
		}
}

function unhidePrepared() {
		// Find the <ol> with id "opportunity_item_assets_body"
		var opportunityList = document.getElementById("opportunity_item_assets_body");

		// Check if the list exists
		if (opportunityList) {
				// Get all <li> elements within the <ol>
				var listItems = opportunityList.getElementsByTagName("li");
				// Iterate through each <li> element
				for (var i = 0; i < listItems.length; i++) {
						// Unhide the row
						listItems[i].classList.remove("hide-prepared");
				}
		}
}


// Hide Booked Out button pushed

function bookedOutButton(){
	var element = document.getElementById("booked-out-button");
	if (bookedOutHidden){
		bookedOutHidden = false;
		unhideBookedOut();
		element.classList.remove("turned-on");
		element.classList.remove("strike-through");
		element.innerHTML = "Booked Out";
	} else {
		bookedOutHidden = true;
		hideBookedOut();
		element.classList.add("turned-on");
		element.classList.add("strike-through");
		element.innerHTML = "Booked Out";
	}
	focusInput();
}



function hideBookedOut() {
		// Find the <ol> with id "opportunity_item_assets_body"
		var opportunityList = document.getElementById("opportunity_item_assets_body");

		// Check if the list exists
		if (opportunityList) {
				// Get all <li> elements within the <ol>
				var listItems = opportunityList.getElementsByTagName("li");



				// Iterate through each <li> element
				for (var i = 0; i < listItems.length; i++) {

						// Get all <tr> elements with class "status-column" within the current <li>
						var statusRows = listItems[i].getElementsByClassName("status-column");

						var hideThis = true;
						// Check if any <tr> has inner text not including "Booked Out"
						for (var j = 0; j < statusRows.length; j++) {
								if (statusRows[j].innerText.indexOf("Booked Out") === -1) {
										hideThis = false;
										break; // If found, we will ignore this item in the list
								}
						}

						// ignore dropdown menu elements
						if (listItems[i].parentElement.tagName === 'UL' && listItems[i].parentElement.classList.contains('dropdown-menu')) {
							// If the parent is a UL with class "dropdown-menu"
							hideThis = false;
						}


						// Hide the row
						if (hideThis){
							listItems[i].classList.add("hide-booked-out");

							//uncheck the check box for this row
							try {
								listItems[i].querySelector("input.item-select").checked = false;
							} catch (e) {
							}

						}
				}
		}
}

function unhideBookedOut() {
		// Find the <ol> with id "opportunity_item_assets_body"
		var opportunityList = document.getElementById("opportunity_item_assets_body");

		// Check if the list exists
		if (opportunityList) {
				// Get all <li> elements within the <ol>
				var listItems = opportunityList.getElementsByTagName("li");
				// Iterate through each <li> element
				for (var i = 0; i < listItems.length; i++) {
						// Unhide the row
						listItems[i].classList.remove("hide-booked-out");
				}
		}
}


// Hide Checked-In button pushed

// Hide Booked Out button pushed

function checkedInButton(){
	var element = document.getElementById("checked-in-button");
	if (checkedInHidden){
		checkedInHidden = false;
		unhideCheckedIn();
		element.classList.remove("turned-on");
		element.classList.remove("strike-through");
		//element.innerHTML = "Checked In";
	} else {
		checkedInHidden = true;
		hideCheckedIn();
		element.classList.add("turned-on");
		element.classList.add("strike-through");
		//element.innerHTML = "Checked In";
	}
	focusInput();
}



function hideCheckedIn() {
		// Find the <ol> with id "opportunity_item_assets_body"
		var opportunityList = document.getElementById("opportunity_item_assets_body");

		// Check if the list exists
		if (opportunityList) {
				// Get all <li> elements within the <ol>
				var listItems = opportunityList.getElementsByTagName("li");

				// Iterate through each <li> element
				for (var i = 0; i < listItems.length; i++) {

						// Get all <tr> elements with class "status-column" within the current <li>
						var statusRows = listItems[i].getElementsByClassName("status-column");

						var hideThis = true; // assume it will be hidden, unless we find a reason not to

						// Check if any <tr> has inner text not including "Checked In" or "Completed"
						for (var j = 0; j < statusRows.length; j++) {
								if ((statusRows[j].innerText.indexOf("Part") !== -1) || (statusRows[j].innerText.indexOf("Checked In") === -1 && statusRows[j].innerText.indexOf("Completed") === -1)) {

										// If found, we will ignore this item in the list and it won't be hidden
										hideThis = false;
										break; // No need to check further
								}
						}

						// ignore dropdown menu elements
						if (listItems[i].parentElement.tagName === 'UL' && listItems[i].parentElement.classList.contains('dropdown-menu')) {
							// If the parent is a UL with class "dropdown-menu"
							hideThis = false;
						}

						// Hide the row
						if (hideThis){
							listItems[i].classList.add("hide-checked-in");

							//uncheck the check box for this row
							try {
								listItems[i].querySelector("input.item-select").checked = false;
							} catch (e) {
							}

						}
				}
		}
}

function unhideCheckedIn() {
		// Find the <ol> with id "opportunity_item_assets_body"
		var opportunityList = document.getElementById("opportunity_item_assets_body");

		// Check if the list exists
		if (opportunityList) {
				// Get all <li> elements within the <ol>
				var listItems = opportunityList.getElementsByTagName("li");
				// Iterate through each <li> element
				for (var i = 0; i < listItems.length; i++) {
						// Unhide the row
						listItems[i].classList.remove("hide-checked-in");
				}
		}
}


// Bulk Only button pressed
function bulkButton(){
	var element = document.getElementById("bulk-button");
	if (bulkOnly){
		bulkOnly = false;
		unHideNonBulkRows();
		element.classList.remove("turned-on");
		element.innerHTML = "Bulk Only";
	} else {
		bulkOnly = true;
		hideNonBulkRows();
		element.classList.add("turned-on");
		element.innerHTML = "Bulk Only";
	}
	focusInput();
}




// Hide non bulk item bookings
function hideNonBulkRows() {

	// Find the <ol> with id "opportunity_item_assets_body"
	var opportunityList = document.getElementById("opportunity_item_assets_body");
	// Check if the list exists
	if (opportunityList) {

		// first hide groups that contains no bulk at all.
		// Get all li in the document
		var lis = opportunityList.querySelectorAll('li.grid-body-row');
		for (var n = 0; n < lis.length; n++) {
			var containsBulk = false;
			var liStatusCells = lis[n].querySelectorAll('.asset-column');
			for (var s = 0; s < liStatusCells.length; s++) {
				if (liStatusCells[s].innerText.includes('Bulk Stock') || liStatusCells[s].innerText.includes('Non-Stock Booking') || liStatusCells[s].innerText.includes('Asset Number')){
				containsBulk = true;
				}
			}
			if (!containsBulk){
				lis[n].classList.add('hide-nonbulk')

				//uncheck the check box for this row
				try {
					lis[n].querySelector("input.item-select").checked = false;
				} catch (e) {
				}
			}
		}


		// Get all table rows in the document
		var rows = opportunityList.querySelectorAll('tr');

		// Iterate through each row
		for (var i = 0; i < rows.length; i++) {
			// Get the status cell in the current row
			try {
				var statusCell = rows[i].querySelector('.asset-column');
				// Check if the status cell contains the specified content
				if (statusCell.innerText.includes('Bulk Stock') || statusCell.innerText.includes('Non-Stock Booking') || statusCell.innerText.includes('Asset Number')) {
					// Skip this row
				} else {
					// Hide the entire row

					//var thisItem = statusCell.closest("table");
					//thisItem.classList.add('hide-nonbulk');
					rows[i].classList.add('hide-nonbulk');
					//uncheck the check box for this row
					try {
						rows[i].querySelector("input.item-select").checked = false;
					} catch (e) {
					}
				}
			} catch(err) {
				//console.log(err);
			}
		}
	}
}


// Unhide subrent bookings
function unHideNonBulkRows() {

	// Find the <ol> with id "opportunity_item_assets_body"
	var opportunityList = document.getElementById("opportunity_item_assets_body");
	// Check if the list exists
	if (opportunityList) {
		// Get all table rows in the document
		var lists = opportunityList.querySelectorAll('.hide-nonbulk');

		// Iterate through each row
		for (var i = 0; i < lists.length; i++) {
			// Get the status cell in the current row
			try {
				lists[i].classList.remove('hide-nonbulk');
			} catch(err) {
				console.log(err);
			}
		}
	}
}




// Subhires button pressed
function subhiresButton(){
	var element = document.getElementById("subhires-button");
	if (subhiresHidden){
		subhiresHidden = false;
		unHideSubHires();
		element.classList.remove("turned-on");
		element.classList.remove("strike-through");
		//element.innerHTML = "Hide Sub-Rents";
	} else {
		subhiresHidden = true;
		hideSubHires();
		element.classList.add("turned-on");
		element.classList.add("strike-through");
		//element.innerHTML = "Sub-Rents Hidden";
	}
	focusInput();
}


// Hide subrent bookings
function hideSubHires() {

	// Find the <ol> with id "opportunity_item_assets_body"
	var opportunityList = document.getElementById("opportunity_item_assets_body");
	// Check if the list exists
	if (opportunityList) {
		// Get all table rows in the document
		var rows = opportunityList.querySelectorAll('tr');

		// Iterate through each row
		for (var i = 0; i < rows.length; i++) {
			// Get the status cell in the current row
			try {

				var statusCell = rows[i].querySelector('.asset-column');

				// Check if the status cell contains the specified content
				if (statusCell.innerText.includes('Sub-Rent Booking')) {
					var thisItem = statusCell.closest("li");
					thisItem.classList.add('hide-subhire');
					//uncheck the check box for this row
					try {
						thisItem.querySelector("input.item-select").checked = false;
					} catch (e) {
					}
				}
			} catch(err) {
				//console.log(err);
			}
		}
	}
}


// Unhide subrent bookings
function unHideSubHires() {

	// Find the <ol> with id "opportunity_item_assets_body"
	var opportunityList = document.getElementById("opportunity_item_assets_body");
	// Check if the list exists
	if (opportunityList) {
		// Get all table rows in the document
		var lists = opportunityList.querySelectorAll('li.hide-subhire');

		// Iterate through each row
		for (var i = 0; i < lists.length; i++) {
			// Get the status cell in the current row
			try {
				lists[i].classList.remove('hide-subhire');
			} catch(err) {
				console.log(err);
			}
		}
	}
}



// Subhires button pressed
function nonsubsButton(){
	var element = document.getElementById("nonsubs-button");
	console.log("hiding non subs");
	if (nonsubsHidden) {
		nonsubsHidden = false;
		unHideNonSubs();
		element.classList.remove("turned-on");
		element.innerHTML = "Sub-Rents Only";
	} else {
		nonsubsHidden = true;
		hideNonSubs();
		element.classList.add("turned-on");
		element.innerHTML = "Sub-Rents Only";
		console.log("hiding non subs");
	}
	focusInput();
}


// Hide subrent bookings
function hideNonSubs() {

	// Find the <ol> with id "opportunity_item_assets_body"
	var opportunityList = document.getElementById("opportunity_item_assets_body");
	// Check if the list exists
	if (opportunityList) {

		// first hide groups that contains no sub hires at all.
		// Get all li in the document
		var lis = opportunityList.querySelectorAll('li.grid-body-row');
		for (var n = 0; n < lis.length; n++) {
			var containsSubs = false;
			var liStatusCells = lis[n].querySelectorAll('.asset-column');
			for (var s = 0; s < liStatusCells.length; s++) {
				if (liStatusCells[s].innerText.includes('Sub-Rent Booking')){
				containsSubs = true;
				}
			}
			if (!containsSubs){
				lis[n].classList.add('hide-nonsub')
				try {
					lis[n].querySelector("input.item-select").checked = false;
				} catch (e) {
				}
			}
		}


		// Get all table rows in the document
		var rows = opportunityList.querySelectorAll('tr');

		// Iterate through each row
		for (var i = 0; i < rows.length; i++) {
			// Get the status cell in the current row
			try {

				var statusCell = rows[i].querySelector('.asset-column');

				// Check if the status cell contains the specified content
				if (statusCell.innerText.includes('Sub-Rent Booking') || statusCell.innerText.includes('Asset Number')) {
					//Skip this item
				} else{
					rows[i].classList.add('hide-nonsub');
					try {
						rows[i].querySelector("input.item-select").checked = false;
					} catch (e) {
					}
				}
			} catch(err) {
				//console.log(err);
			}
		}
	}
}


// Unhide subrent bookings
function unHideNonSubs() {

	// Find the <ol> with id "opportunity_item_assets_body"
	var opportunityList = document.getElementById("opportunity_item_assets_body");
	// Check if the list exists
	if (opportunityList) {
		// Get all table rows in the document
		var lists = opportunityList.querySelectorAll('.hide-nonsub');

		// Iterate through each row
		for (var i = 0; i < lists.length; i++) {
			// Get the status cell in the current row
			try {
				lists[i].classList.remove('hide-nonsub');
			} catch(err) {
				console.log(err);
			}
		}
	}
}






// Shortages only button pressed
function nonShortsButton(){
	var element = document.getElementById("nonshorts-button");
	if (nonShortsHidden) {
		nonShortsHidden = false;
		unHideNonShorts();
		element.classList.remove("turned-on");
		element.innerHTML = "Shorts Only";
	} else {
		nonShortsHidden = true;
		hideNonShorts();
		element.classList.add("turned-on");
		element.innerHTML = "Shorts Only";
		console.log("hiding non shorts");
	}
	focusInput();
}


// Hide subrent bookings
function hideNonShorts() {

	// Find the <ol> with id "opportunity_item_assets_body"
	if (detailView){
		var opportunityList = document.getElementById("opportunity_item_assets_body");
		// Check if the list exists
		if (opportunityList) {
			// MAKE ALL <li> ELEMENTS THAT CONTAIN A SHORTAGE VISIBLE
			// Select all <tr> elements with the class 'shortage'
			const shortageTRs = opportunityList.querySelectorAll('tr.shortage');

			// Initialize an array to store the <li> elements that match the criteria
			const matchingLIs = [];

			// Iterate over each <tr> element with the class 'shortage'
			shortageTRs.forEach(tr => {
				// Move up the DOM tree to find an enclosing <li> with the class 'dd-collapsed'
				let parent = tr.parentElement;
				while (parent) {
					if (parent.tagName === 'LI' && parent.classList.contains('dd-collapsed')) {
						// If such an <li> is found, add it to the array
						matchingLIs.push(parent);
						break; // Stop the loop once the matching <li> is found
					}
					parent = parent.parentElement; // Move to the next parent element
				}
			});

			// Now matchingLIs contains all <li> elements you are interested in
			// Optionally, remove duplicates if any <tr>.shortage is in the same <li>
			const uniqueMatchingLIs = Array.from(new Set(matchingLIs));

			console.log(uniqueMatchingLIs.length);
			for (var h = 0; h < uniqueMatchingLIs.length; h++) {
				uniqueMatchingLIs[h].classList.add("force-display-block");
			}

			// MAKE ALL <ol> ELEMENTS THAT CONTAIN A SHORTAGE VISIBLE
			// Select all <tr> elements with the class 'shortage'
			//const shortageTRs = opportunityList.querySelectorAll('tr.shortage');

			// Create a Set to store unique <ol> elements
			const olElements = new Set();

			// Iterate over the selected <tr> elements
			shortageTRs.forEach(tr => {
				// Move up the DOM tree to find the enclosing <ol> element
				let parent = tr.parentElement;
				while (parent) {
					if (parent.tagName === 'OL') {
						// If an <ol> parent is found, add it to the Set
						olElements.add(parent);
						break; // Stop the loop once the <ol> is found
					}
					parent = parent.parentElement; // Move to the next parent element
				}
			});

			// Convert the Set to an array if you need to work with an array
			const olElementsArray = Array.from(olElements);
			for (var o = 0; o < olElementsArray.length; o++) {
				olElementsArray[o].classList.add("force-display-block");
			}




			// first hide groups that contains no sub hires at all.
			// Get all li in the document
			var lis = opportunityList.querySelectorAll('li.grid-body-row');
			for (var n = 0; n < lis.length; n++) {
				var containsShorts = false;
				var liStatusCells = lis[n].querySelectorAll('tr');
				for (var s = 0; s < liStatusCells.length; s++) {
					if (liStatusCells[s].classList.contains('shortage')){
					containsShorts = true;
					}
				}
				if (!containsShorts){
					lis[n].classList.add('hide-nonshort')
					try {
						lis[n].querySelector("input.item-select").checked = false;
					} catch (e) {
					}

			} else {
					for (var s = 0; s < liStatusCells.length; s++) {
						var thisGroupName = liStatusCells[s].querySelector(".group-name");
						if (liStatusCells[s].classList.contains('shortage') || thisGroupName){
							// skip
						} else {
							liStatusCells[s].classList.add('hide-nonshort');
							try {
								liStatusCells[s].querySelector("input.item-select").checked = false;
								liStatusCells[s].querySelector("input.item-select").disabled = true;
							}
							catch(err){
								console.log(err);
							}
						}
					}
				}

			}




		}
	} else if (orderView){
		


		var opportunityList = document.getElementById("opportunity_items_scrollable");
		// Check if the list exists
		if (opportunityList) {

			// MAKE ALL <li> ELEMENTS THAT CONTAIN A SHORTAGE VISIBLE
			// Select all <tr> elements with the class 'shortage'
			const shortageTRs = opportunityList.querySelectorAll('tr.shortage');

			// Initialize an array to store the <li> elements that match the criteria
			const matchingLIs = [];

			// Iterate over each <tr> element with the class 'shortage'
			shortageTRs.forEach(tr => {
				// Move up the DOM tree to find an enclosing <li> with the class 'dd-collapsed'
				let parent = tr.parentElement;
				while (parent) {
					if (parent.tagName === 'LI' && parent.classList.contains('dd-collapsed')) {
						// If such an <li> is found, add it to the array
						matchingLIs.push(parent);
						break; // Stop the loop once the matching <li> is found
					}
					parent = parent.parentElement; // Move to the next parent element
				}
			});

			// Now matchingLIs contains all <li> elements you are interested in
			// Optionally, remove duplicates if any <tr>.shortage is in the same <li>
			const uniqueMatchingLIs = Array.from(new Set(matchingLIs));

			for (var h = 0; h < uniqueMatchingLIs.length; h++) {
				uniqueMatchingLIs[h].classList.add("force-display-block");
			}





			// MAKE ALL <ol> ELEMENTS THAT CONTAIN A SHORTAGE VISIBLE
			// Select all <tr> elements with the class 'shortage'
			//const shortageTRs = opportunityList.querySelectorAll('tr.shortage');

			// Create a Set to store unique <ol> elements
			const olElements = new Set();

			// Iterate over the selected <tr> elements
			shortageTRs.forEach(tr => {
				// Move up the DOM tree to find the enclosing <ol> element
				let parent = tr.parentElement;
				while (parent) {
					if (parent.tagName === 'OL') {
						// If an <ol> parent is found, add it to the Set
						olElements.add(parent);
						break; // Stop the loop once the <ol> is found
					}
					parent = parent.parentElement; // Move to the next parent element
				}
			});

			// Convert the Set to an array if you need to work with an array
			const olElementsArray = Array.from(olElements);
			for (var o = 0; o < olElementsArray.length; o++) {
				olElementsArray[o].classList.add("force-display-block");
			}




			// first hide groups that contains no sub hires at all.
			// Get all li in the document
			var lis = opportunityList.querySelectorAll('li.grid-body-row');
			for (var n = 0; n < lis.length; n++) {
				var containsShorts = false;
				var liStatusCells = lis[n].querySelectorAll('tr');
				for (var s = 0; s < liStatusCells.length; s++) {
					if (liStatusCells[s].classList.contains('shortage')){
					containsShorts = true;
					}
				}
				if (!containsShorts){
					lis[n].classList.add('hide-nonshort')

			} else {
					for (var s = 0; s < liStatusCells.length; s++) {
						var thisGroupName = liStatusCells[s].querySelector(".group-name");
						if (liStatusCells[s].classList.contains('shortage') || thisGroupName){
							// skip
						} else {
							liStatusCells[s].classList.add('hide-nonshort');
							if (detailView){
								try {
									liStatusCells[s].querySelector("input.item-select").checked = false;
								}
							
								catch(err){
									console.log(err);
								}
							}
						}
					}
				}

			}

		}
	}

}


// Unhide subrent bookings
function unHideNonShorts() {

	// Find the <ol> with id "opportunity_item_assets_body"
	if (detailView){
		var opportunityList = document.getElementById("opportunity_item_assets_body");
	} else if (orderView){
		var opportunityList = document.getElementById("opportunity_items_scrollable");
	}
	// Check if the list exists
	if (opportunityList) {
		// Get all table rows in the document
		var lists = opportunityList.querySelectorAll('.hide-nonshort');

		// Iterate through each row
		for (var i = 0; i < lists.length; i++) {
			try {
				lists[i].classList.remove('hide-nonshort');
			} catch(err) {
				console.log(err);
			}
		}

		var forcedVisible = opportunityList.querySelectorAll('.force-display-block');
		for (var i = 0; i < forcedVisible.length; i++) {
			try {
				forcedVisible[i].classList.remove('force-display-block');
			} catch(err) {
				console.log(err);
			}
		}


		var boxes = opportunityList.querySelectorAll('input.item-select');
		// Iterate through each input box
		for (var i = 0; i < boxes.length; i++) {
			// Get the status cell in the current row
			try {
				boxes[i].disabled = false;
			} catch(err) {
				console.log(err);
			}
		}
	}
}









function updateHidings(){
	if (preparedHidden){
		hidePrepared();
	}
	if (bulkOnly){
		hideNonBulkRows();
	}
	if (subhiresHidden){
		hideSubHires();
	}
	if (nonsubsHidden){
		hideNonSubs();
	}
}



// This function gets run whenever the page reloads, to catch messages that only appear on reload and so don't get caught by the normal toastMessage script.
// This includes actions like reverting the status of an item.
function listToastPosts() {
	// Select all elements with the toast message type classes
	const cells = document.querySelectorAll('.toast.toast-error, .toast.toast-success, .toast.toast-warning');

	// Create an array to store the cell values
	toastPosts = []; // for storing text content
	toastPostsHtml = []; // for storing innerHTML

	// Loop through each cell and add contents to the arrays
	cells.forEach((cell) => {
		// Get the trimmed text content of the cell
		const cellValue = cell.textContent.trim();
		const cellHtml = cell.innerHTML;
		toastPosts.push(cellValue); // Add the cell value to the array
		toastPostsHtml.push(cellHtml);
		//console.log("This ToastPost:");
		//console.log(cell.innerHTML);
		setTimeout(function () {
			destroyAfterTime(cell, errorTimeout);
		}, 500);

	});

	if (toastPosts.length > 0) {

		// Overide the css display properties of the toast container so that it is readable if it overflows the height of the window.
		document.getElementById("toast-container").style.overflowY = "scroll";
		document.getElementById("toast-container").style.maxHeight = "95vh";


		// Log the messages that have been generated
		console.log("toastPosts messages found:");
		console.log(toastPosts);

		listOfIssueItems = processHtmlToList(toastPostsHtml);
		//console.log(listOfIssueItems);

		if (toastPosts[0] == "Successfully checked shortages" && toastPosts.length > 1){ // in this scenario we're potentially expecting overdue inspection flags.

			// rebuild the list of shortages to add information

			newList = '<div class="toast-message"><ul>';
			listOfIssueItems.forEach((item) => {

				if (item.includes("before or during the opportunity.")){ // if it's an overdue inspection flag
					const badItem = extractAsset(item);
					insertIndex = 1 + indexOfSecondSingleQuote(item);

					var assetName = findAssetName(badItem);
					if (assetName == null){
						assetName = "";
					}

					newList = newList + '<li>'+item.substring(0,insertIndex+1)+assetName+item.substring(insertIndex)+'</li><hr>';
				} else {
					newList = newList + '<li>'+item+'</li><hr>';
				}
			});

			newList = newList + "</ul></div>"

			// find the existing message box that is targetted by CRMS javascript to be able to close
			const listTarget = findSecondDescendant("toast-container", "div");

			// write in the editted list
			listTarget.innerHTML = newList;

		} else if (toastPosts[0].includes("Quarantine book out successful")){
			// tell the service worker to refresh quarantine data
			console.log("Quarantine book out successful, refreshing quarantines");
			chrome.runtime.sendMessage("refreshQuarantines");

		} else if (toastPosts[0] == "Quarantine was successfully created."){
			console.log("Quarantine was successfully created, refreshing quarantines");
			// tell the service worker to refresh quarantine data
			chrome.runtime.sendMessage("refreshQuarantines");

		} else if (toastPosts.includes("Failed to revert the status of the allocation(s)")){
			error_sound.play();
			setTimeout(function() {
				sayWord("Failed to revert.");
			}, 900);

		} else if (toastPosts.includes("The requested record could not be found. It may have been removed by another user.")){
			error_sound.play();
			setTimeout(function() {
				sayWord("Container not found.");
			}, 900);

		} else if (toastPosts.includes("The status of the allocation(s) was successfully reverted")){
			scanSound();
		} else if (toastPosts.includes("Asset(s) successfully reset")){
			scanSound();
		} else if (toastPosts.includes("Stock Level was successfully created.")){
			scanSound();
		} else if (toastPosts.includes("Allocation successful")){
			scanSound();
		} else if (toastPosts.includes("Please correct the following errors and try again:-Asset Number has already been taken")){
			error_sound.play();
			setTimeout(function() {
				sayWord("Asset number already taken.");
			}, 900);
		} else if (toastPosts.includes("Please correct the following errors and try again:-The number of allocations must match the item quantity.")){
			error_sound.play();
			setTimeout(function() {
				sayWord("Allocations must add up to the total quantity.");
			}, 900);
		}
	};
}



// function that looks for any changes to the webpage once it has loaded, and triggers responses if these are relevant.
const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		//console.log(mutation.addedNodes);
		const addedNodes = Array.from(mutation.addedNodes);
		const removedNodes = Array.from(mutation.removedNodes);
		//console.log(removedNodes);

		// Check if any removed node has the class "modal-backdrop" and "fade" (ie. it's the Quick Picker)
		 const isModalBackdropRemoved = removedNodes.some(node => node.classList && node.classList.contains("modal-backdrop") && node.classList.contains("fade"));
		 if (isModalBackdropRemoved) {
			 addDetails();
		 }


		const toastMessages = addedNodes.filter((node) => node.classList?.contains("toast")); // filters the ellements that have appeared on the webpage to spot toast messages



		mutation.addedNodes.forEach((node) => {
			if (node.classList?.contains("toast")){

				// check if the sidebar element needs resetting
				addHelperSidebar();

				// Overide the css display properties of the toast container so that it is readable if it overflows the height of the window.
				var theToastcontainer = document.getElementById("toast-container");
				theToastcontainer.style.overflowY = "scroll";
				theToastcontainer.style.maxHeight = "95vh";
				theToastcontainer.addEventListener("click", focusInput);



				// add the time stamp to the start of the message
				var d = new Date();
				var timeNow = d.toLocaleTimeString();


				/*-- CODE BLOCK REMOVED FOR NOW AS CURRENT HAVE CHANGED THEIR CSS...

				// strip out the list elements and flatten them
				if (!orderView){
					node.querySelectorAll('ul').forEach(function (element) {
						element.outerHTML = element.innerHTML;
					});
					node.querySelectorAll('li').forEach(function (element) {
						element.outerHTML = element.innerHTML;
					});
				}
				--*/

				if (node.innerHTML.includes("freescan")){
					node.innerHTML = "("+timeNow+") Free Scan toggle only applies when using Allocate.";
					//node.classList.remove("toast-error");
					//node.classList.add("toast-info");
				} else if (node.innerText.charAt(0) != `(`){
					node.innerHTML = "("+timeNow+") " + node.innerHTML;
				} else {
					// Do nothing?
				}
			}
		});

		// Respond to each new "toast-message" element
		var detailsRefreshed = false;
		toastMessages.forEach((toastMessage) => {

			if (orderView && !detailsRefreshed && !toastMessage.textContent.includes('Warning: the number of rows in the table')){
				detailsRefreshed = true;
				addDetails();
			}


			const messageText = toastMessage.textContent;
			console.log(toastMessage);

			// log the message
			console.log("Toast message: " + messageText);

			// Now respond to  toastMessages depending on their contents

			//ignore these as they're messages created by the CRMS Helper makeToast function
			if (messageText.includes('Free Scan') || messageText.includes('Container cleared.') || messageText.includes('Container set to') || messageText.includes('Now scan the container.') || messageText.includes('Container was not set.') || messageText.includes('API information loaded.') || messageText.includes('was removed from the opportunity.') || messageText.includes("Container error(s) found:")){


				// Error sound and warning if item was flagged as being in quarantine.
			} else if (messageText.includes('is in quarantine.')){
					setTimeout(function() {
						sayWord("Quarantined asset.");
					}, 800);

			// play an error sound if we failed to allocate / prepare and we were trying to create a container
		} else if (scanningContainer && (messageText.includes('Failed to allocate asset(s)') || messageText.includes('Failed to mark item(s) as prepared') || messageText.includes('as it does not have an active stock allocation with a sufficient quantity.') )){
				error_sound.play();
				scanningContainer = "";
				// clear the current value of container
				containerBox = document.querySelector('input[type="text"][name="container"]');
				containerBox.value = "";
				// restore freeScan to where it was.
				setFreeScan(freeScanReset);
				setTimeout(function(){
					makeToast("toast-info", "Container was not set.", 5);
					alertSound();
				}, 500);


			// Handle a successful allocation of an item being set as the container
		} else if (scanningContainer && (messageText.includes('Allocation successful')  || messageText.includes('Items successfully marked as prepared'))){
				scanSound();
				addDetails(true);

				if (smartScan){
					console.log("Running smartScanSetup");
					smartScanSetup(lastScan);
				}

				// set the container field to the new asset
				containerBox = document.querySelector('input[type="text"][name="container"]');
				containerBox.value = scanningContainer;

				// restore freeScan to where it was.
				setFreeScan(freeScanReset);

				// make a toast message to tell the user what happened.
				makeToast("toast-info", "Container was set to " + scanningContainer, 5);

				// clear this value ready for the next scan
				scanningContainer = "";

				// Report to the user
				setTimeout(function() {
					sayWord("Container added and set.");
					console.log(messageText);
				}, 900);

			// play an error sound for basic fail messages
		} else if (messageText.includes('Failed to allocate asset(s)') || messageText.includes('Failed to mark item(s) as prepared') || messageText.includes('Failed to check in item(s)')  || messageText.includes('as it does not have an active stock allocation with a sufficient quantity.') || messageText.includes('Failed to add container component')  || messageText.includes('Failed to stock check item')  || messageText.includes('Failed to book out')){
				//error_sound.play();
				errorSound();
				destroyAfterTime(toastMessage, errorTimeout);


			// Handle errors related to items being already scanned, or just not on the job at all
		} else if (messageText.includes('No available asset could be found using') || messageText.includes("No allocated or reserved stock allocations could be found using")  || messageText.includes("has already been selected on this opportunity.") ) {
		 
					// check if it's already on the job.
					theAsset = extractAsset(messageText);
					listAssets();
					if (assetsOnTheJob.includes(theAsset)){
						// Means it's already allocated / scanned
						if (theAsset == wrongItem){
							// second scan of same item
							theAsset = extractAssetToSay(messageText);
							setTimeout(function() {
								sayWord("Already scanned "+theAsset);
								console.log(messageText);
							}, 900);
						} else {
							wrongItem = theAsset;
							setTimeout(function() {
								sayWord("Already scanned");
								console.log(messageText);
							}, 900);
						}
					} else {
						// asset isn't on the job at all.
						theAsset = extractAssetToSay(messageText);

						if (theAsset == wrongItem){
							setTimeout(function() {
								sayWord(theAsset +" is not on the job.");
								console.log(messageText);
							}, 900);
						} else {
							setTimeout(function() {
								sayWord("Not on the job.");
								console.log(messageText);
								wrongItem = theAsset;
							}, 900);
						}
					}
					destroyAfterTime(toastMessage, errorTimeout);

		// Handle an attempt to Book Out scan an item that's not on the job
		} else if (messageText.includes("No reserved, allocated or prepared stock allocations could be found using")) {
				theAsset = extractAsset(messageText);
				listAssets();
				if (assetsBookedOut.includes(theAsset)){
					// Means it's already booked out
					if (theAsset == wrongItem){
						// second scan of same item
						theAsset = extractAssetToSay(messageText);
						setTimeout(function() {
							sayWord("Already booked out "+theAsset);
							console.log(messageText);
						}, 900);
					} else {
						wrongItem = theAsset;
						setTimeout(function() {
							sayWord("Already booked out");
							console.log(messageText);
						}, 900);
					}
				} else {
					if (theAsset == wrongItem){
						setTimeout(function() {
							sayWord("Not on the job.");
							console.log(messageText);
						}, 900);
					} else {
						theAsset = extractAssetToSay(messageText);
						setTimeout(function() {
							sayWord(theAsset +" is not on the job.");
							console.log(messageText);
						}, 900);
					}
			}
			destroyAfterTime(toastMessage, errorTimeout);



			// Handle messages related to at item being overdue an inspection
		} else if (messageText.includes('Inspect Now')){

			switch(inspectionAlerts) {
				case "full":
					theAsset = extractAssetToSay(messageText);
					setTimeout(function() {
						sayWord("Inspection overdue for asset " + theAsset);
						console.log(messageText);
					}, 900);
				break;
				case "short":
					setTimeout(function() {
						shortAlertSound();
						console.log(messageText);
					}, 400);
				break;
				case "off":
				break;
				default:
				// code block
			}

		} else if (messageText.includes('Blocked from allocating a quarantined asset.')){
			setTimeout(function() {
				sayWord("Quarantined asset.");
				console.log(messageText);
			}, 900);
			errorSound();
			destroyAfterTime(toastMessage, errorTimeout);




			// Handle an error where an item cannot be added because it's a container that's already allocated
		} else if (messageText.slice(11) == 'A temporary container cannot be allocated while it has a live allocation on an opportunity'){
						setTimeout(function() {
							sayWord("Container already allocated");
							console.log(messageText);
						}, 900);
						destroyAfterTime(toastMessage, errorTimeout);

			// Handle a warning about stock shortage
		} else if (messageText.includes("A shortage exists for the Rental of Product")){
						// no action required.
						destroyAfterTime(toastMessage, errorTimeout);
			// Handle an error where an item cannot be added because it's a container that's already allocated
		} else if (messageText.includes("Quantity is invalid")){
						setTimeout(function() {
							sayWord("Quantity invalid.");
							console.log(messageText);
			}, 900);
			destroyAfterTime(toastMessage, errorTimeout);

		}else if (messageText.slice(11) == 'None of the selected stock allocations are allocated or reserved.'){
					setTimeout(function() {
						sayWord("Cannot prepare item.");
						console.log(messageText);
		}, 900);
		destroyAfterTime(toastMessage, errorTimeout);

		// Handle an error during global check-in that is caused by a failed scan
		}else if (messageText.includes("at your active store using the filter options from the settings screen (accessed using the wrench button).")){

					console.log(messageText);

					// check if it's already on the job.
					theAsset = extractAsset(messageText);
					listGlobalCheckedItems();
					if (assetsGlobalScanned.includes(theAsset)){
						// Means it's already allocated / scanned
						error_sound.play();
						setTimeout(function() {
							//theAsset = extractAssetToSay(messageText);
							//sayWord("Already scanned "+theAsset);
							sayWord("Already scanned");
							console.log(messageText);
						}, 700);
					} else {
						// asset isn't booked out anywhere.
						error_sound.play();
					}
					destroyAfterTime(toastMessage, errorTimeout);

		// Handle an error during check-in that is caused by an item already being checked in
		} else if (messageText.includes('No booked out or part checked in stock allocations could be found using')){
						// setTimeout(function() {
						//  sayWord("Already scanned in?");
							console.log(messageText);
						//}, 1000);
						destroyAfterTime(toastMessage, errorTimeout);


			// Handle niche error where an item is not available because it's listed in quarantine
		}else if (messageText.includes('A shortage exists for the Rental of Asset')){
				theAsset = extractAssetToSay(messageText);
				setTimeout(function() {
					sayWord("A shortage exists for asset " + theAsset + ". It may be in quarantine.");
					console.log(messageText);
				}, 900);
				destroyAfterTime(toastMessage, errorTimeout);

			// Handle an error when trying to add an item to a container (could be non item or invalid item)
		}else if (messageText.includes('No active rental stock level that is not already a container component could be found')){




			// function to get the asset number from this kind of toast message
			function findLastAssetInMessage(input) {
				const matches = input.match(/'([^']+)'/g);
				if (matches && matches.length > 0) {
					// Get the last match, remove the single quotes, and trim any extra spaces
					return matches[matches.length - 1].slice(1, -1).trim();
				}
				return null; // Return null if no matches are found
			}

			theAsset = findLastAssetInMessage(messageText);

			// check if it's already in the container
			listContainerAssets();
			if (assetsInContainer.includes(theAsset)){
				// Means it's already scanned
				setTimeout(function() {
					sayWord("Already in container");
				}, 900);
			} else {

				const exists = allStock.stock_levels.some(obj => obj.asset_number === theAsset);

				if (exists){
					setTimeout(function() {
						sayWord("Asset unavailable.");
						console.log(messageText);
					}, 900);
				} else {
					setTimeout(function() {
						sayWord("Asset not recognized.");
						console.log(messageText);
					}, 900);
				}

			}
			destroyAfterTime(toastMessage, errorTimeout);



			// handle the user hitting enter on an empty input box
			} else if (messageText.includes("You must select an asset.")) {
				// Normally redundant except global check in doesn't do error boxes.
				if (globalCheckinView){
					error_sound.play();
				}
				destroyAfterTime(toastMessage, errorTimeout);

				// handle the user hitting enter on an empty input box
			} else if (messageText.includes("The stock level's product does not match the stock check product.")) {
				// Normally redundant except global check in doesn't do error boxes.
				setTimeout(function() {
					sayWord("Out of scope.");
					console.log(messageText);
				}, 700);
				destroyAfterTime(toastMessage, errorTimeout);

			} else if (messageText.includes('Stock check item successful')) {
				// Normally redundant except global check in doesn't do error boxes.
				scanSound();

			// Handle myriad messages that are good, and just need a confirmatory "ding"
			} else if (messageText.includes('Allocation successful') || messageText.includes('Items successfully marked as prepared') || messageText.includes('Items successfully checked in') || messageText.includes('Container Component was successfully destroyed.') || messageText.includes('Opportunity Item was successfully destroyed.') || messageText.includes('Container component was successfully added') || messageText.includes('Opportunity Item was successfully updated.')  ||  messageText.includes('Items successfully booked out') || messageText.includes('Container component was successfully removed')  || messageText.includes('Check-in details updated successfully') || messageText.includes('Opportunity Item was updated.') || messageText.includes('Set container successfully') || messageText.includes('Asset(s) successfully checked in')){
				addDetails(true);
				if (detailView && (document.querySelector('input[type="text"][name="container"]').value)){
					containerScanSound();
				} else if (!orderView){
					scanSound();
				}

				if (messageText.includes('Allocation successful')){
					if (detailView && smartScan){
						console.log("Running smartScanSetup");
						smartScanSetup(lastScan);
					}
				}

			} else if (messageText.includes('Helper failed to fetch from API. Retrying.')){
				// do nothing
				console.log("Re-trying to fetch from API");
			



			// If any other alert appears, log it so that I can spot it and add it to this code
			} else {
				if (detailView){
					// play an alert sound if scanning in detail view, just incase it's something important...
					alertSound();
				}
				// alert(`Unhandled Alert Message:\n\n${messageText}`);
				console.log("The following message was not handled by CurrentRMS Helper. Please report it as an issue on gitHub:");
				console.log(messageText); // The bit I'd use to add a handler.
			}

			if (!messageText.includes("Container error(s) found:")){
			newCalculateContainerWeights(); // update container weight values in the side bar
				updateHidings(); // Update changed items that might need to be hidden
			}


		});


	//////// END OF TOAST SECTION /////////



	///// START OF GLOBAL CHECK IN SECTION /////

	if (globalCheckinView && multiGlobal) { // if we're in global check in and the overide is on
		const globalCheckModal = addedNodes.filter((node) => {
				// Check if node is an HTMLElement and has a querySelector method
				if (node instanceof HTMLElement && node.querySelector) {
						// Use querySelector to find the child element with the specified class
						const childElement = node.querySelector('.btn.btn-primary.pull-right');

						// Check if the child element with the specified class exists
						return childElement !== null;
				}

				// Return false if node is not an HTMLElement or lacks querySelector method
				return false;
		});

		if (globalCheckModal.length > 0) {

				var selectAllBox = document.querySelectorAll('input[name="asset_select_all"]');
				selectAllBox[0].click();
				var checkInButton = document.querySelectorAll('input[name="commit"][value="check-in"]');
				checkInButton[1].click();
		}
	}



	});
});


/////////
function newCalculateContainerWeights() {
	// Initialize an object to store container information
	containerisationData = {};
	bookedOutWeight = 0;
	subhireWeight = 0;
	stockWeight = 0;

	// Get all table rows in the document
	var rows = document.querySelectorAll('tr');

	// Iterate through each row to find things in containers
	for (var i = 0; i < rows.length; i++) {
		// Get the status cell in the current row
		try {

			var containerCell = rows[i].querySelector('.container-column');

			var thisContainer;
			if (containerCell){
				thisContainer = containerCell.textContent.trim();
			}

			var assetCell = rows[i].querySelector('.asset-column');
			var thisAsset = assetCell.textContent.trim();

			var nameCell = rows[i].querySelector('.dd-content');
			var rowName = nameCell.textContent.trim();

			const magnifyingGlassEmoji = "🔎";
			if (rowName.endsWith(magnifyingGlassEmoji)) {
				rowName = rowName.substring(0, rowName.length - (magnifyingGlassEmoji.length+1));
			}

			var rowId = rows[i].id;

			// get the status of the row
			var statusCell = rows[i].querySelector('td.status-column');
			var thisStatus = statusCell.textContent.trim();

			// get the weight of the item
			var thisItemWeight = rows[i].getAttribute('data-weight') * 1; // muliply to convert to number. note: the value given for bulk items it already multiplied by the quantity listed


			if (thisAsset != "Asset Number"){ // ignore header row
					containerisationData[rowId] = {asset: thisAsset, name: rowName, container: thisContainer, weight: thisItemWeight, contents: {}};
					if (thisStatus == "Booked Out"){
						bookedOutWeight += (thisItemWeight*1);
						bookedOutWeight = Math.round(bookedOutWeight * 100) / 100;
					}
					if (thisAsset.includes("Sub-Rent Booking")){
						subhireWeight += (thisItemWeight*1);
						subhireWeight = Math.round(subhireWeight * 100) / 100;
					} else {
						stockWeight += (thisItemWeight*1);
						stockWeight = Math.round(stockWeight * 100) / 100;
					}




			}

		} catch(err) {

			if (err.name != "TypeError"){ // ignore errors that are caused because elements don't exist on the page
				console.log(err);
			}
		}
	}

	const containerErrors = detectCircularContainment(containerisationData);
	if (containerErrors.lenghth > 0){
		console.log("Container errors:");
		console.log(containerErrors);
	}


	const containerisationDataJSON = transformContainerisationData(containerisationData);

	// now convert the JSON to HTML for display
	containers = [];
	containerList = [];
	let looseItemsWeight = 0;

	for (let key in containerisationDataJSON) {
			let item = containerisationDataJSON[key];
			if (Object.keys(item.contents).length > 0) {
					containers.push(item);
			} else if (!item.container) {
					looseItemsWeight += item.weight;
			}
	}

	containers.sort((a, b) => a.asset.localeCompare(b.asset));

	let html = "";

	if (containerErrors.length > 0){
		// Output list of errors into the sidebar if there are any
			var ul = document.getElementById("containerlist");
			html +=  `<li class="container-error">Container Error(s): ${containerErrors}</li>`;
			makeToast("toast-error", `Container error(s) found: A container has been placed inside itself (${containerErrors})`, 5);
	}



	for (let container of containers) {

		containerList.push(container.asset);

			html += generateHtml(container);
	}
	html += `<li>&#9723; Loose items: ${looseItemsWeight.toFixed(2)} ${weightUnit}</li>\n`;

	// Output the result into the sidebar if it exists
	if (document.getElementById("containerlist")) {
		var ul = document.getElementById("containerlist");
		ul.innerHTML = html;

	}




	function calculateWeight(item) {
		let totalWeight = item.weight;
		for (let key in item.contents) {
				totalWeight += calculateWeight(item.contents[key]);
		}
		return totalWeight;
	}


	function generateHtml(item, indent = 0) {
		let weight = calculateWeight(item);
		let html = "";

		if (Object.keys(item.contents).length > 0) {
			
			if (item.asset != item.name){
				html += `<li ${indent > 0 ? 'class="subcontainer"' : ''}>${'&nbsp;'.repeat(indent * 4)}${indent > 0 ? ' &#8627;' : '&#9635; '}${item.asset} / ${item.name}: ${weight.toFixed(2)} ${weightUnit}</li>\n`;
			} else {
				html += `<li ${indent > 0 ? 'class="subcontainer"' : ''}>${'&nbsp;'.repeat(indent * 4)}${indent > 0 ? ' &#8627;' : '&#9635; '}${item.name}: ${weight.toFixed(2)} ${weightUnit}</li>\n`;
			}
		}

		let sortedContents = Object.values(item.contents).sort((a, b) => a.asset.localeCompare(b.asset));
		for (let content of sortedContents) {
				html += generateHtml(content, indent + 1);
		}

		return html;
	}

	if (bookedOutWeight > 0){
		//const existingWeightElement =
		console.log(bookedOutWeight);

		var bookedOutWeightLi = document.getElementById("booked_out_weight");

		if (bookedOutWeightLi){
			bookedOutWeightLi.innerHTML = `${bookedOutWeight} ${weightUnit}`;
		} else {
			// Find the <li> element that contains the weight
			var weightLi = document.querySelector('#weight_total').closest('li');

			// Create a new <li> element
			var newLi = document.createElement('li');

			newLi.innerHTML = `<span>Booked Out Weight:</span>
												 <span id="booked_out_weight";>
												 ${bookedOutWeight} ${weightUnit}
												 </span>`;

			// Insert the new <li> after the existing one
			weightLi.parentNode.insertBefore(newLi, weightLi.nextSibling);
		}

	}

	if (subhireWeight > 0){

		var subhireWeightLi = document.getElementById("subhire_weight");
		var stockWeightLi = document.getElementById("stock_weight");

		if (subhireWeightLi){
			subhireWeightLi.innerHTML = `${subhireWeight} ${weightUnit}`;
			stockWeightLi.innerHTML = `${stockWeight} ${weightUnit}`;
		} else {
			// Find the <li> element that contains the weight
			var weightLi = document.querySelector('#weight_total').closest('li');

			// Create a new <li> element
			var subLi = document.createElement('li');
			subLi.innerHTML = `<span>&#8627; Sub-Rent Weight:</span>
												 <span id="subhire_weight";>
												 ${subhireWeight} ${weightUnit}
												 </span>`;

			// Insert the new <li> after the existing one
			weightLi.parentNode.insertBefore(subLi, weightLi.nextSibling);


			// Create a new <li> element
			var stockLi = document.createElement('li');
			stockLi.innerHTML = `<span>&#8627; Stock Weight:</span>
												 <span id="stock_weight";>
												 ${stockWeight} ${weightUnit}
												 </span>`;

			// Insert the new <li> after the existing one
			weightLi.parentNode.insertBefore(stockLi, weightLi.nextSibling);




		}

	}


}




// declare what the sounds are - now defunct
var error_sound = new Audio(chrome.runtime.getURL("sounds/error_sound.wav"));
var scan_sound = new Audio(chrome.runtime.getURL("sounds/scan_sound.mp3"));
var alert_sound = new Audio(chrome.runtime.getURL("sounds/alert.wav"));
var short_alert_sound = new Audio(chrome.runtime.getURL("sounds/short_alert.mp3"));
var container_scan_sound = new Audio(chrome.runtime.getURL("sounds/container_scan_sound.mp3"));


function scanSound(){
	if (!muteExtensionSounds){
		var thisSound = new Audio(chrome.runtime.getURL("sounds/scan_sound.mp3"));
		thisSound.play();
	}
}

function errorSound(){
	if (!muteExtensionSounds){
		var thisSound = new Audio(chrome.runtime.getURL("sounds/error_sound.wav"));
		thisSound.play();
	}
}

function containerScanSound(){
	if (!muteExtensionSounds){
		var thisSound = new Audio(chrome.runtime.getURL("sounds/container_scan_sound.mp3"));
		thisSound.play();
	}
}

function alertSound(){
	if (!muteExtensionSounds){
		var thisSound = new Audio(chrome.runtime.getURL("sounds/alert.wav"));
		thisSound.play();
	}
}

function shortAlertSound(){
	if (!muteExtensionSounds){
		var thisSound = new Audio(chrome.runtime.getURL("sounds/short_alert.mp3"));
		thisSound.play();
	}
}











// this will run whenever the page reloads, in order to catch "toastPost" messages
listToastPosts();


// add a section to the sidebar if it exists
if (detailView){
	try {
	  var containerWeightsSection = document.getElementById("sidebar_content");
	 
	  if (containerWeightsSection) {
	    var htmlContent = `<div class='group-side-content' id='containerWeightsSection'><h3>Container Weights<a class='toggle-button expand-arrow icn-cobra-contract' href='#'></a></h3><div><ul id='containerlist' style='display: block;'></ul></div></div>`;
	 
	    containerWeightsSection.insertAdjacentHTML("afterend", htmlContent);
	 
	    var containerWeightsSectionDiv = document.getElementById('containerWeightsSection');
	    var toggleButton = containerWeightsSectionDiv.querySelector('.toggle-button');
	 
	    // Adjust the display property for the initial state
	    var containerListElement = document.getElementById('containerlist');
	    containerListElement.style.display = 'block';
	 
	    toggleButton.onclick = function (event) {
	      event.preventDefault();
	      if (containerListElement.style.display === 'none' || containerListElement.style.display === '') {
	        containerListElement.style.display = 'block';
	        toggleButton.classList.remove('icn-cobra-expand');
	        toggleButton.classList.add('icn-cobra-contract');
	      } else {
	        containerListElement.style.display = 'none';
	        toggleButton.classList.remove('icn-cobra-contract');
	        toggleButton.classList.add('icn-cobra-expand');
	      }
	    };
	 
	    getWeightUnit(); // check to see what weight unit the user has set by looking at the total weight field
			newCalculateContainerWeights(); // set initial container weigh values in the side bar
	 
	    // Add inline style for the toggle-button size
	    toggleButton.style.fontSize = '14px'; // Adjust the size as needed
	  }
	} catch (err) {
	  console.error(err);
	}

}




// Create control Items
if (detailView){
	try {

		// start of new gui

		var titleRow = document.getElementById("opportunity_items_title");



		// Create a new row element
		let newElement = document.createElement('div');
		newElement.classList.add("row");
		//newElement.classList.add("sticky");
		newElement.classList.add("helper-sticky");
		// Insert `newElement` after `referenceElement`
		titleRow.insertAdjacentElement('afterend', newElement);

		let newDiv = document.createElement('div');
		newDiv.classList.add("pull-right");
		newDiv.classList.add("control-links");
		newDiv.classList.add("helper-control-panel");
		newDiv.id = 'helper-control-panel';
		newElement.appendChild(newDiv);


		var listContainer = document.getElementById("helper-control-panel");

		// Create a tab button for hiding items descriptions
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Notes";
		listItem.id = "notes-button";
		listContainer.appendChild(listItem);

		// Create a tab button for hiding prepared items
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Prepared";
		listItem.id = "prepared-button";
		listContainer.appendChild(listItem);

		// Create a tab button for hiding booked out items
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Booked Out";
		listItem.id = "booked-out-button";
		listContainer.appendChild(listItem);

		// Create a tab button for hiding checked in items
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Checked In";
		listItem.id = "checked-in-button";
		listContainer.appendChild(listItem);

		// Create a tab button for Bulk Only
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Bulk Only";
		listItem.id = "bulk-button";
		listContainer.appendChild(listItem);

		// Create a tab button for hiding Subhires
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Sub-Rents Shown";
		listItem.id = "subhires-button";
		listContainer.appendChild(listItem);

		// Create a tab button for hiding only non Subhires
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Sub-Rents Only";
		listItem.id = "nonsubs-button";
		listContainer.appendChild(listItem);

		// Create a tab button for hiding only non shortages
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Shorts Only";
		listItem.id = "nonshorts-button";
		listContainer.appendChild(listItem);

		document.getElementById("notes-button").addEventListener("click", notesButton);
		document.getElementById("prepared-button").addEventListener("click", preparedButton);
		document.getElementById("booked-out-button").addEventListener("click", bookedOutButton);
		document.getElementById("checked-in-button").addEventListener("click", checkedInButton);
		document.getElementById("bulk-button").addEventListener("click", bulkButton);
		document.getElementById("subhires-button").addEventListener("click", subhiresButton);
		document.getElementById("nonsubs-button").addEventListener("click", nonsubsButton);
		document.getElementById("nonshorts-button").addEventListener("click", nonShortsButton);

		// end of new gui


		document.addEventListener("dblclick", function(event) {
			// Check if the clicked element is an <a> inside an <li> within #od-function-tabs
			const listItem = event.target.closest("li");
			if (listItem && listItem.classList.contains("active")) {
					// Scroll the window to the top only if the <li> has the "active" class
					window.scrollTo({ top: 0, behavior: "smooth" });
			}
		});


	} catch (err){
		console.log(err);
	}
} else if (orderView){
	try {

		// start of new gui

		var titleRow = document.getElementById("opportunity_items_title");

		// Create a new row element
		let newElement = document.createElement('div');
		newElement.classList.add("row");
		newElement.classList.add("helper-sticky");
		// Insert `newElement` after `referenceElement`
		titleRow.insertAdjacentElement('afterend', newElement);

		let newDiv = document.createElement('div');
		newDiv.classList.add("pull-right");
		newDiv.classList.add("control-links");
		newDiv.classList.add("helper-control-panel");
		newDiv.id = 'helper-control-panel';
		newElement.appendChild(newDiv);

		var listContainer = document.getElementById("helper-control-panel");
		//listContainer.appendChild(listItem);

		// Create a tab button for hiding only non shortages
		var listItem = document.createElement("li");
		listItem.classList.add("helper-btn");
		listItem.textContent = "Shorts Only";
		listItem.id = "nonshorts-button";
		listContainer.appendChild(listItem);

		document.getElementById("nonshorts-button").addEventListener("click", nonShortsButton);

		// New Reset Accessories button

		// Find all <a> elements and filter by text content
		var recalcA = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === "Recent actions");

		if (recalcA) {

				var recalcLi = recalcA.closest('li');
		
				// create a new li element
				var newLi = document.createElement('li');
				newLi.innerHTML = `
				<i class="icn-cobra-shuffle"></i>
				<a data-toggle="" id="check-accessories" href="#">Check Accessories</a>`;

				// insert the new li after the recalcLi
				recalcLi.parentNode.insertBefore(newLi, recalcLi.nextSibling);

				// add event listener to the new li
				newLi.addEventListener("click", function() {
					console.log("Check Accessories clicked");
					// send a message to the background script
					chrome.runtime.sendMessage({messageType: "forceAllStockUpdate"});
				});
		
		}

		
		// Add complete buttons for each activity
		// find all a elements with the classes "favourite activity unpinned"
		var activityAs = document.querySelectorAll('a.favourite.activity.unpinned');
		activityAs.forEach(function(activityA) {
			const newCompleteButton = document.createElement('a');
			newCompleteButton.href = "#";
			newCompleteButton.classList.add('activity-complete-btn');
			newCompleteButton.innerHTML = '<i class="icn-cobra-checkmark-2"></i>';
			activityA.parentNode.insertBefore(newCompleteButton, activityA);


			// get the id of the closest tr
			const thisActivityId = activityA.closest('tr').id.replace('id-','');


			newCompleteButton.addEventListener("click", function(event) {

				// get the closest a.title element and extract the text
				// get the tr
				const activityRow = activityA.closest('tr');
				const activityTitle = activityRow.querySelector('td.content-title').innerText.trim();



				if (confirm(`Complete activity "${activityTitle}"?`)) {
					window.postMessage(
						{ source: 'extension', payload: {messageType: "completeActivity", activityId: thisActivityId}},
					);
				  } else {
					// Cancel pressed
					return;
				  }
				
			});
		});

		window.addEventListener('message', (event) => {
			if (event.source !== window) return;
			if (!event.data || event.data.source !== 'injected') return;
			if (event.data.payload.messageType == 'activityCompleted'){
				const activityId = event.data.payload.activityId;
				const activityRow = document.getElementById('id-'+activityId);
				if (activityRow){
					// find the closest tbody
					const tbody = activityRow.closest('tbody');
					if (tbody){
						// find the table holding the tbody
						const table = tbody.closest('table');
						tbody.remove();

						// now get the number of tbody elements left in the table
						const remainingTbody = table.querySelectorAll('tbody').length;

						// find in the document the a element with name="activities"
						const activitiesA = document.querySelector('a[name="activities"]');
						// get the parent div of the a element
						const parentDiv = activitiesA.closest('div');
						// get the div with class "listing-label-number" inside the parent div
						const activityLabelDiv = parentDiv.querySelector('div.listing-label-number');

						if (activityLabelDiv){
							console.log(activityLabelDiv);
							if (remainingTbody > 0){
								activityLabelDiv.textContent = `${remainingTbody} PENDING`;
							} else {
								activityLabelDiv.remove();
							}
						}

					}
				}
			}
		})
	



	} catch (err){
		console.log(err);
	}



} else if (globalSearchView){

	var searchTerm = returnGlobalSearchTerm();
	if (searchTerm){
		chrome.runtime.sendMessage({messageType: "globalsearchscrape", messageText: searchTerm});
	}

	const theForm = document.querySelector("form.form-search");
		if (theForm){
		theForm.addEventListener('submit', function(event) {
			searchTerm = document.getElementById("search_term").value;
			if (searchTerm.length > 0){
					chrome.runtime.sendMessage({messageType: "globalsearchscrape", messageText: searchTerm});
			}
		});
	}

}




function returnGlobalSearchTerm() {
		// Get the current URL
		const currentUrl = window.location.href;

		// Parse the URL to extract the search parameters
		const urlParams = new URLSearchParams(window.location.search);

		// Get the value of the 'search_term' parameter
		const searchTerm = urlParams.get('search_term');

		// Return the search term
		return searchTerm;
}






if (detailView){
	// Add an event listener to the select all check box
	var checkAllBox = document.getElementById("asset_select_all")
	checkAllBox.addEventListener('click', function(event) {

		setTimeout(function(){
			if (checkAllBox.checked){
				itemSelects = document.querySelectorAll("input.item-select");

				itemSelects.forEach((item) => {
					var theRow = item.closest("li.grid-body-row");
					if (theRow.classList.contains("hide-nonsub")){
						item.checked = false;
					} else if (theRow.classList.contains("hide-nonbulk")){
						item.checked = false;
					} else if (theRow.classList.contains("hide-subhire")){
						item.checked = false;
					} else if (theRow.classList.contains("hide-prepared")){
						item.checked = false;
					} else if (theRow.classList.contains("hide-nonshort")){
						item.checked = false;
					}

				});
			}
			}, 10);
	});

}




// Start observing the body for mutations. This looks out for changes to the webpage, so we can spot toast messages appearing.
observer.observe(document.body, {
	childList: true,
	subtree: true,
	characterData: true
});

// Stop observing when the extension is disabled or uninstalled
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === "stopObserver") {
		observer.disconnect();
	}
});


if (detailView){
	try { // try block in case some ellements may not exist in some circumstances

		// Add an event listener to the Free Scan toggle slider, to make the asset input box focus afterwards
		var freeScanElement = document.querySelectorAll('label[for="free_scan"][class="checkbox toggle android"]');
		freeScanElement[0].addEventListener('click', function(event) {
			focusInput();
		});

		// Add an event listener to the Mark As Prepared toggle slider, to make the asset input box focus afterwards
		var freeScanElement = document.querySelectorAll('label[for="mark_as_prepared"][class="checkbox toggle android"]');
		freeScanElement[0].addEventListener('click', function(event) {
			focusInput();
		});

		// Add an event listener to all collapse and expand buttons
		var expandButtons = document.querySelectorAll('button[data-action="expand"], button[data-action="collapse"]');

		// loop through each button and add a click event listener
		expandButtons.forEach(function(button) {
			button.addEventListener("click", function() {
				// do something when the button is clicked
				focusInput();
			});
		});

		// Add an event listener to all lock/unlock buttons
		var lockButtons = document.querySelectorAll('a[data-unlock-title="Unlock this group"]');

		// loop through each button and add a click event listener
		lockButtons.forEach(function(button) {
			button.addEventListener("click", function() {

				// do something when the button is clicked
				focusInput();

			});
		});

		// Add an event listener to Detail View mode buttons
		var detailModeButtons = document.querySelectorAll('a[class="btn"][data-toggle="tab"]');

		// loop through each button and add a click event listener
		detailModeButtons.forEach(function(button) {
			button.addEventListener("click", function() {
				// do something when the button is clicked
				detailViewMode = button.lastChild.textContent.toLowerCase().toString().trim();;
				console.log(detailViewMode);
			});
		});


		chrome.storage.local.get(["allocateDefault"]).then((result) => {
			if (result.allocateDefault != "false" && detailViewMode == "functions"){
				var allocateButton = document.querySelector('a.btn[href="#quick_allocate"]');
				allocateButton.click();
			}
		});

		chrome.storage.local.get(["soundsOn"]).then((result) => {
			console.log("Sound = "+result.soundsOn);
			if (result.soundsOn == "false"){
				muteExtensionSounds = true;
			} else {
				muteExtensionSounds = false;
			}
		});

	}
	catch(err) {
		console.log(err);
	}

}











// function to put the page focus to the scanner input box
function focusInput(){
	if (detailView){
		switch (detailViewMode) {
			case "allocate":
				document.getElementById("stock_level_asset_number").focus();
				break;
			case "prepare":
				document.getElementById("p_stock_level_asset_number").focus();
				break;
			case "book out":
				document.getElementById("bo_stock_level_asset_number").focus();
				break;
			case "check-in":
				document.getElementById("ci_stock_level_asset_number").focus();
				break;
		}
	}
}


//check with Service Worker to see if we have a new message waiting...
chrome.runtime.sendMessage({messageType: "check"}, function(response) {

	if (response.removedAsset != ""){
		console.log("Response from service worker:", response.removedAsset);
		console.log(response);
	}
	if (response.removedAsset){
		var announce = "The asset "+response.removedAsset+" was removed from the opportunity.";
		makeToast("toast-success", announce, 5);
	}
});



// auto set "mark as prepared" to on depending on the user setting
chrome.storage.local.get(["setPrepared"]).then((result) => {
	if (result.setPrepared != "false" && detailView){

		var preparedCheckbox = document.getElementById('mark_as_prepared');
		if(!preparedCheckbox.checked){
			preparedCheckbox.click();
		};

		//var preparedButton = document.querySelectorAll('label[for="mark_as_prepared"][class="checkbox toggle android"]');
		//preparedButton[0].click();
		focusInput();
	}
});


// Messages from the extension service worker to trigger changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Message received from service-worker:");
	console.log(message);

	if (message.inspectionAlerts == "off"){
		inspectionAlerts = "off";
		console.log("Inspection Alerts set to OFF");
	} else if (message.inspectionAlerts == "short"){
		inspectionAlerts = "short";
		console.log("Inspection Alerts set to SHORT");
	} else if (message.inspectionAlerts == "full"){
		inspectionAlerts = "full";
		console.log("Inspection Alerts set to FULL");
	}

	if (message.multiGlobal == "true"){
		multiGlobal = true;
		console.log("Global check-in dialog overide set to TRUE");
	} else if (message.multiGlobal == "false"){
		multiGlobal = false;
		console.log("Global check-in dialog overide set to FALSE");
	}
	if (message.blockQuarantines == "true"){
		blockQuarantines = true;
		console.log("blockQuarantines set to TRUE");
	} else if (message.blockQuarantines == "false"){
		blockQuarantines = false;
		console.log("blockQuarantines set to FALSE");
	}

	if (message == "quarantinedatarefreshed"){
		console.log("Quarantine data was refreshed by the service worker.");
		// Load the quarantineData from local storage
		chrome.storage.local.get(["quarantineData"]).then((result) => {
				if (result.quarantineData == undefined){
					// If the variable is empty, it might not have been got yet (first use)
					if (apiKey){
						console.log("Quarantines list was not found.");
						makeToast("toast-error", "Quarantines list was not found. Feature disabled!");
					}
				} else {
					const quarantinesString = result.quarantineData;
					quarantineData = JSON.parse(quarantinesString);
					console.log("Retrieved quarantine data from storage");
					console.log(quarantineData);

					quarantinedItemList = [];
						for (let n = 0; n < quarantineData.quarantines.length; n++) {
							var thisAsset = quarantineData.quarantines[n].stock_level.asset_number;
							quarantinedItemList.push(thisAsset);
						}
					console.log("List of quarantined items was created.");

				}
		});

	}

	if (message.messageType == "availabilityData"){
			console.log("Availability data was delivered");
			//console.log(message.messageData);
			if (orderView){
				addAvailability(message.messageData);
			}
	}

	// handle scrape returns for warehouse notes and also subhire members
	if (message.messageType == "warehouseNotesData"){
			console.log("Warehouse Notes Data was delivered");
			console.log(message.messageData);
			if (orderView){

				let obj = message.messageData.warehouseNotesLog;
				for (let key in obj) {
					if (obj.hasOwnProperty(key)) {  // Ensures the key belongs to the object, not its prototype
						let value = obj[key];

						var liElement = document.querySelector('li.grid-body-row[data-id="'+key+'"]');

						if (liElement){
							var tdElement = liElement.querySelector('td.dd-name');
							if (!tdElement){
								console.log("issue finding dd-name td element for "+value);
							} else {
								let existingIcon = tdElement.querySelector("span.warehouse-tooltip");

								if (existingIcon){
									existingIcon.remove();
								}
									var itemName = tdElement.querySelector('a');
									if (!itemName){
										itemName = tdElement.querySelector('div.item-name');
									}
									if (itemName){
										itemName.insertAdjacentHTML('afterend', `<span class="warehouse-tooltip">&nbsp;<i class="icn-cobra-paste3 warehouse-edit"></i><span class="warehouse-tooltiptext" data-warehouse="${value}"><u>WAREHOUSE NOTE:</u><br>${value}</span></span>`);
									}

							}
						}
					}
				}
				console.log(message.messageData.members);

				var members = message.messageData.members;
				// iterate through each key in members
				for (const key in members) {
					if (members.hasOwnProperty(key)) {
						let memberName = members[key];
						
						// if the memberName is longer than 10 characters, reduce to the first 10 and add "..."
						if (memberName.length > 16){
							memberName = memberName.substring(0, 16);
						}

						//find a span element with class "subhire-member" and data-member-id that matches the key
						var memberElement = document.querySelector('span.subhire-member[data-member-id="'+key+'"]');
						if (memberElement){
							if (apiSubdomain){
								memberElement.innerHTML = `<a href="https://${apiSubdomain}.current-rms.com/members/${key}"  target="_blank">${memberName}</a>`;
							} else {
								memberElement.innerText = memberName;
							}

						}
					}
				}
			}
	}


	if (message.messageType == "productQtyData"){
			console.log("Availability data was delivered");
			console.log(message.messageData);
	}

	if (message == "soundchanged"){
			chrome.storage.local.get(["soundsOn"]).then((result) => {
				if (result.soundsOn != "true"){
					muteExtensionSounds = true;
				} else {
					muteExtensionSounds = false;
				}
			});
	} else if (message == "errortimeoutchanged"){
			chrome.storage.local.get(["errorTimeout"]).then((result) => {
				console.log("errorTimeout = "+result.errorTimeout);
				if (result.errorTimeout){
					errorTimeout = result.errorTimeout;
				} else {
					console.log("errorTimeout not retrieved");
				}
			});
	} else if (message == "bookOutContainers"){
			chrome.storage.local.get(["bookOutContainers"]).then((result) => {
				if (result.bookOutContainers == "true"){
					bookOutContainers = true;

				} else {
					bookOutContainers = false;
				}
			});
			console.log(bookOutContainers);
	} else if (message == "detailDelete"){
			chrome.storage.local.get(["detailDelete"]).then((result) => {
				console.log(result);
				if (result.detailDelete == "true"){
					detailDelete = true;

				} else {
					detailDelete = false;
				}
				console.log(detailDelete);
				hideDeleteButtons();
			});
	
	} else if (message == "nestedTotals"){
		chrome.storage.local.get(["nestedTotals"]).then((result) => {
			console.log(result);
			if (result.nestedTotals == "true"){
				nestedTotals = true;
			} else {
				nestedTotals = false;
			}
			console.log(nestedTotals);
			applyNestedCharges();
		});



	}



	
	if (message.messageType == "oppScrapeData" && globalSearchView){
		// hand global search return

		console.log(message.messageData);
		var oppsToList = message.messageData;
		var oppCount = message.messageCount;

		if (oppsToList){

			var htmlChunk = '';
			oppsToList.forEach((item) => {

				let stateText;
				let stateId;

				switch (item.state) {
					case "ENQUIRY":
						stateText = "Enquiry";
						stateId = "00";
						break;
					case "DRAFT":
						stateText = "Draft";
						stateId = "01";
						break;
					case "QUOTATION":
						stateText = "Quotation";
						stateId = "02";
						break;
					case "ORDER":
						stateText = "Order";
						stateId = "03";
						break;
					default:

				}

				let extraIcon = "";

				if (item.status == "Dead"){
					extraIcon = `&nbsp; <div class="label label-default">
					<i class="icn-cobra-skull"></i>
					Dead
					</div>`;
				} else if (item.status == "Lost"){
					extraIcon = `&nbsp; <div class="label label-default">
					<i class="icn-cobra-thumbs-down"></i>
					Lost
					</div>`;
				} else if (item.status == "Completed   Invoiced"){
					extraIcon = `&nbsp; <div class="label label-inverse">
					<i class="icn-cobra-lock"></i>
					Completed
					</div>`;
				} else if (item.status == "Completed"){
					extraIcon = `&nbsp; <div class="label label-inverse">
					<i class="icn-cobra-lock"></i>
					Completed
					</div>`;
				} else if (item.status == "Cancelled"){
					extraIcon = `&nbsp; <div class="label label-warning">
					<i class="icn-cobra-close"></i>
					Cancelled
					</div>`;
				} else if (item.status == "Postponed"){
					extraIcon = `&nbsp; <div class="label label-default">
					<i class="icn-cobra-clock-4"></i>
					Postponed
					</div>`;
				}

				htmlChunk += `
				<tbody>
					<tr id="id-463">
						<td class="essential opportunity-state${stateId} row-avatar">
							<span class="avatar small icon">
							<i class="${item.avatar}"></i>
							<p>${stateText}</p>
							</span>
						</td>
						<td class="show_link essential"><a href="/opportunities/${item.oppid}">${item.title}</a>${extraIcon}</td>
					</tr>
				</tbody>`
			});

			var thisSearch = document.getElementById("search_term").value;

			var resultsContainer = document.querySelector(".row.global-search-results.display-flex.detailspage");
			const newElement = document.createElement('div');
			// Insert the new element
			//resultsContainer.insertAdjacentElement('afterend', newElement);
			resultsContainer.appendChild(newElement);

			newElement.outerHTML = `
			<div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 global-search-result" data-index="50"><table class="table index-table">
			<thead>
			<tr>
			<th class="essential" colspan="2">
			<span class="search-result-title">
			Inactive Opportunities
			</span>
			<div class="global-search-module-total">
			${oppCount} Records
			</div>
			</th>
			</tr>
			</thead>
			${htmlChunk}

			</table>

			<div class="closinglist-details">
			<a href="/opportunities?utf8=✓&per_page=48&view_id=0&filtermode%5B%5D=inactive&q%5Bsubject_or_description_or_number_or_reference_or_member_name_or_tags_name_cont%5D=${thisSearch}">View more</a>
			</div>
			</div>`;

			var totalCounter = document.getElementById("global_search_count");
			var overallTotal = parseInt(totalCounter.innerText) + parseInt(message.messageCount);
			totalCounter.innerText = overallTotal;

		}
	}





	if (message === "forceAllStockUpdateComplete") {

		// reload allStock from local storage
		chrome.storage.local.get(["allStock"]).then((result) => {
			allStock = result.allStock;
			console.log("All stock updated");
			window.postMessage(
				{ source: 'extension', payload: {allStock: allStock, oppData: oppData, allProducts: allProducts, messageType: "updateAccessories"}},
				'*'              // or the exact origin string if you can
			);
		}
		);
	}

	sendResponse({message: "received"});
	//return true;
});




if (detailView){
	activeIntercept(); // Intercept scanning actions to handle special scans without submitting the form
};


function hideDeleteButtons(){
	if (detailDelete){
		let allDeleteButtons = document.querySelectorAll("li.danger");
		allDeleteButtons.forEach((item, i) => {
			item.classList.add("hide-delete");
		});
	} else {
		let allHiddenDeletes = document.querySelectorAll(".hide-delete");
		console.log(allHiddenDeletes); // Check if elements are selected
		allHiddenDeletes.forEach((item, i) => {
			item.classList.remove("hide-delete");
		});

	}
}


function activeIntercept(){
	if (detailView){

		// allocate panel items
		allocateScanBox = document.getElementById("stock_level_asset_number");
		var parentSpan = allocateScanBox.parentNode;
		var quantityBox = document.querySelector('input[type="text"][name="quantity"]');
		var containerBox = document.querySelector('input[type="text"][name="container"]');

		// book out panel items
		bookoutScanBox = document.getElementById("bo_stock_level_asset_number");
		boContainerBox = document.getElementById('bo_container');

		function resetScanBox(){
			// block to clear the allocate and book out boxes after an intercept
			allocateScanBox.value = '';
			bookoutScanBox.value = '';

			parentSpan = allocateScanBox.parentNode;
			var htmlFudge = parentSpan.innerHTML;
			parentSpan.innerHTML = htmlFudge;

			boParentSpan = bookoutScanBox.parentNode;
			var boHtmlFudge = boParentSpan.innerHTML;
			boParentSpan.innerHTML = boHtmlFudge;

			setTimeout(focusInput, 100); // delayed to avoid the jQuery function messing it up
			activeIntercept(); // need to re-run because we've just nuked the scan section DOM so the event listener won't work
		}

		// event listener for the scanbox in the Allocate panel
		allocateScanBox.addEventListener("keypress", function(event) {
			if (event.key === "Enter") {

				var myScan = allocateScanBox.value;

				// edit myScan to be only the first word of the string retreived
				myScan = myScan.split(" ")[0].trim();

				console.log("Intercepted scan: " + myScan);

				// item scanned is listed as a serialised container
				if (containerDataList.includes(myScan)){

					const freeScan = checkFreeScan();
					if (!freeScan){
		
					//event.preventDefault(); // for testing only
					console.log("Scanned item is a container");
					//get the container from containerData
				
					let thisContainer = containerData[myScan];
					if (thisContainer){
						console.log(thisContainer);
						// create an array of the item_name of every item in thisContainer, but only if the item.accessory only value is false
						thisContainer = thisContainer.filter(n => !n.item.accessory_only);
						console.log(thisContainer);



						const containerProductNames = thisContainer.map(item => item.item_name);

						const productsToCheck = listReservedProducts();
						console.log(productsToCheck);
						
						// check if the containerProductNames includes any of the productsToCheck
						const matchingProducts = containerProductNames.filter(product => productsToCheck.includes(product));
						console.log(matchingProducts);
					}
					//return;
					}
				}


				if (myScan.toLowerCase() != "revert" && revertScan){
					// we have prompted the user for an item to revert
					event.preventDefault();
					resetScanBox();
					listAssets();
					if (assetsOnTheJob.includes(myScan)){
						clickAndRevert(myScan);
						revertScan = false;
					} else {
						errorSound();
						revertScan = false;
						makeToast("toast-error", "Failed to revert "+myScan+" because it is not currently allocated.");
						sayWord("Failed to revert. Not on the job.")
					}

				} else if (myScan.toLowerCase() != "remove" && removeScan){
						// we have prompted the user for an item to revert
						event.preventDefault();
						resetScanBox();
						listAssets();
						if (assetsOnTheJob.includes(myScan)){
							removeAsset(myScan);
							removeScan = false;
						} else {
							errorSound();
							removeScan = false;
							makeToast("toast-error", "Failed to remove "+myScan+" because it is not currently allocated.");
							sayWord("Failed to remove. Not on the job.");
						}
						

				} else if (quarantinedItemList.includes(myScan) && blockQuarantines){
							// this item is in quarantine
							event.preventDefault();

							const matchingQuarantines = quarantineData.quarantines.filter(quarantines => quarantines.stock_level.asset_number == myScan);

							console.log(matchingQuarantines);
							if (matchingQuarantines.length > 0){
								var quarantineId = matchingQuarantines[0].id;
								console.log(quarantineId);
							}

							makeToast("toast-error", "Blocked from allocating a quarantined asset.");
							makeToast("toast-error", "Asset "+myScan+" is in quarantine.<p><a class='toast-link' href='https://"+apiSubdomain+".current-rms.com/quarantines/"+quarantineId+"' target='_blank'>View Record</a>");
							resetScanBox();
				} else if (quarantinedItemList.includes(myScan) && !blockQuarantines){
								// this item is in quarantine but we're set to allow it through
								makeToast("toast-error", "Asset "+myScan+" is in quarantine.");

				

					// In the case that we have scanned a *freescan* barcode
				} else if (myScan.toLowerCase() == "freescan"){
						event.preventDefault();
						freeScanToggle();
						resetScanBox();

					// In the case that we have scanned a *container* barcode
				}else if (myScan.toLowerCase() == "container"){
						if (containerScan){
							// Means the user scanned *container* twice and we want to clear the container field
							containerScan = false;
							shortAlertSound();
							sayWord("Container cleared.")
							containerBox.value = '';
							event.preventDefault();
							makeToast("toast-info", "Container cleared.", 5);
							resetScanBox();
						} else {
							// We need to prompt the user to scan a container
							event.preventDefault();
							sayWord("Scan container");
							containerScan = true;
							makeToast("toast-info", "Now scan the container.", 5);
							resetScanBox();
						}

					}else if (containerScan){
						// we are set to receive a value for the container field.
						listAssets();
						if (assetsOnTheJob.includes(allocateScanBox.value)){
							// the container is already listed on the opportunity
							event.preventDefault();
							containerScan = false;
							scanSound();
							containerBox.value = allocateScanBox.value;
							makeToast("toast-info", "Container set to "+containerBox.value, 5);
							resetScanBox();
							setTimeout(sayWord("Container set."), 500);

						} else {
							// the container is not yet allocated.
							containerScan = false;
							freeScanReset = checkFreeScan();
							if (!freeScanReset){
								setFreeScan(true);
							}
							// set the scanningContainer value to this container and let it go through as a scan to be allocated (don't block default)
							scanningContainer = allocateScanBox.value;
						}

					}else if (myScan == containerBox.value && containerBox.value != "") {
						// we scanned an asset that is already set as the current container, which means "clear the container field"
						containerScan = false;
						shortAlertSound();
						sayWord("Container cleared.")
						containerBox.value = '';
						event.preventDefault();
						makeToast("toast-info", "Container cleared.", 5);
						resetScanBox();
					} else if (containerExists(myScan)) {
						// we have scanned an asset that is already a container in this opportunity.
						event.preventDefault();
						containerScan = false;
						scanSound();
						containerBox.value = allocateScanBox.value;
						makeToast("toast-info", "Container set to "+containerBox.value, 5);
						resetScanBox();
						setTimeout(sayWord("Container set."), 500);



					} else if (myScan.charAt(0) === '%'){
						// this is a special scan of a bulk barcode that includes a Quantity

						// Define a regular expression to match the pattern "%{integer}%{rest-of-the-string}"
						const regex = /^%(\d+)%(.+)$/;
						// Use the exec() method to extract matches
						const matches = regex.exec(myScan);

						if (matches) {
								// matches[1] contains the bulkQuantity, matches[2] contains the bulkAsset
								const bulkQuantity = parseInt(matches[1], 10);

								if (!isNaN(bulkQuantity)) {
										// Check if bulkQuantity is a valid integer
										const bulkAsset = matches[2];
										quantityBox.value = bulkQuantity;
										allocateScanBox.value = bulkAsset;
										console.log("bulkQuantity:", bulkQuantity);
										console.log("bulkAsset:", bulkAsset);
								} else {
										console.log("Invalid bulkQuantity. It must be an integer.");
								}
						} else {
								console.log("String does not match the expected pattern.");
						}


					} else if (myScan.toLowerCase() === 'revert'){
						// this is a special scan to invoke revert status on an item
						if (revertScan){ // Means double scan of *revert*
							event.preventDefault();
							sayWord("Revert cancelled.");
							revertScan = false;
							makeToast("toast-info", "Revert scan cancelled.", 5);
							// block to clear the allocate box after an intercept
							resetScanBox();
						} else {
							// We need to prompt the user to scan the item to be reverted
							event.preventDefault();
							sayWord("Scan item to revert");
							revertScan = true;
							makeToast("toast-info", "Scan the item to be reverted.", 5);
							// block to clear the allocate box after an intercept
							resetScanBox();
						}

					} else if (myScan.toLowerCase() === 'remove'){
						// this is a special scan to invoke remove on an item
						if (removeScan){ // Means double scan of *revert*
							event.preventDefault();
							sayWord("Remove cancelled.");
							removeScan = false;
							makeToast("toast-info", "Remove scan cancelled.", 5);
							// block to clear the allocate box after an intercept
							resetScanBox();
						} else {
							// We need to prompt the user to scan the item to be reverted
							event.preventDefault();
							sayWord("Scan item to remove");
							removeScan = true;
							makeToast("toast-info", "Scan the item to be removed.", 5);
							// block to clear the allocate box after an intercept
							resetScanBox();
						}
					} else if (myScan.toLowerCase() === 'bookout'){
						// this is a special scan to switch to the bookout tab
					 
							event.preventDefault();
							sayWord("Book Out Mode");
							makeToast("toast-info", "Changed to Book Out mode.", 5);
							// block to clear the allocate box after an intercept
							resetScanBox();
							// find a element with href="#quick_book_out"
							var bookOutButton = document.querySelector('a.btn[href="#quick_book_out"]');
							if (bookOutButton){
								bookOutButton.click();
							}
						
					} else if (myScan.toLowerCase() == "test"){
						// test scan for development purposes
						// Test code here.
						sayWord("test");

						event.preventDefault();
						resetScanBox();

					} // end if scan block
				// Passed all of that means this is a regular item we're scanning.

				lastScan = myScan; // log the asset ready for potential smart scan

			} // end of if enter key block

		});


		// BOOK OUT //
		// Event listener for the scanbox in the Book Out panel
		if (bookoutScanBox){
			bookoutScanBox.addEventListener("keypress", function(event) {
				if (event.key === "Enter") {
					var myScan = bookoutScanBox.value;
					console.log(myScan);
					console.log(containerScan);
					console.log(bookOutContainers);

					if (myScan.toLowerCase() != "revert" && revertScan){
						// we have prompted the user for an item to revert
						event.preventDefault();
						resetScanBox();
						listAssets();
						if (assetsOnTheJob.includes(myScan)){
							clickAndRevert(myScan);
							revertScan = false;
						} else {
							errorSound();
							revertScan = false;
							makeToast("toast-error", "Failed to revert "+myScan+" because it is not currently allocated.");
							sayWord("Failed to revert. Not on the job.")
						}

					} else if (myScan.toLowerCase() != "remove" && removeScan){
							// we have prompted the user for an item to revert
							event.preventDefault();
							resetScanBox();
							listAssets();
							if (assetsOnTheJob.includes(myScan)){
								removeAsset(myScan);
								removeScan = false;
							} else {
								errorSound();
								removeScan = false;
								makeToast("toast-error", "Failed to remove "+myScan+" because it is not currently allocated.");
								sayWord("Failed to remove. Not on the job.");
							}

					} else if (containerExists(myScan) && bookOutContainers && !containerScan){
						if (myScan == boContainerBox.value && boContainerBox.value != "") {
							// we scanned an asset that is already set as the current container, which means "clear the container field"
							containerScan = false;
							shortAlertSound();
							sayWord("Container cleared.")
							containerBox.value = '';
							boContainerBox.value = '';
							event.preventDefault();
							makeToast("toast-info", "Container cleared.", 5);
							resetScanBox();
						} else {
							bookOutNested(myScan);
						}
					// In the case that we have scanned a *container* barcode
					} else if (myScan.toLowerCase() == "container"){
						if (containerScan){
							// Means the user scanned *container* twice and we want to clear the container field
							containerScan = false;
							shortAlertSound();
							sayWord("Container cleared.")
							containerBox.value = '';
							boContainerBox.value = '';
							event.preventDefault();
							makeToast("toast-info", "Container cleared.", 5);
							resetScanBox();
						} else {
							// We need to prompt the user to scan a container
							event.preventDefault();
							sayWord("Scan container");
							containerScan = true;
							makeToast("toast-info", "Now scan the container.", 5);
							resetScanBox();
						}

					}else if (containerScan){
						// we are set to receive a value for the container field.
						listAssets();
						if (assetsOnTheJob.includes(myScan)){
							// the container is already listed on the opportunity
							event.preventDefault();
							containerScan = false;
							scanSound();
							boContainerBox.value = myScan;
							makeToast("toast-info", "Container set to "+containerBox.value, 5);
							resetScanBox();
							setTimeout(sayWord("Container set."), 500);

						} else {
							// the container is not yet allocated.
							containerScan = false;
							// this will go through and error because the asset isn't allocated
						}

					} else if (myScan.toLowerCase() === 'remove'){
						// this is a special scan to invoke remove on an item
							if (removeScan){ // Means double scan of *revert*
								event.preventDefault();
								sayWord("Remove cancelled.");
								removeScan = false;
								makeToast("toast-info", "Remove scan cancelled.", 5);
								// block to clear the allocate box after an intercept
								resetScanBox();
							} else {
								// We need to prompt the user to scan the item to be reverted
								event.preventDefault();
								sayWord("Scan item to remove");
								removeScan = true;
								makeToast("toast-info", "Scan the item to be removed.", 5);
								// block to clear the allocate box after an intercept
								resetScanBox();
							}
					} else if (myScan.toLowerCase() === 'revert'){
						// this is a special scan to invoke revert status on an item
						if (revertScan){ // Means double scan of *revert*
							event.preventDefault();
							sayWord("Revert cancelled.");
							revertScan = false;
							makeToast("toast-info", "Revert scan cancelled.", 5);
							// block to clear the allocate box after an intercept
							resetScanBox();
						} else {
							// We need to prompt the user to scan the item to be reverted
							event.preventDefault();
							sayWord("Scan item to revert");
							revertScan = true;
							makeToast("toast-info", "Scan the item to be reverted.", 5);
							// block to clear the allocate box after an intercept
							resetScanBox();
						}
					} else if (myScan.toLowerCase() === 'allocate'){
						// this is a special scan to switch to the allocate tab
							event.preventDefault();
							// block to clear the allocate box after an intercept
							resetScanBox();
							// find a element with href="#quick_allocate"
							var allocateButton = document.querySelector('a.btn[href="#quick_allocate"]');
							if (allocateButton){
								allocateButton.click();
								makeToast("toast-info", "Changed to Allocate mode.", 5);
								sayWord("Allocate Mode");
							}
					}

				} // end of "Enter" event on Book Out panel
			});
		};
	}
}



// Function to book out all of the nested containers and subcontainers of a scanned item

function bookOutNested(scanned){

	console.log(scanned);
	console.log(containerisationData);

	function findAssets(data, target) {
		let result = [];

		function searchContents(contents) {
			for (let key in contents) {
				if (Object.keys(contents[key].contents).length > 0) {
						LogContents(contents[key].contents);
				}
			}
		}

		function LogContents(contents) {
			for (let key in contents) {
				result.push(key);
				if (Object.keys(contents[key].contents).length > 0) {
						LogContents(contents[key].contents);
				}
			}
		}

		for (let key in data) {
				if (data[key].asset === target) {
						searchContents(data[key].contents);
						break;
				}
		}

		return result;
	}

	const assetsToBookOut = findAssets(containerisationData, scanned);

	console.log(assetsToBookOut);

	var assetTable = document.getElementById('nestable-grid');
	var stuffToBookOut = false;
	assetsToBookOut.forEach((itemId) => {
		var liElement = assetTable.querySelector('li.grid-body-row[data-id="'+itemId+'"]');
		var tdElement = liElement.querySelector('td.essential.status-column');
		console.log(tdElement.innerText);
		if (tdElement && tdElement.innerText == "Prepared"){
			var tickboxElement = liElement.querySelector('input.item-select');
				if (tickboxElement){
					tickboxElement.checked = true;
					stuffToBookOut = true;
				}
		}
	});

	if (stuffToBookOut){
		var bookOutButton = Array.from(document.querySelectorAll('a.row-selector[data-disable-with="wait ..."]'))
		.find(element => element.textContent.trim() === "Book out");

		if (bookOutButton){
			bookOutButton.click();
		}
	}

}




function setFreeScan(setting){ // enter true or false as required.
	var freeScanStatus = false;

	// First of all, check the current state of the "free scan" toggle button

	// Find the parent div with class "free-scan-input"
	var freeScanDiv = document.querySelector('.free-scan-input');
	// Check if the parent div is found
	if (freeScanDiv) {
			// Find the <a> element with class "slide-button" inside the parent div
			var slideButton = freeScanDiv.querySelector('a.slide-button');

			// Check if the <a> element is found
			if (slideButton) {
					// Get the background color of the <a> element
					var backgroundColour = window.getComputedStyle(slideButton).backgroundColor;
					// if it's red, that maens it's off
					if (backgroundColour == "rgb(204, 0, 30)"){
						freeScanStatus = false;
					} else {
						freeScanStatus = true;
					}
			} else {
					console.log('Slide button not found');
			}
	} else {
			console.log('Parent div with class "free-scan-input" not found');
	}
	// Now click the toggle button if it's not where we want it to be.
	if (setting != freeScanStatus){ // if the current state is not the one we want, we need to toggle it.
		var freeScanButton = document.querySelectorAll('label[for="free_scan"][class="checkbox toggle android"]');
		freeScanButton[0].click();
	}
}

function checkFreeScan(){ // checks on the freescan toggle button and returns status true or false
	var freeScanStatus = false;

	// Find the parent div with class "free-scan-input"
	var freeScanDiv = document.querySelector('.free-scan-input');
	// Check if the parent div is found
	if (freeScanDiv) {
			// Find the <a> element with class "slide-button" inside the parent div
			var slideButton = freeScanDiv.querySelector('a.slide-button');

			// Check if the <a> element is found
			if (slideButton) {
					// Get the background color of the <a> element
					var backgroundColour = window.getComputedStyle(slideButton).backgroundColor;
					// if it's red, that maens it's off
					if (backgroundColour == "rgb(204, 0, 30)"){
						freeScanStatus = false;
					} else {
						freeScanStatus = true;
					}
			} else {
					console.log('Slide button not found');
			}
	} else {
			console.log('Parent div with class "free-scan-input" not found');
	}
	return freeScanStatus;
}











// intercept function to respond to special scans
function freeScanToggle(){
	var freeScanActive = false;
	// Find the parent div with class "free-scan-input"
	var freeScanDiv = document.querySelector('.free-scan-input');

	// Check if the parent div is found
	if (freeScanDiv) {
			// Find the <a> element with class "slide-button" inside the parent div
			var slideButton = freeScanDiv.querySelector('a.slide-button');

			// Check if the <a> element is found
			if (slideButton) {
					// Get the background color of the <a> element
					var backgroundColour = window.getComputedStyle(slideButton).backgroundColor;
					// if it's red, that maens it's off and will now be turned on
					if (backgroundColour == "rgb(204, 0, 30)"){
						freeScanActive = true;
					}
			} else {
					console.log('Slide button not found');
			}
	} else {
			console.log('Parent div with class "free-scan-input" not found');
	}

	// find and click the freescan toggle slider
	var freeScanButton = document.querySelectorAll('label[for="free_scan"][class="checkbox toggle android"]');
	freeScanButton[0].click();
	focusInput();
	scanSound();


	if (freeScanActive) {
		makeToast("toast-info", "Free Scan turned on.", 3);
		setTimeout(function() {
			sayWord("Free skann Yes");
		}, 400);
	} else {
		setTimeout(function() {
			makeToast("toast-info", "Free Scan turned off.", 3);
			sayWord("Free skann No");
		}, 400);
	}
}

// function to create a new toast message
// example className entries are toast-success, toast-error, toast-info and toast-warning
function makeToast(className, text, autoDestroyTime) {
		// Check if the toast-container div exists
		var toastContainer = document.getElementById('toast-container');

		// If it doesn't exist, create it at the end of the body
		if (!toastContainer) {
				toastContainer = document.createElement('div');
				toastContainer.id = 'toast-container';
				toastContainer.className = 'toast-top-right';
				toastContainer.style.overflowY = 'scroll';
				toastContainer.style.maxHeight = '95vh';
				document.body.appendChild(toastContainer);
		}

		// Create the new toast div
		var newToast = document.createElement('div');
		newToast.className = 'toast ' + className;
		newToast.setAttribute('aria-live', 'assertive');
		newToast.style.display = 'block';

		// Create the inner div for the toast message
		var toastMessage = document.createElement('div');
		toastMessage.className = 'toast-message';
		toastMessage.innerHTML = text;

		// Append the inner div to the toast div
		newToast.appendChild(toastMessage);

		// Append the toast div to the toast container
		toastContainer.insertBefore(newToast, toastContainer.firstChild);

		// Add event listener to destroy the toast on click
		newToast.addEventListener('click', function() {
				newToast.remove();
		});

		// Auto destroy the toast after the specified time if autoDestroyTime is provided and greater than 0
		if (autoDestroyTime && autoDestroyTime > 0) {
				setTimeout(function() {
						newToast.remove();
				}, autoDestroyTime * 1000);
		}
}

// Function to check whether a given container exists
function containerExists(containerName) {
	return containerList.includes(containerName);
}

// Funtion to get the currency symbol used for the rental charge total in the side bar
function getCurrencySymbol() {
	var element = document.getElementById("rental_charge_total");

	if (element) {
		// Get the innerHTML content
		var innerHTML = element.innerHTML;

		// Use a regular expression to extract the currency symbol
		var matches = innerHTML.match(/^[^\d]+/);

		// Check if a match is found
		if (matches && matches.length > 0) {
			return matches[0];
		}
	}
	// Return a default value if the element is not found or no match is found
	return "";
}



//// SMART SCAN SECTION - WORK IN PROGRESS
function smartScanSetup(assetScanned){
	console.log("Asset just scanned was: " + assetScanned);
	var tdElements = document.querySelectorAll("td.optional-01.asset.asset-column");
	// Loop through the elements and find the one with the correct inner text
	var desiredTdElement = null;
	for (var i = 0; i < tdElements.length; i++) {
		//console.log(tdElements[i].innerText.trim());
		if (tdElements[i].innerText.trim() == assetScanned) {
			desiredTdElement = tdElements[i];
			break; // Stop the loop once a match is found
		}
	}
	console.log(desiredTdElement.innerText.trim());
	var parentRow = desiredTdElement.closest('tr');
	var oppItemId = parentRow.getAttribute("data-oi-id");
	console.log("It's opportunity item ID is: " + oppItemId);

	var parentLi = parentRow.closest('li');
	var assetScannedPath = parentLi.getAttribute("data-path");
	var assetScannedHasChildren = false;
	if (parentLi.classList.contains("dd-haschildren")){
		assetScannedHasChildren = true;
	}
	console.log("It's path is:");
	console.log(assetScannedPath);
	console.log("It has children:");
	console.log(assetScannedHasChildren);


	var childElements = parentLi.querySelectorAll("td.optional-01.asset.asset-column");
	for (var i = 0; i < childElements.length; i++) {
		console.log(childElements[i].innerText.trim());
		if (childElements[i].innerText.trim() == "Group Booking") {

			var closestTr = childElements[i].closest('tr');
			var potentialAccessoryGroupId = closestTr.getAttribute("data-oi-id")
			var potentialAccessoryItemName = closestTr.querySelector("div.dd-content").innerText;
			potentialAccessoryItemName = potentialAccessoryItemName.replace(/🔎/g, '');
			potentialAccessoryItemName = potentialAccessoryItemName.trim();
			console.log(potentialAccessoryGroupId);
			console.log(potentialAccessoryItemName);
			var potentialAssetIds = findAssetNumbersByItemName(potentialAccessoryItemName);
			console.log(potentialAssetIds);
			for (var j = 0; j < potentialAssetIds.length; j++) {
				if (potentialAssetIds[j] != "Group Booking"){

					smartScanCandidates[potentialAssetIds[j]] = potentialAccessoryGroupId;
				}
			}
		}
	}
	console.log("Potenital SmartScan candidates:");
	console.log(smartScanCandidates);
}




function findAssetNumbersByItemName(itemName) {
		// Filter the allStock array for objects where item_name matches the provided itemName

		const matchingItems = allStock.stock_levels.filter(stock_levels => stock_levels.item_name === itemName);

		// Map the filtered objects to their asset_number values
		const assetNumbers = matchingItems.map(stockItem => stockItem.asset_number);
		const filteredAssetNumbers = assetNumbers.filter(value => value !== "Group Booking" && value !== "Sub-Rent Booking");
		return filteredAssetNumbers;
}






// allocate asset API call
function allocateAsset(asset){
	const url = 'https://api.current-rms.com/api/v1/opportunities/'+opportunityID+'/quick_allocate';
	const headers = {
		'X-SUBDOMAIN': apiSubdomain,
		'X-AUTH-TOKEN': apiKey,
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	};
	const bodyData = {
		apikey: apiKey,
		subdomain: apiSubdomain,
		stock_level_asset_number: asset,
		quantity: 1,
		container: "",
		free_scan: 0,
		mark_as_prepared: 0,
		group_scan: 0,
		group_type: "",
		group_id: ""
	};
	fetch(url, {
		mode: 'cors',
		method: 'POST',
		headers: headers,
		body: JSON.stringify(bodyData)
	})
	.then(response => response.json())
	.then(data => console.log(data))
	.catch(error => console.error('Error:', error));
}

// deallocate API call function - not currently working
function deallocateAsset(asset){
	const url = 'https://api.current-rms.com/api/v1/opportunities/'+opportunityID+'/quick_allocate';
	const headers = {
		'X-SUBDOMAIN': apiSubdomain,
		'X-AUTH-TOKEN': apiKey,
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	};
	const bodyData = {
		apikey: apiKey,
		subdomain: apiSubdomain,
		stock_level_asset_number: asset,
		quantity: 1,
		container: "",
		free_scan: 0,
		mark_as_prepared: 0,
		group_scan: 1,
		group_type: "group_opportunity_item",
		group_id: "26972"
	};
	fetch(url, {
		mode: 'cors',
		method: 'POST',
		headers: headers,
		body: JSON.stringify(bodyData)
	})
	.then(response => response.json())
	.then(data => console.log(data))
	.catch(error => console.error('Error:', error));
}


//// END OF SMART SCAN SECTION



// find and revert an item by asset number

function clickAndRevert(asset){
	var assetColumns = document.querySelectorAll('td.optional-01.asset.asset-column');
	var revertFound = false;

	// Loop through each element to find the one with the matching asset number
	for (var i = 0; i < assetColumns.length; i++) {
		var parentRow = assetColumns[i].closest('tr');
		var tickboxElement = parentRow.querySelector('input.item-select');
		if (assetColumns[i].innerText == asset){
			if (tickboxElement){
				tickboxElement.checked = true;
				revertFound = true;
			}
		} else {
			if (tickboxElement){
				tickboxElement.checked = false;
			}
		}
	} // end of for assetColumns for loop

	if (revertFound){
		var revertButton = document.querySelector('a.row-selector[data-confirm="Are you sure you want to revert the status of the selected items?"]');
		revertButton.removeAttribute("data-confirm");
		revertButton.click();

	}
}

function addAvailability(data) {
	console.log("Adding availability information");
	// Get all div elements with class 'dd-content'

	var divs = document.querySelectorAll('div.dd-content');

	// Iterate through each div
	divs.forEach(function(div) {
			var theProd = div.querySelector('a');
			if (theProd){

				// Check if the div's innerText is a key in the data object
				if (data.hasOwnProperty(theProd.innerText.trim())) {
						// Find the parent row of the div
						var parentRow = div.closest('tr');
						if (parentRow) {
								// Find the 'status-column' cell within the parent row
								var statusCell = parentRow.querySelector('.quantity-column');
								if (statusCell) {
										// Find the 'availability-count' span within the 'status-column' cell
										var availabilityCell = parentRow.querySelector('.availability-column');


										// If the 'availability-count' span exists, update its innerText
										if (availabilityCell) {

							
											var availabilitySpan = availabilityCell.querySelector('.availability-count');
											var avail = data[theProd.innerText.trim()];
											if (avail < 0){
												availabilitySpan.classList.add("avail-short");
												availabilitySpan.classList.remove("avail-good");
												if (quarantineCounts.hasOwnProperty(theProd.innerText.trim())) {
													availabilitySpan.classList.add("popover-help-added", "days-tooltip", "quarantine-tooltip");
													availabilitySpan.innerHTML = `${avail}<span class="days-tooltiptext"><u>Quarantines</u><br>Lost: ${quarantineCounts[theProd.innerText.trim()].lost}<br>Damaged: ${quarantineCounts[theProd.innerText.trim()].damaged}<br>Service: ${quarantineCounts[theProd.innerText.trim()].service}</span>`;
												} else {
													availabilitySpan.innerHTML = `${avail}`;
												}
											} else {
												availabilitySpan.classList.remove("avail-short");
												availabilitySpan.classList.add("avail-good");
												availabilitySpan.classList.remove("popover-help-added", "days-tooltip");
												availabilitySpan.innerHTML = avail;
											}
											
										} else {
												// If the 'availability-count' span does not exist, create it, append it to the status cell, and set its value
												availabilitySpan = document.createElement('span');
												availabilitySpan.className = 'availability-count';
												var avail = data[theProd.innerText.trim()];

												if (avail < 0){
													availabilitySpan.classList.add("avail-short");
													if (quarantineCounts.hasOwnProperty(theProd.innerText.trim())) {
														availabilitySpan.classList.add("popover-help-added", "days-tooltip", "quarantine-tooltip");
														availabilitySpan.innerHTML = `${avail}<span class="days-tooltiptext"><u>Quarantines</u><br>Lost: ${quarantineCounts[theProd.innerText.trim()].lost}<br>Damaged: ${quarantineCounts[theProd.innerText.trim()].damaged}<br>Service: ${quarantineCounts[theProd.innerText.trim()].service}</span>`;
														} else {
															availabilitySpan.innerHTML = `${avail}`;
														}
												} else {
													availabilitySpan.classList.add("avail-good");
													availabilitySpan.innerHTML = avail;
												}


												// Create a new <td> element
												const newTd = document.createElement('td');
												newTd.classList.add("align-right", "availability-column");
												// Insert the new <td> immediately after the existing <td>
												// However, since <td> must be a child of <tr>, ensure to adjust accordingly
												if (statusCell && statusCell.parentNode) {
														statusCell.insertAdjacentElement('afterend', newTd);
												}

												//availabilitySpan.innerText = avail;
												newTd.appendChild(availabilitySpan);
										}
								}
						}
				} else { // it's not a product with availability, so we need to add an empty availablity cell.
					// Find the parent row of the div
					var parentRow = div.closest('tr');
					if (parentRow) {
							// Find the 'status-column' cell within the parent row
							var statusCell = parentRow.querySelector('.quantity-column');
							var availabilityCell = parentRow.querySelector('.availability-column');
							if (!availabilityCell) {

								// Create a new <td> element
								const newTd = document.createElement('td');
								newTd.classList.add("align-right", "availability-column");
								// Insert the new <td> immediately after the existing <td>
								// However, since <td> must be a child of <tr>, ensure to adjust accordingly
								if (statusCell && statusCell.parentNode) {
										statusCell.insertAdjacentElement('afterend', newTd);
								}


							}
					}
				}
			} else {
				var theProd = div.querySelector('div.editable.item-name');
				if (theProd){
					// it's a text item, so we need to add an empty availablity cell.
					// Find the parent row of the div
					var parentRow = div.closest('tr');
					if (parentRow) {
						// Find the 'status-column' cell within the parent row
						var statusCell = parentRow.querySelector('.quantity-column');
						var availabilityCell = parentRow.querySelector('.availability-column');
						if (!availabilityCell) {
							// Create a new <td> element
							const newTd = document.createElement('td');
							newTd.classList.add("align-right", "availability-column");
							// Insert the new <td> immediately after the existing <td>
							// However, since <td> must be a child of <tr>, ensure to adjust accordingly
							if (statusCell && statusCell.parentNode) {
								statusCell.insertAdjacentElement('afterend', newTd);
							}
						}
					}

				}
			}
	});



	// Find the first 'td' cell with the class 'status-column'
	var quantityHeaderCell = document.querySelector('td.quantity-column');

	var availabilityHeaderCell = document.getElementById("availability-header-cell");

	if (!availabilityHeaderCell){
		const newTd = document.createElement('td');
		newTd.id = "availability-header-cell";
		newTd.innerText = "Avail";
		newTd.classList.add("align-right", "availability-column");
		if (quantityHeaderCell && quantityHeaderCell.parentNode) {
				quantityHeaderCell.insertAdjacentElement('afterend', newTd);
		}
		quantityHeaderCell.innerText = "Qty";
	}

	document.querySelectorAll('td.quantity-column.align-right').forEach(function(element) {
		element.classList.remove("align-right");
		element.classList.add("align-center");
	});

}


function removeAsset(assetToRemove){
	var assetColumns = document.querySelectorAll('td.optional-01.asset.asset-column');
	var removeFound = false;

	// Loop through each element to find the one with the matching asset number
	for (var i = 0; i < assetColumns.length; i++) {

			if (assetColumns[i].innerText == assetToRemove){
					removeFound = true;
					var parentRow = assetColumns[i].closest('tr');
					var editButton = parentRow.querySelector('a[data-rp="true"]');
					if (editButton) {
						// Append "&remove-" to the href attribute of the <a> element
						editButton.href += "&"+assetToRemove+"&remove";
						editButton.click();
					} else {
						console.log("Error: Couldn't find the edit button for asset "+ assetToRemove);
					}
					break;
			}
	} // end of for assetColumns for loop
}



// section below is to deal with modifying the picker behaviour in regards to items spread across Pages
if (orderView){

	// Select the target table you want to observe
	const targetTable = document.querySelector('#picker_search_results'); // Replace '#myTable' with your actual table selector



	// Check if the table exists
	if (targetTable) {
		tableUpdated = false;
		// Create a callback function to execute when mutations are observed
		const onTableMutated = (mutationsList, observer) => {
			for (const mutation of mutationsList) {
				if (mutation.type === 'childList' && !tableUpdated) {
					console.log('A change was detected.');
					console.log(mutation);
					// You can call your function here to handle the table changes
					tableUpdated = true;
					handleTableUpdate();
				} else if (mutation.type === 'subtree') {
					console.log('A change in the table\'s subtree was detected.');
					// Handle subtree changes if necessary
				}
				// Additional conditions can be added here if needed
			}
		};

		// Create an instance of MutationObserver with the callback function
		const observer = new MutationObserver(onTableMutated);

		// Configuration for the observer
		const config = {
			childList: true, // Observe direct children of the table
			subtree: true, // Observe all descendants of the table
			attributes: false, // Optionally observe attribute changes
			characterData: false // Optionally observe changes to text content
		};

		// Start observing the target table with the specified configurations
		observer.observe(targetTable, config);

		// Define the function to handle table updates
		function handleTableUpdate() {
			// Your custom logic to handle the table update
			console.log('Picker table content has been updated.');
			// Perform your desired actions here
			const pickerModal = document.getElementById('pickerModal');

			var pickerBody = pickerModal.querySelector("tbody");

			// set minimum of all number inputs to 0
			if (pickerBody){
					var allPickerRows = pickerBody.querySelectorAll("tr");
					allPickerRows.forEach((item, i) => {
					item.querySelector('input[type="number"]').min = "0";
				});
			}

			let activePageLi = pickerModal.querySelector("li.active");

			if (!activePageLi){
				pickerPageMemory.clear();
				pickerQtyMemory.clear();
				pickerChosenQtyMemory.clear();
				pickerPageStorage.clear();
				tableUpdated = false;
				return;
			}

			let activePage = activePageLi.innerText;


			// first restore saved values into the rows, if they have been entered Previously
			if (pickerQtyMemory.has(activePage) && pickerPageStorage.has(activePage)){

				// resurrect the previous rows so that we see the expanded accessories
				pickerBody.innerHTML = pickerPageStorage.get(activePage);

				var arrayOfPickedValues = pickerQtyMemory.get(activePage);
				var allPickerRows = pickerBody.querySelectorAll("tr");
				allPickerRows.forEach((item, i) => {
					if (arrayOfPickedValues[i] > 0){
						item.querySelector('input[type="number"]').value = arrayOfPickedValues[i];
					} else {
						item.querySelector('input[type="number"]').value = "";
					}
				});
			}


			// now add values from other pages to the bottom of this one.

			if (activePage && !rowsAdded){
				// Iterating through each key in the map using forEach

				var htmlToAdd;
				var valuesToAdd = [];

				pickerPageMemory.forEach((value, key) => {
					if (key != activePage){
						value.forEach((row) => {
							htmlToAdd += row;
						});
					}
				});

				pickerChosenQtyMemory.forEach((value, key) => {
					if (key != activePage){
						console.log (key, value);
						value.forEach((qty) => {
							valuesToAdd.push(qty);
						});
					}
				});


				var temp = document.createElement('div');
				temp.innerHTML = '<table>' + htmlToAdd + '</table>'; // Wrap rowHTML in a table for proper parsing

				var rowsToAdd = temp.querySelectorAll('tr');

				if (rowsToAdd){
					rowsToAdd.forEach((rowToAdd, i) => {

						pickerBody.appendChild(rowToAdd);
						rowToAdd.querySelector('input[type="number"]').value = valuesToAdd[i];
						rowToAdd.dataset.additional = 'true';
						rowToAdd.style.display = "none";

					});
				}
				rowsAdded = true;

			}

		}

		// Optional: Stop observing after a certain condition or time
		// observer.disconnect(); // Uncomment to stop observing when needed
	} else {
		console.error('Picker table not found.');
	}



		// Select the pickerModal element
	const pickerModal = document.getElementById('pickerModal');

	// Check if the element exists to avoid errors
	if (pickerModal) {
		// Add an event listener for click events on the pickerModal element
		pickerModal.addEventListener('click', function(event) {
			// Check if the clicked element is an <a> tag
			const clickedElement = event.target;
			if (clickedElement.tagName.toLowerCase() === 'a') {
				// Find the closest <li> ancestor
				const liElement = clickedElement.closest('li');
				// Check if the <li> exists, does not have the class "disabled", and is inside a <ul> with the class "pagination"
				if (liElement && !liElement.classList.contains('disabled') && !liElement.classList.contains('active')) {
					const ulElement = liElement.closest('ul');
					if (ulElement && ulElement.classList.contains('pagination')) {
						handleValidLinkClick(clickedElement);
						tableUpdated = false;
					}
				}
			}
		});

		// Define the function to handle the valid <a> click
		function handleValidLinkClick(linkElement) {

			// work out the current page:
			let activePage = pickerModal.querySelector("li.active").innerText;

			let arrayOfrows = [];
			let arrayOfValues = [];
			let arrayOfChosenValues = [];

			// Log any values entered:
			var pickerBody = pickerModal.querySelector("tbody");
			var allPickerRows = pickerBody.querySelectorAll("tr");
			console.log(allPickerRows.length);
			allPickerRows.forEach((item, i) => {
					if (item.dataset.additional != 'true'){
					var inputQty = item.querySelector('input[type="number"]').value;
					if (parseInt(inputQty) > 0){
						arrayOfrows.push(item.outerHTML);
						arrayOfValues.push(inputQty);
						arrayOfChosenValues.push(inputQty);
					} else {
						arrayOfValues.push(0);
					}
				}


			});
			pickerPageStorage.set(activePage, pickerBody.innerHTML); // the entire innerHTML of this page
			pickerPageMemory.set(activePage, arrayOfrows); // just the rows from this page that have a value against them
			pickerQtyMemory.set(activePage, arrayOfValues); // values for every single row
			pickerChosenQtyMemory.set(activePage, arrayOfChosenValues); // values for just the rows that have a value
			rowsAdded = false;
		}
	} else {
		console.error('Element with ID "pickerModal" not found.');
	}
}

///// End of picker SECTION



// Function to delete an element (most likely a toast message) after a given time in seconds
function destroyAfterTime(element, seconds) {

	if (seconds == 0){
		return;
	} else {
		var time = seconds * 1000;
	}

	// Check if the element is a valid node
	if (element instanceof Node) {
		// Set a timeout to remove the element after the specified time
		setTimeout(() => {
			// Check if the element is still in the DOM before attempting to remove it
			if (element.parentNode) {
				element.parentNode.removeChild(element);
				console.log('Element removed from the DOM.');
			}
		}, time);
	} else {
		console.error('Provided argument is not a valid DOM node.');
	}
}


function transformContainerisationData(data) {
	// Create a new object to store the transformed data
	const transformedData = {};

	//Use Object.values() to get an array of nested objects
	const nestedObjects = Object.values(data);

	// Use map() to extract the values of the "asset" key
	const assetValues = nestedObjects.map(nestedObj => nestedObj.asset);
	//console.log(assetValues);
	// Function to place an item and its contents into the correct container

	function placeItem(id, item, containerMap) {
		if (item.container === "" || item.container == String(item.asset)) {
			// If the item has no container, it is a top-level item
			transformedData[id] = item;
		} else {
			// If the item has a container, find the container and place the item inside it
			let container = containerMap[item.container];
			if (container) {
				container.contents[id] = item;
			} else if (!assetValues.includes(item.container)){
				// the container given is not an actual item.
				const newId = generateRandomString();
				const newItem = {asset: item.container, name: item.container, container: "", weight: 0, contents:{}};
				transformedData[newId] = newItem;
				// Add the item to the containerMap to allow for nesting
				containerMap[item.container] = newItem;
				return false;
			} else {
				// If the container is not yet in the containerMap, wait until it is added
				return false;
			}
		}
		// Add the item to the containerMap to allow for nesting
		containerMap[item.asset] = item;
		return true;
	}

	// This map helps to track where each item has been placed
	const containerMap = {};

	// First, place all items into their respective containers or as top-level items
	let itemsLeft = Object.keys(data);
	let maxIterations = itemsLeft.length * 10; // Avoid infinite loop, assume max 10 iterations per item
	let iteration = 0;

	let logItemsLeft = {};

	while (itemsLeft.length > 0 && iteration < maxIterations) {
		const remainingItems = [];
		for (const id of itemsLeft) {
			const item = data[id];
			if (!placeItem(id, item, containerMap)) {
				// If the item couldn't be placed, keep it for the next iteration
				remainingItems.push(id);
			}
		}
		if (remainingItems.length === itemsLeft.length) {
			// If no items were placed in this iteration, break the loop to avoid infinite loop
			break;
		}
		itemsLeft = remainingItems;
		iteration++;
	}

	//console.log(containerMap);
	//console.log(JSON.stringify(transformedData, null, 2));

	return transformedData;
}


function generateRandomString(length = 10) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		const charactersLength = characters.length;

		for (let i = 0; i < length; i++) {
				const randomIndex = Math.floor(Math.random() * charactersLength);
				result += characters.charAt(randomIndex);
		}

		return result;
}

function detectCircularContainment(data) {
		let errorContainers = [];
		let containerMap = {};

		// First, build a container map to index by asset.
		for (const key in data) {
				// Ignore non-asset items or items without a container set.
				if (data[key].asset === "Group Booking" || data[key].asset === "Bulk Stock" ||
						data[key].asset === "Non-Stock Booking" || data[key].asset.includes("Sub-Rent") ||
						!data[key].container) {
						continue;
				} else {
						const newKey = data[key].asset;
						containerMap[newKey] = { idKey: key, container: data[key].container };
				}
		}

		for (const item in containerMap) {
				let visited = new Set();
				if (checkItem(item, item, containerMap, visited)) {
						errorContainers.push(item);
				}
		}

		return errorContainers;

		function checkItem(target, asset, map, visited) {
				// Ensure the asset exists in the map before accessing its properties.
				if (!map[asset] || !map[map[asset].container]) {
						return false;
				}

				// ignore assets where container is set to themselves
				if (asset == map[asset].container){
					return false;
				}

				let parentAsset = map[asset].container;

				// If the parent asset has already been visited, we have a cycle.
				if (visited.has(parentAsset)) {
						return false;
				}

				// Mark the current asset as visited.
				visited.add(asset);

				if (!map[parentAsset] || !map[parentAsset].container) {
						return false;
				} else if (map[parentAsset].container === target) {
						return true;
				} else {
						return checkItem(target, parentAsset, map, visited);
				}
		}
}



async function recallOppDetails(oppID) {
	// Retrieve the stored data

	/* removal block used for dev testing
	try {
		await chrome.storage.local.remove([`opp-${oppID}`]);
		console.log(`opp-${oppID} removed`);
	} catch (err) {
		console.error('Error removing key:', err);
	}
	*/

	const result = await chrome.storage.local.get([`opp-${oppID}`]);
	
	// Ensure the result exists and the specific key is available.
	if (result && result[`opp-${oppID}`]) {
		const oppData = result[`opp-${oppID}`];
		return {
			opportunity_items: JSON.parse(oppData.opportunity_items),
			meta: JSON.parse(oppData.meta),
			time: oppData.time
		};
	}
	return null;
}

// function to use when combining oppData with updateOppData
function mergeById(arrayInitial, arrayUpdate) {
	// 1) Take only the initial items whose id isn’t in the updates
	const filtered = arrayInitial.filter(
		init => !arrayUpdate.some(upd => upd.id === init.id)
	);

	// 2) Concatenate those “survivors” with all of the updates
	return [...filtered, ...arrayUpdate];
}


// Remove any entries in chrome.storage.local whose value.time is older than one week.
 
async function cleanUpOldEntries() {
	try {
		// Grab all stored items
		const items = await chrome.storage.local.get(null);
		
		// Compute cutoff timestamp (one week ago)
		const now = Date.now();
		const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
		const cutoff = now - oneWeekMs;
		
		// Collect keys to remove
		const keysToRemove = Object.entries(items)
			.filter(([key, value]) => {
				// Check existence of a .time property, and that it's a valid date
				if (value && typeof value.time === 'string') {
					const t = Date.parse(value.time);
					return !isNaN(t) && t < cutoff;
				}
				return false;
			})
			.map(([key]) => key);
		
		// Remove stale entries (if any)
		if (keysToRemove.length) {
			await chrome.storage.local.remove(keysToRemove);
			console.log(`Removed ${keysToRemove.length} stale entr${keysToRemove.length > 1 ? 'ies' : 'y'}:`, keysToRemove);
		} else {
			console.log('No entries older than one week found.');
		}
		
	} catch (err) {
		console.error('Error cleaning up old entries:', err);
	}
}




function orderViewWeights(){

	//console.log("Calculating container weights");

	let orderStockWeight = 0;
	let orderSubhireWeight = 0;
	let subHireWeights = {};

	oppData.opportunity_items.forEach(item => {

		const weight = Number(item.weight) || 0;
		const totalWeight = Number(item.weight_total) || 0;
		let itemQuantity = Number(item.quantity) || 0;
		let subWeightThisItem = 0;

		const isSubrent = (item.sub_rent === true) || (item.sub_rent === 'true');
		//const isProduct = (item.item_type == "Product");
		const isProduct = (item.transaction_type_name == "Rental" || item.transaction_type_name == "Sale");

		

		if (isSubrent && isProduct) {
			item.item_assets.forEach(asset => {
				if (asset.sub_rent == true){
					const thisSupplier = asset.supplier_id;
					const thisQty = Number(asset.quantity);
					
					// take away the number of sub hired items from the line total
					itemQuantity -= thisQty;

					// work out the weight of the sub-hired item
					const thisWeight = weight * thisQty;

					// add this to the subHiredWeight object
					subHireWeights[thisSupplier] = (subHireWeights[thisSupplier] || 0) + thisWeight;
					orderSubhireWeight += thisWeight;
					subWeightThisItem += thisWeight;

				}
			});

			// work out the stock weight of remaning quantity

			orderStockWeight += (totalWeight - subWeightThisItem);
			
		} else if (isProduct) {
		 
			orderStockWeight += totalWeight;
		}
	});

	// avoid floating‑point weirdness
	orderSubhireWeight = Math.round(orderSubhireWeight * 100) / 100;
	orderStockWeight   = Math.round(orderStockWeight   * 100) / 100;


	if (orderSubhireWeight > 0){
		console.log(subHireWeights);
		var subhireWeightLi = document.getElementById("subhire_weight");
		var stockWeightLi = document.getElementById("stock_weight");

		if (subhireWeightLi){
			subhireWeightLi.innerHTML = `${orderSubhireWeight} ${weightUnit}`;
			stockWeightLi.innerHTML = `${orderStockWeight} ${weightUnit}`;
		} else {
			// Find the <li> element that contains the weight
			var weightLi = document.querySelector('#weight_total').closest('li');

			// Create a new <li> element
			var subLi = document.createElement('li');
			
			let newHtmlString = `<span>&#8627; Sub-Rent Weight:</span>
												 <span id="subhire_weight";>
												 ${orderSubhireWeight} ${weightUnit}
												 </span>`;
			
			// iterate through each key in subHireWeights
			Object.keys(subHireWeights).forEach((key) => {
				let supplierName = key;
				let thisSupplierWeight = Math.round(subHireWeights[key]   * 100) / 100;
				if (supplierName == "null"){
					supplierName = "No Supplier";
				}
				newHtmlString += `<br><span>${'&nbsp;'.repeat(3)}&#8627;</span><span class="subhire-member" data-member-id="${key}">${supplierName}</span><span>: ${thisSupplierWeight} ${weightUnit}</span>`;
			});
			

			
			
			
			
			
			
			subLi.innerHTML = newHtmlString;

			// Insert the new <li> after the existing one
			weightLi.parentNode.insertBefore(subLi, weightLi.nextSibling);


			// Create a new <li> element
			var stockLi = document.createElement('li');
			stockLi.innerHTML = `<span>&#8627; Stock Weight:</span>
												 <span id="stock_weight";>
												 ${orderStockWeight} ${weightUnit}
												 </span>`;

			// Insert the new <li> after the existing one
			weightLi.parentNode.insertBefore(stockLi, weightLi.nextSibling);

		}

	}
}



async function availabilityScrape(opp, start, end){

	var availabilityData = {};

	function convertToDateTime(timeStr) {
		var hours = parseInt(timeStr.substring(0, 2));
		var minutes = parseInt(timeStr.substring(2, 4));
		return hours * 60 + minutes;
	}

	await recallApiDetails();
	const timeStart = start.split(' ')[1].replace(':', '');
	const timeEnd = end.split(' ')[1].replace(':', '');
	
	const response = await fetch(`https://${apiSubdomain}.current-rms.com/availability/opportunity/${opportunityID}?${timeStart}&${timeEnd}&scrape`, { credentials: 'include' });
	if (!response.ok) throw new Error(`Failed to fetch detail page: ${response.status}`);
	const html = await response.text();

	const doc  = new DOMParser().parseFromString(html, 'text/html');
	const scraped = doc.querySelector('h1').innerText;
	//console.log(scraped);
	// Find the table with the ID 'availability-grid'
	var table = doc.getElementById('availability-grid');

	// check if we're working to a period less than a full day
	var timeDivide = 1;
	if (table.classList.contains("period2")){
		timeDivide = 2;
	} else if (table.classList.contains("period4")){
		timeDivide = 4;
	}

	if (timeDivide > 1){
		// get start and end time from the url
		var startString = timeStart;
		var endString = timeEnd;
		var startTime = convertToDateTime(startString);
		var endTime = convertToDateTime(endString);

		console.log("Start string: " + startString);
		console.log("End string: " + endString);

		console.log("Start Time: " + startTime);
		console.log("End Time: " + endTime);



		console.log("timeDivide: " + timeDivide);


		if (timeDivide == 2){
			if (startTime > convertToDateTime("1200")){
				ignoreStart = 1;
			}
			if (endTime <= convertToDateTime("1200")){
				ignoreEnd = 1;
			}


		} else if (timeDivide == 4){
			if (startTime > convertToDateTime("1800")){
				ignoreStart = 3;
			} else if (startTime > convertToDateTime("1200")){
				ignoreStart = 2;
			} else if  (startTime > convertToDateTime("0600")){
				ignoreStart = 1;
			}

			if (endTime <= convertToDateTime("0600")){
				ignoreEnd = 3;
			} else if (endTime <= convertToDateTime("1200")){
				ignoreEnd = 2;
			} else if  (endTime <= convertToDateTime("1800")){
				ignoreEnd = 1;
			}

		}
		console.log("ignoreStart: " + ignoreStart);
		console.log("ignoreEnd: " + ignoreEnd);
	} // end if time divide > 1


	// Check if the table exists
	if (table) {
			// Find all <td> elements within the table
			var cells = table.getElementsByTagName('td');

			// Iterate through each cell
			for (var i = 0; i < cells.length; i++) {
					var cell = cells[i];

					// Check if the cell has the class 'product_booking'
					if (cell.classList.contains('product_booking')) {
							// Log the trimmed innerText of the 'product_booking' cell
							var productName = cell.innerText.trim()
							//console.log('Product Booking:', productName);

							// Get the parent row of the current cell
							var row = cell.parentElement;

							// Find all 'period-of-day' cells in the same row
							var periodCells = row.getElementsByClassName('period-of-day');
							var lowestValue = null;

							// Iterate through each 'period-of-day' cell to find the lowest value
							for (var j = ignoreStart; j < (periodCells.length - ignoreEnd); j++) {
									var periodText = periodCells[j].innerText.trim();
									var firstNumber = periodText.split('\n')[0]; // Get the first line (the number before any brackets)

									// Convert the extracted number to an integer
									var number = parseInt(firstNumber, 10);

									// Update the lowest value if necessary
									if (lowestValue === null || number < lowestValue) {
											lowestValue = number;
									}
							}

							// Log the lowest value if found
							if (lowestValue !== null) {
									//console.log('Lowest Period of Day:', lowestValue);
									availabilityData[productName] = lowestValue;
							}
					}
			}
			console.log(availabilityData);
			console.log(Object.keys(availabilityData).length);

			// grab the opp number to pass back for warehouse notes
			var thisOpp = doc.getElementById("opportunity_id").value;


			if (Object.keys(availabilityData).length > 0){
				console.log({messageType: "availabilityData", messageData: availabilityData, messageOpp: thisOpp});
				addAvailability(availabilityData);
			}
			
	} else {
			console.log('Table with ID "availability-grid" not found.');
	}

}

async function availabilityScrapeNonDom(opp, start, end){
	const thisStarted = Date.now();

	function textFromHtml(raw) {
		return raw
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<[^>]*>/g, '')
			.trim();
	}

	function decodeHtmlEntities(str) {
		const textarea = document.createElement('textarea');
		textarea.innerHTML = str;
		return textarea.value;
	}


	var availabilityData = {};

	function convertToDateTime(timeStr) {
		var hours = parseInt(timeStr.substring(0, 2));
		var minutes = parseInt(timeStr.substring(2, 4));
		return hours * 60 + minutes;
	}

	await recallApiDetails();
	const timeStart = start.split(' ')[1].replace(':', '');
	const timeEnd = end.split(' ')[1].replace(':', '');
	
	const response = await fetch(`https://${apiSubdomain}.current-rms.com/availability/opportunity/${opportunityID}?${timeStart}&${timeEnd}&scrape`, { credentials: 'include' });
	if (!response.ok) throw new Error(`Failed to fetch detail page: ${response.status}`);

	const html = await response.text();


	//console.log(html);


	/* ─────────────────── <h1> ─────────────────── */
	const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
	const scraped = h1Match ? textFromHtml(h1Match[1]) : '';
	console.log('Heading:', scraped);

	/* ───────────── <table id="availability-grid"> (order‑agnostic) ───────────── */
	const tableTagMatch = html.match(
		/<table\b[^>]*\bid\s*=\s*(["'])availability-grid\1[^>]*>([\s\S]*?)<\/table>/i
	);

	if (!tableTagMatch) {
		console.warn('No #availability-grid table found');
		return {};
	}

	const tableOpenTag = tableTagMatch[0].match(/<table\b[^>]*>/i)[0]; // just the <table …> start tag
	const tableHtml    = tableTagMatch[2];                             // inner HTML between <table>…</table>

	/* extract the class attribute, whatever its position */
	const classAttrMatch = tableOpenTag.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
	const tableClasses   = classAttrMatch ? classAttrMatch[2].split(/\s+/) : [];


	/* ─────── replicate your period-split logic ─────── */
	let timeDivide = 1;
	if (tableClasses.includes('period2')) timeDivide = 2;
	else if (tableClasses.includes('period4')) timeDivide = 4;

	let ignoreStart = 0;
	let ignoreEnd   = 0;

	if (timeDivide > 1) {
		const startTime = convertToDateTime(timeStart); // ← your helpers
		const endTime   = convertToDateTime(timeEnd);

		if (timeDivide === 2) {
			if (startTime > convertToDateTime('1200')) ignoreStart = 1;
			if (endTime   <= convertToDateTime('1200')) ignoreEnd   = 1;
		} else if (timeDivide === 4) {
			if      (startTime > convertToDateTime('1800')) ignoreStart = 3;
			else if (startTime > convertToDateTime('1200')) ignoreStart = 2;
			else if (startTime > convertToDateTime('0600')) ignoreStart = 1;

			if      (endTime <= convertToDateTime('0600')) ignoreEnd = 3;
			else if (endTime <= convertToDateTime('1200')) ignoreEnd = 2;
			else if (endTime <= convertToDateTime('1800')) ignoreEnd = 1;
		}
	}

	/* ───────────────── rows & cells ───────────────── */

	// iterate every <tr> inside the table
	for (const [, rowHtml] of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
		// cell with class="product_booking"
		const bookingMatch = rowHtml.match(
			/<td[^>]*class=(?:"[^"]*\bproduct_booking\b[^"]*"|'[^']*\bproduct_booking\b[^']*')[^>]*>([\s\S]*?)<\/td>/i
		);
		if (!bookingMatch) continue;

		let productName = textFromHtml(bookingMatch[1]);
		productName = decodeHtmlEntities(productName); // Decode HTML entities

		// all the period-of-day cells in the same row
		const periods = [...rowHtml.matchAll(
			/<td[^>]*class=(?:"[^"]*\bperiod-of-day\b[^"]*"|'[^']*\bperiod-of-day\b[^']*')[^>]*>([\s\S]*?)<\/td>/gi
		)].map((m) => textFromHtml(m[1]));

		let lowestValue = null;

		for (let i = ignoreStart; i < periods.length - ignoreEnd; i++) {
			const firstLine = periods[i].split('\n')[0];
			const number = parseInt(firstLine, 10);

			if (!Number.isNaN(number) && (lowestValue === null || number < lowestValue)) {
				lowestValue = number;
			}
		}

		if (lowestValue !== null) {
			//console.log('Lowest Period of Day:', lowestValue);
			availabilityData[productName] = lowestValue;
		}
	}

	console.log(availabilityData);
	console.log(Object.keys(availabilityData).length);


	if (Object.keys(availabilityData).length > 0){
		console.log({messageType: "availabilityData", messageData: availabilityData, messageOpp: opp});
		addAvailability(availabilityData);
	}
	const thisEnded = Date.now();
	console.log("Availability nonDom took " + (thisEnded - thisStarted) + "ms");
			
}




async function warehouseNotesScrapeNonDom(opp){
	const thisStarted = Date.now();

	function textFromHtml(raw) {
		return raw
			.replace(/<br\s*\/?>/gi, '\n')   // keep line‑breaks
			.replace(/<[^>]*>/g, '')         // strip all tags
			.trim();
	}
	function escapeRE(s) {               // escape for RegExp literals
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	



	await recallApiDetails();          // ← your helper (sets apiSubdomain, …)

	const res = await fetch(
		`https://${apiSubdomain}.current-rms.com/opportunities/${opportunityID}?view=d`,
		{ credentials: 'include' }
	);
	if (!res.ok) throw new Error(`detail page fetch failed (${res.status})`);
	const html = await res.text();

	// warehouse notes
	const warehouseNotesLog = {};

	/*   <div class="opportunity-item-warehouse-notes
									opportunity-item-warehouse-notes_67449"> … </div>   */
	const noteDivRE =
		/<div\b[^>]*class\s*=\s*["'][^"']*\bopportunity-item-warehouse-notes\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;

	for (const match of html.matchAll(noteDivRE)) {
		const fullDiv   = match[0];      // opening tag + innerHTML + </div>
		const noteInner = match[1];      // just the innerHTML

		// pick up the “group” id (67449) from the class token …_#####  
		const gidMatch = fullDiv.match(/opportunity-item-warehouse-notes_(\d+)/);
		if (!gidMatch) continue;         // should never happen
		const groupId = gidMatch[1];

		// first try: find the <tr … id="groupId" … data-oi-id="###" …>
		let itemRef = null;
		const trRE = new RegExp(
			`<tr\\b[^>]*\\bid\\s*=\\s*["']${escapeRE(groupId)}["'][^>]*\\bdata-oi-id\\s*=\\s*["']([^"']+)["']`,
			'i'
		);
		const trMatch = html.match(trRE);
		if (trMatch) {
			itemRef = trMatch[1];
		} else {
			/* fallback: <li data-id="groupId" data-item-id="###" …> */
			const liRE = new RegExp(
				`<li\\b[^>]*\\bdata-id\\s*=\\s*["']${escapeRE(groupId)}["'][^>]*\\bdata-item-id\\s*=\\s*["']([^"']+)["']`,
				'i'
			);
			const liMatch = html.match(liRE);
			if (liMatch) itemRef = liMatch[1];
		}

		if (itemRef) {
			warehouseNotesLog[itemRef] = textFromHtml(noteInner);
		}
	}

	// sub‑rent members
	var members = {};
	/* any <td class="optional-01 asset asset-column"> that starts “Sub‑Rent Booking” */
	const tdRE =
		/<td\b[^>]*class\s*=\s*["'][^"']*\boptional-01\b[^"']*\basset\b[^"']*\basset-column\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi;

	for (const match of html.matchAll(tdRE)) {
		const tdInner = match[1];
		if (!textFromHtml(tdInner).startsWith('Sub-Rent Booking')) continue;

		const aMatch = tdInner.match(
			/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
		);
		if (!aMatch) continue;           // no link, nothing to do

		const href = aMatch[1];
		const name = textFromHtml(aMatch[2]);

		const idMatch = href.match(/\/members\/(\d+)(?=\?)/);
		if (idMatch) members[idMatch[1]] = name;
	}

	// log + return
	const thisEnded = Date.now();
	console.log("warehouseNotesScrapeNonDom took " + (thisEnded - thisStarted) + "ms");

	if (Object.keys(warehouseNotesLog).length || Object.keys(members).length) {
		console.log({
			messageType: 'warehouseNotesData',
			messageData: { warehouseNotesLog, members }
		});
	}

	// Do something with the scraped data
	for (let key in warehouseNotesLog) {
		if (warehouseNotesLog.hasOwnProperty(key)) {  // Ensures the key belongs to the object, not its prototype
			let value = warehouseNotesLog[key];

			var liElement = document.querySelector('li.grid-body-row[data-id="'+key+'"]');

			if (liElement){
				var tdElement = liElement.querySelector('td.dd-name');
				if (!tdElement){
					console.log("issue finding dd-name td element for "+value);
				} else {
					let existingIcon = tdElement.querySelector("span.warehouse-tooltip");

					if (existingIcon){
						existingIcon.remove();
					}
						var itemName = tdElement.querySelector('a');
						if (!itemName){
							itemName = tdElement.querySelector('div.item-name');
						}
						if (itemName){
							itemName.insertAdjacentHTML('afterend', `<span class="warehouse-tooltip">&nbsp;<i class="icn-cobra-paste3 warehouse-edit"></i><span class="warehouse-tooltiptext" data-warehouse="${value}"><u>WAREHOUSE NOTE:</u><br>${value}</span></span>`);
						}

				}
			}
		}
	}


	// iterate through each key in members
	for (const key in members) {
		if (members.hasOwnProperty(key)) {
			let memberName = members[key];
			
			// if the memberName is longer than 10 characters, reduce to the first 10 and add "..."
			if (memberName.length > 16){
				memberName = memberName.substring(0, 16);
			}

			//find a span element with class "subhire-member" and data-member-id that matches the key
			var memberElement = document.querySelector('span.subhire-member[data-member-id="'+key+'"]');
			if (memberElement){
				if (apiSubdomain){
					memberElement.innerHTML = `<a href="https://${apiSubdomain}.current-rms.com/members/${key}"  target="_blank">${memberName}</a>`;
				} else {
					memberElement.innerText = memberName;
				}

			}
		}
	}
}



function applyNestedCharges(){

	// get all li elements with the data-nestedcharge attribute
	var nestedLi = document.querySelectorAll('li[data-nestedcharge]');
	// iterate through each li element
	nestedLi.forEach((item, i) => {
		// check if the li has the class "dd-collapsed"
		if (item.classList.contains("dd-collapsed") && nestedTotals){
			// if it does, find the child element td.item-total
			var type = item.querySelector('.type-column').innerText.trim();
			console.log(type);
			if (type == "Sale"){
				var totalElement = item.querySelector('span.popover-help-added');
				//set the inner text
				if (totalElement){
					totalElement.firstChild.nodeValue = `${currencyPrefix}${parseFloat(item.dataset.nestedcharge).toFixed(2)}`;
					totalElement.classList.add("nested-charge");
				}

			} else {
				var totalElement = item.querySelector('span.popover_help');
				//set the inner text
				if (totalElement){
					totalElement.innerText = `${currencyPrefix}${parseFloat(item.dataset.nestedcharge).toFixed(2)}`;
					totalElement.classList.add("nested-charge");
				}
			}
			
		} else {
			// if it does not... Group is expanded, so we need to show the original charge
			var type = item.querySelector('.type-column').innerText.trim();
			console.log(type);
			if (type == "Sale"){
				var totalElement = item.querySelector('span.popover-help-added');
				if (totalElement){
					totalElement.firstChild.nodeValue = `${currencyPrefix}${parseFloat(item.dataset.originalcharge).toFixed(2)}`;
					totalElement.classList.remove("nested-charge");
				}
			} else {
				var totalElement = item.querySelector('span.popover_help');
				//set the inner text
				if (totalElement){
					totalElement.innerText = `${currencyPrefix}${parseFloat(item.dataset.originalcharge).toFixed(2)}`;
					totalElement.classList.remove("nested-charge");
				}
		}
			}

			

	});
}




function getSubdomainFromUrl(url) {
	try {
		const { hostname } = new URL(url);            
		const parts = hostname.split('.');
		// only treat it as a subdomain if there are at least 3 labels
		if (parts.length >= 3) {
			return parts[0];                             
		}
	} catch (e) {
		console.error("Invalid URL:", url, e);
	}
	return "";
}


function createTopAlert(type, message, code){
	const linksBar = document.querySelector('.row.details-top-links');
	if (!linksBar) {
		console.error('Element with tag name "details-top-links" not found.');
		return;
	}


	// check if there is an existing div with a data-code == code
	const existingAlert = document.querySelector(`div.top-alert[data-code="${code}"]`);
	if (existingAlert) {
		// if it exists, remove it
		existingAlert.remove();
	}

	// Create a new div element
	const alertDiv = document.createElement('div');
	alertDiv.className = `top-alert ${type}`;
	alertDiv.setAttribute('data-code', code);

	var theHtml = '';
	if (type == "error"){
		theHtml = `<i class="icn-cobra-error"></i>`;
	} else if (type == "warning"){
		theHtml = `<i class="icn-cobra-warning"></i>`;
	} else {
		theHtml = `<i class="icn-cobra-info"></i>`;
	}
	alertDiv.innerHTML = `
			${theHtml}
			<span class="alert-text">${message}</span>
			
	`;
	
	// Insert the new DIV immediately before the linksBar
	linksBar.parentNode.insertBefore(alertDiv, linksBar);

	// adjust top-margin of linksBar
	linksBar.style.marginTop = '6px';

};
