# currentRMS-helper 1.30.31
This is a work-in-progress Chrome extension to add functionality to the CurrentRMS web interface. It was created out of our frustration waiting on "quality of life" modifications to make the user experience better - specifically, as part of warehouse operations. Our warehouse team has found it helpful, so we've decided to share it with others. As it was created with our own in-house work processes in mind, it may or may not work for other users. However, my hope is that others (who are better at coding that I) might take this forward, or even inspire the CurrentRMS team to implement some of the changes within the main product.

**DISCLAIMER: This is a first attempt work-in-progress written by me, an utter rookie in JavaScript. Use at your own risk. This code is in no way affiliated with InspHire Ltd.**

## Installation
1. Copy the folder onto your desktop computer.
2. Open Google Chrome.
3. Go to Settings -> Extensions
4. Click "Load Unpacked"
5. Select the folder location.
6. Turn on the extension.
7. Ensure the default / built-in sound scheme is turned off to avoid duplicate sounds.
8. To use API based features, go to the CurrentRMS System Setup page and navigate to Integrations > API.
9. Enable the API and create a new API key.
10. Paste the API key into the CurrentRMS Helper pop-up field (this key is stored locally on your system, so should only need to be entered once).

** IMPORTANT: As stated by CurrentRMS: "API Keys give read and write access to your Current RMS System. You should keep your keys safe just as you do your username and password - only use them with software and services that you trust. Give each key a unique name so you can clearly identify who you have issued the key to."

THEREFORE: Do not enter your API key unless you have authority to do so. API key information is stored using chrome.storage.local. Though it isn't sent anywhere outside of your system (beyond making API calls), it is not encrypted, and is only as safe as your system.**

## Compatibility

Aside from the Chrome Desktop Browser, users have successfully used this extension in Opera, and Android via Kiwi.


## Features / Updates

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
