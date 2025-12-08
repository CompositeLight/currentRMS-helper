# currentRMS-helper 2.0.14
This is a Chrome extension to add functionality to the CurrentRMS web interface. It was created out of our frustration waiting on "quality of life" modifications to make the user experience better. Since making it available online, I've been blown away by how many users and businesses have started using it on a daily basis. I'm really grateful to the many users who have contributed ideas, or pointed out bugs with the extension.

The extension is free to all, but as a few people have asked, if you really want to [buy me a cup of coffee / tea / beer](https://paypal.me/garethrisdale) you can use this link.

**DISCLAIMER: This extension is a personal side project, written by me. I am not a professional programmer. Use entirely at your own risk. This code is in no way affiliated with InspHire Ltd, or any of my employers.**


## Compatibility

Aside from the Chrome Desktop Browser, users have successfully used this extension in Opera, and Android via Kiwi. In theory, any Chromium based browser should work.


## Installation
1. Copy the "CRMS Extension" folder onto your desktop computer.
2. Open Google Chrome.
3. Go to Settings -> Extensions
4. Click "Load Unpacked"
5. Select the "CRMS Extension" folder location.
6. Turn on the extension.
7. Ensure the default / built-in sound scheme is turned off to avoid duplicate sounds.
8. To use API based features (recommended), go to the CurrentRMS System Setup page and navigate to Integrations > API.
9. Enable the API and create a new API key.
10. Paste the API key into the CurrentRMS Helper pop-up field (this key is stored locally on your system, so should only need to be entered once).

> [!CAUTION]
> As stated by CurrentRMS: "API Keys give read and write access to your Current RMS System. You should keep your keys safe just as you do your username and password - only use them with software and services that you trust. Give each key a unique name so you can clearly identify who you have issued the key to."
>
>THEREFORE: Do not enter your API key unless you have authority to do so. API key information is stored using chrome.storage.local. Though it isn't sent anywhere outside of your system (beyond making API calls), it is not encrypted, and is only as safe as your system.


## Features and improvements

For a full list of the extension's features, check out the [Features.md](/Features.md).


## New Featur
- NEW: 2.0.14 - Added a Functions menu option, “Transfer out”, to send selected assets to another opportunity via the built-in quick_allocate endpoint (no API key needed).
- FIXED: 2.0.13 - Warehouse notes editing was broken (issue 134).

- FIXED: 2.0.13 - Editing chargable days of Service items was broken.

- FIXED: 2.0.12 - The Shorts Only button in Order View was broken (issue 132).

- CHANGED: 2.0.12 - Some previous CSS overrides have been removed as the vanilla CSS has changed and it was making it look messy(toast messages).

- NEW: 2.0.12 - Added special barcodes of "allocate" and "bookout". These will change the current scanning mode.

- NEW: 2.0.12 - Activities listed in Order View now have a tick button next to them to complete the activity straight from that page, rather than clicking through two further pages (!).

- NEW: 2.0.12 - In Order View there is a now a Check Accessories option under Actions in the sidebar. This brings up a list of potential accessory issues by comparing items and accessories on the opportunity against how they're arranged on the product itself. Potentially useful after cloning an old job (until I can finish the new clone tool).


- NEW: 2.0.11 - The Project pages now have an added stat box for "Draft / Quote / Order Total", that show the grand total charge of all opportunities listed on the opportunity (issue 126). The box will only appear if there is an opportunity listed that isn't an Order.

- IMPROVED: 2.0.11 - Better handling for users who aren't able to enter an API key.

- IMPROVED: 2.0.11 - Availability numbers are now underlined if there's a quarantine tooltip available.

- FIXED: 2.0.11 - Availability number quarantine tooltips were misreading quarantine types.

- FIXED: 2.0.10 - In Detail View, when adding services via the picker editable days would not work until the page was refreshed (issue 100 redux).

- NEW: 2.0.10 - In Detail View, where an availability number is showing a shortage and the product has assets in quarantine, you can mouse over the negative number to see a tool tip that lists the quarantine counts/types (issue 117).

- IMPROVED: 2.0.10 - In Detail View, the yellow button filters will now remain on if the page reloads, or if you return to that opportunity's detail view without navigating to a different one (issue 118). 

- FIXED: 2.0.9 - Since a Chrome update, the voice prompts have been randomly breaking for some users. I've re-coded how the voice is generated, which should now be more reliable.

- FIXED: 2.0.9 - A bug where quarantined assets could sometimes be allocated if the inbuilt auto-complete added text to the scan box.

- NEW: 2.0.9 - Global Search Asset Shortcut will now only trigger if there is a single matching search result (the item). This is to prevent unexpected triggering when the opporunity ID happens to clash with an item ID.

- NEW: 2.0.8 - Added a side bar section to show version info, with links to the github issues page.

- FIXED: 2.0.8 - Nested charges were showing incorrectly if a Sale item has accessories (issue 119).

- FIXED: 2.0.7 - Cost View editable chargable days / miles / hours were hidden in some circumstances (issue 100).

- FIXED: 2.0.7 - Coin symbols had vanished from various menues (Issue 116).

- FIXED: 2.0.6 - Avilability data wasn't showing for products that have a symbol in their name, such as MacBook Pro 16".

- FIXED: 2.0.5 - Sub-rent weights were ignoring Text Items. Sales items were not being accounted for under Stock Weight.

- FIXED: 2.0.4 - Sub-rent weights were showing crazy floating point decimals.

- NEW: 2.0.3 - Show Collapsed Item Totals - In Order View, when an item has accessories but the item is in a collapsed state (accessories are hidden) the total now reflects the item charge plus any charges for accessories inside it. Mousing over this total reveals the item's individual charge. Clicking on it expands the acessories below. This feature can be disabled in the extension settings panel.

- FIXED: 2.0.3 - The product images in the Detail View pop-ups were often broken since the security update. The links are now refreshed as soon as you click the magnifying glass. They take a split second to load, but will at least appear reliably.

- IMPROVED: 2.0.3 - Scraping of availability and warehouse notes data is now slightly faster (still limited by how quickly the data arrives from CurrentRMS).

- IMPROVED: 2.0.3 - The locally stored data for stock and products is now automatically updated in the background every hour.

- FIXED: 2.0.2 - More bugs around editing descriptions in Detail View, including group description issues.

- IMPROVED: 2.0.2 - Warehouse notes edit now uses a dialog modal styled like the normal Current-RMS ones.

- FIXED: 2.0.1 - Fixed a bug causing updated service durations to spin forever. 

- FIXED: 2.0.1 - Fixed a bug causing errant row count warnings.

- FIXED: 2.0.1 - Fixed orange highlights still showing in cost view.

- MAJOR CHANGE: 2.0.0 - In Order View, the way in which opportunity data is loaded has substantially changed. The opportunity_items object is now stored in chrome.local.storage, and the API call is only to retrieve updated items after the first load. On big jobs especially, this massively improves load time / performance as less API data is required. In order that local.storage doesn't become too massive, any opportunities not looked at for more than a week will be deleted, meaning that if you go back to them the first reload will require a full API run. In theory you won't really notice any difference (except it'll be faster), but please report any issues that appear... If for any reason your opportunity API data gets out of whack 1) Let me know by creating an issue, 2) Go to the edit opportunity page where you'll find a new yellow button to purge the locally held data for that opportunity.

- NEW 2.0.0 - Description Magic - In Order View you can now add a description to an item or group by using the drop down (blue arrow to the right) menu. You can also remove a description by deleting the contents and clicking away (issue 54).

- NEW 2.0.0 - Warehouse Notes Magic - In Order View you can also now add or edit a Warehouse Note by using the drop down (blue arrow to the right) menu. To quickly edit a Warehouse Note you can also just click on the clipboard T icon next to an item (you can still mouse over that icon to see a quick popup of the note).

- NEW: 2.0.0 - In Order View, you can now edit chargable days / miles / hours by clicking on them as you would a rental product (so no need to edit the item to adjust it). NOTE: Changing the chargable days in this way has no effect on the days costed, so you'll still need to go and adjust this if it effects your profit calculations etc (issue 100). This however, will be a bit easier than it used to be because...

- NEW: 2.0.0 - In Cost View, you can also now edit chargable days / miles / hours by clicking on them as you would a rental product. You can also change whether a service item is costed by Days/Hours/Distance/Flat-Rate directly from the Costs page, so you don't need to navigate to the opportunity item edit page so much.

- NEW: 2.0.0 - Sub-Rent weight is now also shown in Order View under the Attributes panel of the side bar (issue 75). As well as giving an overally break-down of stock weight vs sub-rent weight, the weight associated with each supplier is given beneath. Clicking the supplier name takes you to their member page.

- NEW 2.0.0 - In Order View, items that include sub-rents are highlighted in blue if any of the sub-rented allocations don't yet have a supplier set. This is to make it harder to miss a sub-hire you haven't sorted out (issue 96 AKA The Extra Chain Motors Incident).

- IMPROVED 2.0.0 - Not On The Job - When you scan an item that isn't on the opportunity, the voice prompt listing the incorrect asset number can be annoying because it sometimes takes a long time to say... New behaviour is that the first scan will only prompt "Not on the job". Subsequent scans will read out the full asset number as before.

IMPROVED 2.0.0 - Sticky Helper Buttons - The yellow buttons in Order and Detail View now stick to the top of the page again, but leave enough space for the normal green buttons (issue 79).

- CHANGED 2.0.0 - I've disabled the 'new' in built feature that makes rows orange if they are break-even or loss making. I've been reluctant to do it, but in the end have concluded that a) it's a duplication of the extension's method of highlighting loss making rows, b) it's a poorer implementation of the feature because break-even is typically ok for most people, c) it clashes with other row highlights such as the in-built red rows for shortages, and the extension's yellow rows for unallocated service items. If anyone out there really loves the orange rows for some reason and wants them back, raise an issue and I'll have a look at it (I could add it back as an optional thing in the settings panel). 

