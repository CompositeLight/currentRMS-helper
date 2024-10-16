# currentRMS-helper 1.31.21

Below is a list of current features. It's the same information as the Readme change log, but listed "per area" to make it easier for new users to see what the extension adds.



## General

- Settings popup added. Access this by clicking no the Extensions jigsaw icon in the top corner of Chrome, and then the CurrentRMS Helper rocket icon. You can pin this icon for easier access. The chosen settings are stored between sessions.

- API connection: There is now a field to enter an API key and subdomain into the CurrentRMS Helper. This unlocks new features, and paves the way for more in the future... See installation instructions above.

- CSS override for Modal Headers so that they're "sticky". This means, on a very long Recent Actions modal for example, the close button never leaves the screen (which is unnecessary and irritating).

- The settings panel includes an option to automatically dismiss error messages after a given number of seconds. Setting the value to 0 will cause default behaviour (ie. error messages will remain until clicked on). This is primarily aimed at those using scanners with integrated screens.

- In the Opportunities, Products, Services and Purchase Order pages you can now change view settings without losing the current search term entered. This works when recalling saved views, or the Default, or when changing the Per Page setting. This doesn't work for Filter Selection - sadly that's a bit more complicated.

- Added a Recent tab to the top menu bar. This offers quick links to the last 10 opportunities you looked at, in the order than you looked at them.

## Detail view

- Helpful Cursor: The cursor will now automatically jump back into the allocation/scan input box after certain actions. For example, expanding or collapsing the tree of items, or selecting one of the option sliders like Mark As Prepared or Free Scan.

- Added a buttons to Hide Prepared, show Sub-Rents Only, Hide Sub-Renst, show Shortages only, Bulk Only, hide/show Notes.

- Mark As Prepared by Default. This is now an option you can set in the Settings popup. In our warehouse, we generally don't use the "allocate" stage, so it's preferable to have "mark as prepared" ticked by default.

- Allocate by Default: New setting in the pop-up for jumping straight to Allocate tab, rather than landing in Functions tab of the Detail View. Default is true/on. Might circle back to make this jump to check-in instead depending on the state of the opportunity.

- Freescan: You can now toggle Free Scan mode by scanning a barcode with the value "freescan".

- Revert By Scan: Added a new special barcode: "*revert*". Scanning this will prompt the user to scan an item. The extension will then tick the box of that item, untick any other boxes, and press the "Revert Status" button in the Action menu. It also dismisses the confirmation dialog that would normally appear. You can abort a "revert scan" by scanning *revert* a second time.

- Remove By Scan: Much requested by warehouses that go straight to Prepared, this works the same as the *revert* scan (which is still in place), but instead of reverting by one step the asset will be completely removed, regardless of it's status. BE AWARE: This even works for items that have been Booked Out, so use wisely. Due to the auto-play limitations of Chrome, it is not possible to play a sound before user interaction with a page. For this reason there is no audible confirmation that a Remove has been successful - just a toast message.

- Container weights: Added a section to the info side bar called Container Weights. This gives you a list of all containers currently in use, and the running total of weights in them. This is helpful as a quick reference in the warehouse to see if a crate has been overloaded, or to allow a tech to write the case weight on the road label. Note: In order for the weight of the case/container to be included it needs to be scanned onto the job. For example, if the container is 99008 (one of our laptop cases) the asset 99009 needs to be prepared on the job for the self weight of the that case to be included in the total. Adhoc containers can be used, but there is no way to give an adhoc container a weight value, so the figure given is for the contents only.

- Added time stamps to “toast messages” generated when scanning in Detail View. This makes it easier to identify when errors occurred if you return to a screen full of red messages.

- If an item is scanned that requires an inspection, a verbal message follows the success “ping” to let you know this, and tells you the asset number that needs testing. Previously you wouldn’t know about the missing inspection unless you were looking at the screen whilst scanning. Note: This is most relevant where the inspection is not set as Mandatory, which is our workflow. You can now choose the level of alert given in regards to overdue inspections. Full = voice prompt. Short = An additional BOOP sound to give you a clue. Off = No audible warning given (but you still get a visual toast message).

- If a temporary container is scanned that has already been allocated/prepared a verbal message follows the error buzzer to say “Container already allocated”. Previously you’d just hear a generic error buzz.

- If an item is scanned that has already been allocated/prepared a verbal message follows the error buzzer to say “Already scanned”. Previously you’d just hear a generic error buzz and would have to look up to work see why.