- FIXED 2.0.0 - API Rate Limiting warnings were firing inappropriately (issue 106).



------------

- FIXED: 1.31.30 - In Detail View, item descriptions were hidden when the window was narrower than 768px. Have also increased the column span of these elements for better viewing in narrower windows.

- FIXED: 1.31.29 - Where a Deal Price was set on a group the profit/loss tool stip was not calculating correctly (issue 97).

- FIXED: 1.31.28 - Listing of allocation details in Order View now works when the item is within a deal (issue 104).

- IMPROVED / FIXED: 1.31.27 - At some point a few versions ago I was trying something and accidently caused a MASSIVE slow down of Detail View loading - primarily noticable on larger jobs. This should now be fixed. orderView is now also improved for larger jobs - time to execute the extension's code should be massively reduced. This has been achieved by making simultaneous API calls, rather than consecutive ones. This could cause issues in terms of rate limiting... So if this happens to you please let me know by raising an issue! If you're reading this you ARE the beta tester - thanks!

- FIXED: 1.31.27 - Hopefully fixed a bug where some Order View toast messages lost their formatting.

- NEW: 1.31.27 - Control popup now reacts to the system setting for Light/Dark mode.

- NEW: 1.31.27 - Required fields. When creating or editing an opportunity you're now blocked from submitting if the value of any 'List of Values' input is set to a value that starts with "Required" (case insensitive). So for your Custom Fields, you can set the Default value to "Required" (or "required", "Required!!!!!!", "Required please" etc, doesn't matter so long as the first 8 characters are 'required'). On submission attempt the input is highlighted in red, and the page will scroll to view it to make it clear to the user what the issue is.