- When using “check shortages” the returned list is now reformatted to be easier to read. Additionally, where an overdue inspection is flagged the name of the product is added after the asset number to make identification easier. Note: This function only works when “Check Shortages” is clicked on from Detail View.

- Override the CSS position properties of “toast container” to allow the alerts to be scrolled when they overflow the screen. This is particularly helpful when using “Check shortages” since a long list is generated that would previously flow off the screen and be unreadable (and unlike individual scan errors it’s just one big box, so you can’t dismiss the top ones to bring the other messages into view).

- View options: Added tab buttons in Detail View to allow the user to hide Prepared items, hide Booked Out items, hide Checked In items, hide Sub Rentals, and hide everything except Bulk/Non Stock Items. These hide the rows without effecting the display/sort order. When hiding Prepared, Booked Out or Checked In items, the parent item of an accessory will not be hidden until all its children match the given status.

- Container Scanning: You can now set, and clear, the value of the Allocate Container Field via scanning. This feature works as follows:
To set an asset as the Container value: User scans the "*container*"" barcode. User is then prompted to “scan container”. The next scan of an asset will attempt to set that asset as the container, with the following logic:
1. If the container asset is not currently allocated to the opportunity, the asset will be parsed as a free scanned item. If its allocation is successful, the Container field is set to that asset number.
2. If 1, but the asset fails to be allocated, the Container field is cleared.
3. If the asset scanned is already allocated on the opportunity, the Container field will be set to that asset number.
To cancel this operation, scanning the "*container*" barcode a second time will clear the Container field and return to normal scanning. You can also use this method to clear the Container field (double scan the barcode).

Once a container exists on the opportunity it can be accessed without further use of the container barcode. To do this, simply scan that container’s barcode. The system will report “Container set”, and the scan will not be parsed further (you won’t hear an “already scanned” fail). Scanning the container asset’s barcode again, whilst it is set in the Container field, will clear the Container field. This is similar behaviour to other hire management software; “opening” and “closing” containers.

- The extension uses a different scan sound when you are allocating an asset and it's going into a container (ie. there's a value set in the Container box).

- Bulk Quantity Barcodes: The system will now accept bulk barcodes with a quantity value. To use this feature, create a barcode preceeded with the require quanity value surrounded in % symbols. For example, for a barcode that adds 5x of product 90210 the barcode would be "*%5%90210*"

- Product Inspector (requires API): In detail view you will now see a magnifying glass symbol next to each rental item from your own stock. Clicking on this will bring up a modal image of the product, and also list all locations for that product in the Store (ie. there could be more than one). The item weight is also listed. This information, in combination, should assist warehouse techs in correctly identifying equipment they are unfamiliar with. The information provided is already available within CurrentRMS, but requires clicking away from the scanning page.

- Item description notes shown in Detail View.

- Block Quarantined Allocations: There is now a user setting within the pop (on by default) that will prevent items listed in quarantine from being scanned onto a job. If this setting is false quarantined items can be scanned on as normal, but a toast message and verbal warning will alert the user. Block Quarantine Toast Messages now include a link to go to the quarantine record. Quaratine status is refreshed every 30 minutes.

- Auto Book Out Nested Containers - This setting is OFF by default, so you'll want to enable it in the settings popup. When enabled, if you you scan a container to book it out and nested containers (and therefore their contents) will also be booked out automatically. Only containers with the status "Prepared" will be auto-booked out (this is to avoid accidentally changing a forgotten "Reserved" item into "Booked Out", but be aware that this can still happen(!) because CurrentRMS will just book out the first level contents of a container regardless of its status, and I can't currently block this insane behaviour).

- The Attributes panel on the right shows the weight of equipment on the opportunity. Now, when you book items out a new field of "Booked Out Weight" is shown. Useful when loading multiple vehicles.

- Option to disable the controversial "Delete from Detail View" feature recently added to CurrentRMS. Active by default.