- NEW: 1.31.26 - Serialised Container View now lists the weight of the container, its contents and the total weight in the Attibutes side bar section.

- REMOVED: 1.31.25 - The auto-scroll feature when refreshing a page has now been adopted by CurrentRMS(!). Removing this code as it was now fighting with the built in positioning.

- FIXED: 1.31.24 - The entries in Recent previously added the text content of "badges" like "Customer Collecting"

- FIXED: 1.31.23 - In Detail View, Tick box functions were broken by attempts to manipulate the page layout. This has now been rolled back, but means that the yellow buttons now get hidden by the vanilla function tabs, which is not what I intended... The way the GUI gets resized by JQuery, rather than CSS, is proving very difficult to manipulate.

- NEW: 1.31.23 - In Detail View, double clicking on a function tab (Function, Allocate, Prepate, Book out, Check-in) now scrolls the page to the top.

- FIXED: 1.31.23 - Part Checked In items are no longer hidden by the "Checked In" filter.


- NEW: 1.31.22 - Re-worked CSS for the Details Page to better handle the yellow buttons on various screen sizes. The menu top bar items have also been shortened slighting (Dashboard -> Dash, Organisations -> Orgs) to prevent that top bar from going to two lines on small screens.

- IMPROVED: 1.31.22 - Global Search Asset Shortcut has been re-written for better performance with large stock lists.

- NEW/IMPROVED: 1.31.21 - Serialised Containers - Various improvements: Better feedback on incorrect scans. ErrorTimeouts (disappearing error messages) should now work. You can now scan the container you're currently working on to take you back to the containers list.

- IMPROVED: 1.31.21 - The special barcodes "container", "revert" and "remove" now work from the Book Out panel of Detail View.

- NEW: 1.31.20 - Cost View - Add To Existing Purchase Order - The modal box that appears now offers a list of active POs from the supplier of the selected item. Previously you had to guess / look up the correct PO.

- NEW: 1.31.19 - Container View Check-in - Previously, we were frustrated by the fact that getting items back into temporary containers was a two step process: First scan the items in, then scan them into a temporary container. This new feature makes it a one step process. To use this, create a temporary container as normal. Once all items are scanned in, press the yellow "Global Check-in" button. The process should take a few seconds, after which any item that was sucessfully checked in will gain a green tick next to it (including the container asset number at the top). Items without a green tick were not checked in, so if you beleive they should have been this should be investigated before moving on (and if it was a legit error please let me know!). Bulk items are ignored, so you need to put them in a temp container these will need to be checked in elsewhere as normal. Note: The auto Global Check-in will apply to all opportunities the item is booked out to.

- NEW: 1.31.19 - Global Search Asset Shortcut - If you global search for an asset number (for example, if you scan an asset into the top global search field) you now jump straight to the asset's page (rather than ending up in the global search results page and then having to click on the one asset found). This also provides a cleaner way to get an item to quarantine. Requires API.

- NEW: 1.31.19 - Detail View Sub-Hire Weight: If an opportunity includes sub-hires, the seperate weights of stock and sub-hired kit are shown under the normal weight value.

- FIXED: 1.31.19 - In Detail View, rounding errors when calculating weights were creating crazy decimals.

- IMPROVED: 1.31.19 - The Scroll Memory function now fires before the API calls, so there's now less/no delay before the scroll.

----

- FIXED: 1.31.18 - View filters in Detail View (yellow buttons) were broken by my haste and incompetence. Hopefully working properly again now.

- NEW: 1.31.17 - Detail View Scroll Memory - In Detail View, page reload actions (such as reverting an item) mean you lose your place in the list, which can be very disorientating. This 'Scroll Memory' feature will now log your scroll position any time you click anywhere on the page, and try to return you to that position after the reload. It will also return extension view filters (yellow buttons) to their previous state (as this has an impact on the scroll position). Known limitation: The in-built filters (accessed via the funnel button under the Functions tab are not currently remembered, so if you use those you might not return to where you expect. I'll try to work this in when I can).

- FIXED: 1.31.17 - Using the view filters in Detail View (yellow buttons) could cause the down down menues at the end of lines to not function properly.

- NEW: 1.31.16 - Recent Tab: The top menu bar now features a "Recent" menu item. This offers quick links to the last 10 opportunities you looked at, in the order than you looked at them. I'm hoping to add Favourites in the future, but this was actually easier to do. When you're generally bouncing between the same few jobs on any given day, this should be a lot faster than going via the Opportunities list.

- NEW: 1.31.16 - In Order View, you can now click on the opportunity grand total at the bottom of the page to jump to the Deal Price screen more intuitively.

- NEW: 1.31.16 - In Order View, the Product/Service picker inputs now have a minimum of 0, so you can't accidentally over-click into a negative number.

- NEW: 1.31.15 - In the Opportunities, Products, Services and Purchase Order pages you can now change view settings without losing the current search term entered. This works when recalling saved views, or the Default, or when changing the Per Page setting. This doesn't work for Filter Selection - sadly that's a bit more complicated.

- NEW: 1.31.14 - Added additional filter buttons in Detail View for Hide Booked Out and Hide Checked In.

- NEW: 1.31.14 - Added an option to disable the controversial "Delete from Detail View" feature recently added to CurrentRMS. Active by default.

- FIXED: 1.31.14 - In Detail View, the "Mark as Prepared" was in conflict with the new in built setting. You can now use them side by side.

- NEW: 1.31.13 - In Order View, items that have a Warehouse Note set now have an icon next to them. Mouse over the icon to see the warehouse note in a tooltip.

- FIXED: 1.31.13 - Total weight calculation was sometimes showing incorrectly.

- FIXED: 1.31.12 - Fixed an issue where quarantine blocking was always on.

- NEW: 1.31.12 - In Detail View, the Attributes panel on the right shows the weight of equipment on the opportunity. Now, when you book items out a new field of "Booked Out Weight" is shown. Useful when loading multiple vehicles.

- IMPROVED: 1.31.12 - Improved how the extension behaves if API details have not been entered. If anyone is still seeing error generated please raise them as an issue.

- FIXED: 1.31.11 - Fixed an issue that could cause the extension sounds to stop working.

- NEW: 1.31.10 - Auto Book Out Nested Containers - This setting is OFF by default, so you'll want to enable it in the settings popup. When enabled, if you you scan a container to book it out and nested containers (and therefore their contents) will also be booked out automatically. Only containers with the status "Prepared" will be auto-booked out (this is to avoid accidentally changing a forgotten "Reserved" item into "Booked Out", but be aware that this can still happen(!) because CurrentRMS will just book out the first level contents of a container regardless of its status, and I can't currently block this insane behaviour).

- FIXED: 1.31.10 - Book out scans producing the wrong sound.

- FIXED: 1.31.10 - Behaviour when scanning an existing container was broken in 1.31.9.

- FIXED: 1.31.10 - The Inspect Now buttons on test warnings have become clipped since Current added the timestamp feature. CSS now adjusted so they look right again.

- IMPROVED 1.31.9: Error timeout function now does not effect inspection overdue warnings, so you can use the Inspect Now button. Open to feedback on this behaviour...

- IMPROVED 1.31.9: The Container Weights sidebar section has been rewritten to implement several fixes and suggestions. It now accounts for the weight of all items and nested containers (previously the contents of nested containers were ignored), and shows the weight of each sub-container beneath. This should make it easier to use nested containers for multi-van planning. Containers are now listed in alphabetical/numberical order (previously the display order was arbitary). A "Loose items" listing has been added to the bottom to indicate the remaining job weight not assigned to any container. NOTE: CurrentRMS allows circular containerisation. That is to say: Item A can be stored inside Item B, which is stored inside Item A, which as I said earlier is stored inside Item B... I consider this to be a bug, and it causes chaos when you try to calculate the combined weight of nested containers. My solution to this is that if you do create a circular container scenario, a warning will alert you to the error, and red text in the Container Weights panel will suggest where the problem is. No weight is given for the impossible container until you fix the issue. I cannot think of any real world scenario or work flow where you would actually nest a container inside of itself; if you can please let me know!