- Scroll Memory - In Detail View, page reload actions (such as reverting an item) mean you lose your place in the list, which can be very disorientating. This 'Scroll Memory' feature will now log your scroll position any time you click anywhere on the page, and try to return you to that position after the reload. It will also return extension view filters (yellow buttons) to their previous state (as this has an impact on the scroll position). Known limitation: The in-built filters (accessed via the funnel button under the Functions tab are not currently remembered, so if you use those you might not return to where you expect. I'll try to work this in when I can).

- Sub-Hire Weight - If an opportunity includes sub-hires, the seperate weights of stock and sub-hired kit are shown under the normal weight value.

## Serialised Containers

- When scanning assets into a container you will receive a verbal warning when trying to scan in an item that already is, or already is in, a container.

- Container View Check-in - Previously, we were frustrated by the fact that getting items back into temporary containers was a two step process: First scan the items in, then scan them into a temporary container. This new feature makes it a one step process. To use this, create a temporary container as normal. Once all items are scanned in, press the yellow "Global Check-in" button. The process should take a few seconds, after which any item that was sucessfully checked in will gain a green tick next to it (including the container asset number at the top). Items without a green tick were not checked in, so if you beleive they should have been this should be investigated before moving on (and if it was a legit error please let me know!). Bulk items are ignored, so you need to put them in a temp container these will need to be checked in elsewhere as normal. Note: The auto Global Check-in will apply to all opportunities the item is booked out to.

- You can now scan the container you're currently working on to take you back to the containers list.


## Order View

- Availability Data: To the right of the status block you will now see a number, which represents the remaining stock available. If it's a green, positive number that is how many you have left available for the dates of this opportunity. If a red negative it's the number you're short.

- Profit Warning: In order view, the total price of a line will highlight in red if the total cost for that line is greater than the amount being charged (ie. It’s making a loss). The pop-up/tool tip that contains charge information for each line total now also features cost and profit/loss figures, and items that didn’t previously have pop-ups (like sales items) now have a tooltip for this purpose. The feature also works for group items where a group deal price has been set and the total combined cost of items inside the deal are greater than the group deal price. This feature involves an opportunity based API call, so you may notice they take a second or two to appear after a page refresh.

- Services are now highlighted in yellow when some or all of the services are unallocated. The line will still highlight in red as normal if there is a shortage. When allocations are made, a list below the item tells you what/who has been allocated. Clicking on the name listed will open a new tab showing information about that resource.

- In Order View, when "Use Chargable Days" is on, a value will now be entered for Service items. If rate type is set to Hours, the value will be stated as **"8H"**. If rate type is set to Distance in Miles the value will be stated as **"8mi"**, or in Kilometres the value will be stated as **"8km"**.

- The OrderView Quick Picker now allows user input across multiple pages.

- The Product/Service picker inputs now have a minimum of 0, so you can't accidentally over-click into a negative number.

- Items that have a Warehouse Note set now have an icon next to them. Mouse over the icon to see the warehouse note in a tooltip.

- You can now click on the opportunity grand total at the bottom of the page to jump to the Deal Price screen more intuitively.


## Costs View

- Overridden CSS for the Costs view page to prevent the quantity column from vanishing(!)

- Groups now show their total cost. This is particularly useful when sorted by Resource prior to creating a PO.

- Service items now show their cost duration in the days column. A tool-tip over this value reveals days charged and days costed. If there is a mismatch between the 'days' costed and 'days' charged the entry is shown as [daysCosted/daysCharged], and the text turns red to draw attention to the issue. If the charge type doesn't match the cost type (eg. charging per day, but costed by hour) the value is highlighted in amber.

- Add To Existing Purchase Order - The modal box that appears now offers a list of active POs from the supplier of the selected item. Previously you had to guess / look up the correct PO.


## Edit Opportunity
- The Edit Opportunity Scheduling section now has a button to clear all dates for the detailed schedule boxes. You still need to Update Order to apply any changes.


## Add Opportunity Item
- When adding an item to an opportunity, if you start typing in a text item, and then realise you haven't clicked the "Text Item" radio button, doing so will no longer erase the text you just typed.


## Global Check-in
- Added an option to override the dialog box that pops up if you use Global Check-in on an item that is booked out on multiple opportunities. Previously, this box requires interaction which means going back to the computer and disrupts scanning. In practice, it's rare that you would not want to check in the item from all possible opportunities - because that's the whole point of global check in.


## Global Search
- Global Search results now include an "Inactive Opportunities" section (whereas the standard global search will only find active ones).

- If you global search for an asset number (for example, if you scan an asset into the top global search field) you now jump straight to the asset's page (rather than ending up in the global search results page and then having to click on the one asset found). Requires API.


## Stock Check
- Stock check sounds are now handled by the extension (previously the alert sound was going off for everything).


## Product View
- Products Pages now list the quantity booked against each opportunity in the list.

## Opportunities List
- Clicking the order Avatar (the circular icon to the left hand side) is now a shortcut to take you directly to Detail View for that opportunity.