- NEW 1.31.9: Opportunities List: Clicking the order Avatar (the circular icon to the left hand side) is now a shortcut to take you directly to Detail View for that opportunity.

- IMPROVED 1.31.8: Added a "seconds" label to the error timeout box and added timeout to "You must select an asset" messages.

- NEW: 1.31.7: The OrderView Quick Picker now allows user input across multiple pages.

- NEW: 1.31.7: The settings popup now includes a setting to automatically dismiss error messages after a given number of seconds. Setting the value to 0 will cause default behaviour (ie. error messages will remain until clicked on). This is primarily aimed at those using scanners with integrated screens.

- IMPROVED: 1.31.7: Re-wrote some lines handling Toast Messages to be more error resistant.

- NEW: 1.31.6: When adding an item to an opportunity, if you start typing in a text item, and then realise you haven't clicked the "Text Item" radio button, doing so will no longer erase the text you just typed.

- IMPROVED: 1.31.5: The CurrentRMS Helper settings pop-up now has a toggle for sounds.

- IMPROVED: 1.31.5: Added the Lost identifier to Global Search Inactive Opportunities section.

- FIXED: 1.31.4: In Detail View, the Select All checkbox now respects any currentRMS-helper filters applied.

- NEW: 1.31.4: Global search will now has an extra section called "Inactive Opportunities" (whereas the standard global search will only find active ones).

- NEW: 1.31.3: Edit Opportunity Scheduling section now has a button to clear all dates for the detailed schedule boxes. You still need to Update Order to apply any changes.

- IMPROVED: 1.31.3: The new service allocation details now only list allocated entries, rather than listing out the missing ones. Is also less glitchy when refreshing after an edit.

- NEW: 1.31.2: In Order View, services are now highlighted in yellow when some or all of the services are unallocated. The line will still highlight in red as normal if there is a shortage. When allocations are made, a list below the item tells you what/who has been allocated. Clicking on the name listed will open a new tab showing information about that resource. Known limitation: Sub-contract bookings don't list the supplier name currently, because the API does not provide this information at the item_asset level; just the number for some reason. If this irritates enough people I'll work around this in a future update.

- FIX: 1.31.2: Removed the constant repetition of "API information loaded" toast message whilst scanning. If annoying stuff like this happens please do let me know in the Issues section so I can fix it! I don't get to scan much in the warehouse at the moment, so I'm reliant on user feedback for things like this.

- NEW/FIX 1.31.1: Quick update to remove the time-stamp in front of messages where the system now adds them by default (this was leading to double times and incorrect sounds). Very busy with other things at the moment, but hoping to push some more development soon...

- NEW: 1.31.0: Products Pages now list the quantity booked against each opportunity in the list.

- FIXED: 1.30.32: Product locations listed via the magnifying glass pop-up now filter out duplicate entries.

- IMPROVED: 1.30.31: Detail View: Shortages Only button now make lines with shortages visible where they would previously be hidden by collapsed items.

- IMPROVED: 1.30.30: Order View: Shortages Only button now makes lines with shortages visible without expanding the entire opportunity heirachy.

- FIXED: 1.30.29: Order View: Shortages Only button now forces the whole list to expand to ensure that no short item lines are hidden.

- NEW: 1.30.28: Order View: Added a button to show Shortages only.

- FIXED: 1.30.27: Detail View: Shortages Only / Bulk Only and Hide Non-Subs views broke the item drop down menus.

- NEW: 1.30.26: Detail View: Added a button to show Shortages only.

- NEW: 1.30.25: Detail View: Added a button to show Sub-Rents Only.

- IMPROVED: 1.30.25: Detail View: Tidied up the view created by the Bulk Only feature.

- FIXED: 1.30.24: In some situations the addDetails function and/or availability scrape could stack up (where a change is made before the servers have responded). Repeat calls are now blocked until a these functions have completed / returned.

- IMPROVED: 1.30.23: Group Totals in Cost View are now formatted appropriately for the currency to make them easier to read.

- FIXED: 1.30.23: Manual Cost items added up wrong if the value was above 999 in Costs View.

- FIXED: 1.30.23: Service Items would sometimes show multiple Days values in Costs View.

- FIXED: 1.30.22: New Order view GUI was half baked.

- IMPROVED: 1.30.21: The Avail column in Order View is now positioned to the right of Quantity (this is a more natural position for experienced users of the stock GUI).

- FIXED: 1.30.20: Cost view days data now handles Manual Cost Items appropriately.

- FIXED: 1.30.20: Cost view data refreshes when items are edited.

- NEW: 1.30.19: Cost View: Service items now show their cost duration in the days column. A tool-tip over this value reveals days charged and days costed. If there is a mismatch between the 'days' costed and 'days' charged the entry is shown as [daysCosted/daysCharged], and the text turns red to draw attention to the issue. If the charge type doesn't match the cost type (eg. charging per day, but costed by hour) the value is highlighted in amber.

- NEW: 1.30.19: Cost View: Groups now show their total cost. This is particularly useful when sorted by Resource prior to creating a PO.

- NEW: 1.30.19: Overridden CSS for the Costs view page to prevent the quantity column from vanishing(!)

- NEW: 1.30.19: Remove By Scan: Much requested by warehouses that go straight to Prepared, this works the same as the *revert* scan (which is still in place), but instead of reverting by one step the asset will be completely removed, regardless of it's status. BE AWARE: This even works for items that have been Booked Out, so use wisely. Due to the auto-play limitations of Chrome, it is not possible to play a sound before user interaction with a page. For this reason there is no audible confirmation that a Remove has been successful - just a toast message.

- IMPROVED: 1.30.19: The Detail View "hide" buttons are now laid out on their own row in the GUI to prevent conflict with the standard tab buttons.

- FIXED: 1.30.19: Cost Tooltips for Sales items now appear to the left, so as to not be clipped off if the item is at the very top of the list.

- FIXED: 1.30.19: The side-bar containers list was including the magnifying glass emoji at the end of container names.

- IMPROVED: 1.30.18: Availability counts now reflect your system setting for Availability Period, up to 1/4 day.

- FIXED: 1.30.18: Availability counts weren't showing if the item had a description listed.

- FIXED: 1.30.17: AddDetails function in Detail View causing duplicate descriptions.

- FIXED: 1.30.16: AddDetails function in Detail View causing multiple magnifying glasses.

- FIXED: 1.30.16: AddDetails magnifying glasses would disappear if the item was allocated or prepared, requiring a page reload.

- TESTING: 1.30.15: Using a new method to retrieve data from CurrentRMS... For this first test I've added availability data to the Order View. To the right of the status block you will now see a number, which represents the remaining stock available. If it's a green, positive number that is how many you have left available for the dates of this opportunity. If a red negative it's the number you're short.

- FIXED: 1.30.14: Fixed container scan handling errors caused by unexpected time string formats.

- FIXED: 1.30.13: Fixed a bug where quarantine information wasn't being requested after first install.

- ADDED: 1.30.12: Added support for barcode scanners that always convert text to upper-case (was messing up special scans).

- ADDED: 1.30.11: Allocate by Default: New setting in the pop-up for jumping straight to Allocate tab, rather than landing in Functions tab of the Detail View. Default is true/on. Might circle back to make this jump to check-in instead depending on the state of the opportunity.

- ADDED: 1.30.11: Revert By Scan: Added a new special barcode: "*revert*". Scanning this will prompt the user to scan an item. The extension will then tick the box of that item, untick any other boxes, and press the "Revert Status" button in the Action menu. It also dismisses the confirmation dialog that would normally appear. You can abort a "revert scan" by scanning *revert* a second time. Currently you can still only revert by one level at a time, so to get from PREPARED to RESERVED is two revert operations.

- ADDED: 1.30.11: There is now a variable right at the top of the content.js script called "muteExtensionSounds", which is set to false. If you need to some reason to turn off the extension sounds you can change the word false to true in this file. Might add it as a toggle in the settings pop-up later on, but for now it's at least quicker to change than commenting out the various lines.

- FIXED: 1.30.10: Fixed an issue that would cause the extension to crash if the product API call and quarantine API call are made at the same time (as happens automatically when a new system has the extension loaded for the first time!)

- IMPROVED: 1.30.9: Feedback has been that the API call for quarantine information is sometimes slow on a page reload and is in a queue behind the opportunity information. The result is that it's possible to scan an item before the API has reported it as in quarantine, so it gets through. To fix this, I've re-written this feature to be something that is checked every 30 minutes - unless triggered manually in the settings pop-up. Users should bear in mind that if an item is taken in or out of quarantine, this status change may not be reflected for up to 30 minutes. Hopefully in a real world scenario this should rarely cause an issue.

- IMPROVED: 1.30.8: Block Quarantine Toast Messages now include a link to go to the quarantine record.

- IMPROVED: 1.30.8: Quarantine API now filters out Sub Rental returns to reduce the size of the list / remove redundant entries.

- IMPROVED: 1.30.8: A toast message now appears to inform the user when the API data has loaded. Prior to this message appearing following a page reload some features (such as blocking quarantined items) may not function.

- NEW: 1.30.7: Block Quarantined Allocations: There is now a user setting within the pop (on by default) that will prevent items listed in quarantine from being scanned onto a job. If this setting is false quarantined items can be scanned on as normal, but a toast message and verbal warning will alert the user.

- NEW: 1.30.7: In Detail View, clicking on a toast message to close it will now send the input focus back to the appropriate scan box.

- NEW: 1.30.6: In Order View, when "Use Chargable Days" is on, a value will now be entered for Service items. If rate type is set to Hours, the value will be stated as **"8H"**. If rate type is set to Distance in Miles the value will be stated as **"8mi"**, or in Kilometres the value will be stated as **"8km"**.

- FIXED: 1.30.5: Profit Warning: In order view, the total price of a line will highlight in red if the total cost for that line is greater than the amount being charged (ie. It’s making a loss). The pop-up/tool tip that contains charge information for each line total now also features cost and profit/loss figures, and items that didn’t previously have pop-ups (like sales items) now have a tooltip for this purpose. The feature also works for group items where a group deal price has been set and the total combined cost of items inside the deal are greater than the group deal price. This feature involves an opportunity based API call, so you may notice they take a second or two to appear after a page refresh.

- FIXED: 1.30.4: Item description notes in Detail View now appear correctly for group items.

- NEW: 1.30.4: CSS override for Modal Headers so that they're "sticky". This means, on a very long Recent Actions modal for example, the close button never leaves the screen (which is unnecessary and irritating).

- IMPROVED: 1.30.3: API subdomain input field reformatted so it's clearer what's required. This confused basically everyone - sorry!

- FIXED: 1.30.3: Container side bar section was broken in 1.30.0. The expand/collapse stopped working, and the weights were not adding up correctly in some circumstances. Should now work as expected.

- NEW/BETA: 1.30.2: Item description notes shown in Detail View. Looking for feedback on how this operates and the way it is displayed.

- IMPROVED: 1.30.1: API errors now create alert pop-ups from the extension. FYI, the current API implementation works on the basis of saving a "snapshot" of the product and stock catalogues to local storage. This (somewhat extreme looking) setup is necessary for several reasons, but mostly it's because the API response time is pretty slow, and to add the functionality I'm seeking would require a LOT of API calls. One thing to watch out for is if you make any changes to your stock or product inventories they will not show up unless you "Force Refresh" the API data. In future I intend to add a check to see if the data needs to be refreshed.

- NEW: 1.30.0: API connection: There is now a field to enter an API key and subdomain into the CurrentRMS Helper. This unlocks new features, and paves the way for more in the future... See installation instructions above.

- NEW: 1.30.0: Product Inspector (requires API): In detail view you will now see a magnifying glass symbol next to each rental item from your own stock. Clicking on this will bring up a modal image of the product, and also list all locations for that product in the Store (ie. there could be more than one). The item weight is also listed. This information, in combination, should assist warehouse techs in correctly identifying equipment they are unfamiliar with. The information provided is already available within CurrentRMS, but requires clicking away from the scanning page.

- IMPROVED: 1.30.0: Container weights section now deals appropriately with the scenario that a container has been added to itself.

- CHANGED: 1.30.0: Pop up menu slightly reformatted and now includes version info.

- IMPROVED: 1.21.1: More Helpful Cursor: The snap-back-to-the-scan-input-box feature now takes note of which Detail View mode you're in, and resets the cursor into the appropriate box. For example, if you're in Check-In and click to expand the product tree, the cursor focus will snap back to the Check-In input box.

- NEW: 1.21.0: Bulk Quantity Barcodes: The system will now accept bulk barcodes with a quantity value. To use this feature, create a barcode preceeded with the require quanity value surrounded in % symbols. For example, for a barcode that adds 5x of product 90210 the barcode would be "*%5%90210*"

- IMPROVED: 1.20.2: Hypersonic: Scan and error sounds can now play over the top of each other, whereas before if you scanned while a sound was still playing the latter sound would be blocked.

- FIXED: 1.20.2: Fixed the broken successful scan sound while in Stock Check.

- IMPROVED: 1.20.1: Where a user's work flow involves adding a container to itself, the weights listed in the Containers side bar section now adjust accordingly to give an accurate total weight.

- IMPROVED: 1.20.1: Supersonic - Many sounds have now been made shorter, eg. the scan sound is now just under 1 second in duration (down from just under 2 seconds). The "container scan" sound has now been changed to be more noticeably different in tone.

- IMPROVED: 1.20.1: Stock check sounds are now handled by the extension (previously the alert sound was going off for everything).

- NEW: 1.20: Different scan sound when you are allocating an asset and it's going into a container (ie. there's a value set in the Container box). Should this be less subtle a difference?

- NEW: 1.20: Container Scanning: You can now set, and clear, the value of the Allocate Container Field via scanning. This feature works as follows:
To set an asset as the Container value: User scans the "*container*"" barcode. User is then prompted to “scan container”. The next scan of an asset will attempt to set that asset as the container, with the following logic:
1. If the container asset is not currently allocated to the opportunity, the asset will be parsed as a free scanned item. If its allocation is successful, the Container field is set to that asset number.
2. If 1, but the asset fails to be allocated, the Container field is cleared.
3. If the asset scanned is already allocated on the opportunity, the Container field will be set to that asset number.
To cancel this operation, scanning the "*container*" barcode a second time will clear the Container field and return to normal scanning. You can also use this method to clear the Container field (double scan the barcode).

Once a container exists on the opportunity it can be accessed without further use of the container barcode. To do this, simply scan that container’s barcode. The system will report “Container set”, and the scan will not be parsed further (you won’t hear an “already scanned” fail). Scanning the container asset’s barcode again, whilst it is set in the Container field, will clear the Container field. This is similar behaviour to other hire management software; “opening” and “closing” containers.

- FIXED: 1.19: There's a jQuery function to do with autocomplete on the Allocate input box, which was causing issues with 1.18. Specifically, when scanning the "freescan" barcode, sometimes the freescan value would persist in the input, which could mess up your next scan. I've used a somewhat nuclear option to resolve this, but it seems to work ok, and potentially unlocks container scanning activities.

- IMPROVED: 1.18: The "freescan" set by barcode now get picked up before it's sent to the CRMS servers. This means you no longer hear an error sound.

- IMPROVED: 1.18: Better handling of sounds in the Global Check In view.

- IMPROVED: 1.18: Fewer background errors due to the code checking which view type it's in.

- IMPROVED: 1.17: The container weights section can now be expanded/collapse. Thanks to Jed & the Stage Engage team!

- NEW: 1.16: Added an option to override the dialog box that pops up if you use Global Check-in on an item that is booked out on multiple opportunities. Previously, this box requires interaction which means going back to the computer and disrupts scanning. In practice, it's rare that you would not want to check in the item from all possible opportunities - because that's the whole point of global check in.

- NEW: 1.13: Settings popup added. Access this by clicking no the Extensions jigsaw icon in the top corner of Chrome, and then the CurrentRMS Helper rocket icon. You can pin this icon for easier access. The chosen settings are stored between sessions.

- NEW: 1.13: Mark As Prepared by Default. This is now an option you can set in the Settings popup. In our warehouse, we generally don't use the "allocate" stage, so it's preferable to have "mark as prepared" ticked by default.

- NEW: 1.13: As requested by Jed: You can now choose the level of alert given in regards to overdue inspections. Full = voice prompt. Short = An additional BOOP sound to give you a clue. Off = No audible warning given (but you still get a visual toast message).

- NEW: 1.13: Helpful Cursor: The cursor will now automatically jump back into the allocation/scan input box after certain actions. For example, expanding or collapsing the tree of items, or selecting one of the option sliders like Mark As Prepared or Free Scan.

- View options: Added tab buttons in Detail View to allow the user to hide Prepared items, hide Sub Rentals, and hide everything except Bulk/Non Stock Items. These hide the rows without effecting the display/sort order. When hiding Prepared Items, the parent item of an unprepared accessory will not be hidden until all its children are prepared.

- Added time stamps to “toast messages” generated when scanning in Detail View. This makes it easier to identify when errors occurred if you return to a screen full of red messages.

- Override the CSS position properties of “toast container” to allow the alerts to be scrolled when they overflow the screen. This is particularly helpful when using “Check shortages” since a long list is generated that would previously flow off the screen and be unreadable (and unlike individual scan errors it’s just one big box, so you can’t dismiss the top ones to bring the other messages into view).

- When using “check shortages” the returned list is now reformatted to be easier to read. Additionally, where an overdue inspection is flagged the name of the product is added after the asset number to make identification easier. Note: This function only works when “Check Shortages” is clicked on from Detail View. ~~The Inspect Now button has been removed because we would never use it.~~ (fixed in 1.11)

- If an item is scanned that has already been allocated/prepared a verbal message follows the error buzzer to say “Already scanned”. Previously you’d just hear a generic error buzz and would have to look up to work see why.

- If a temporary container is scanned that has already been allocated/prepared a verbal message follows the error buzzer to say “Container already allocated”. Previously you’d just hear a generic error buzz.

- If an item is scanned that requires an inspection, a verbal message follows the success “ping” to let you know this, and tells you the asset number that needs testing. Previously you wouldn’t know about the missing inspection unless you were looking at the screen whilst scanning. Note: This is most relevant where the inspection is not set as Mandatory, which is our workflow.

- When adding serialised stock by scanning barcodes, you now get a success “ding”, or a fault buzz and verbal warning if the asset number already exists. Previously there was no audio of any kind.

- When scanning assets into a container you will receive a verbal warning when trying to scan in an item that already is, or already is in, a container.

- Container weights: Added a section to the info side bar called Container Weights. This gives you a list of all containers currently in use, and the running total of weights in them. This is helpful as a quick reference in the warehouse to see if a crate has been overloaded, or to allow a tech to write the case weight on the road label. Note: In order for the weight of the case/container to be included it needs to be scanned onto the job. For example, if the container is 99008 (one of our laptop cases) the asset 99009 needs to be prepared on the job for the self weight of the that case to be included in the total.

- NEW: As requested in the CRMS wishlist: In Detail View the Free Scan mode can now be toggled by barcode. To do this, create barcode that has the value "freescan" (which typically means you would have "*freescan*"). When scanning this barcode you will hear an error sound as the item "isn't found", but immediately afterwards a voice prompt will declare "free scan on" or "free scan off".

## Feedback

I've tested this to a point in day to day usage, but please let me know if you encounter and bugs or unuseful behaviour.
If you've got any great ideas on other features you'd like to see, I'd love to hear those too...
