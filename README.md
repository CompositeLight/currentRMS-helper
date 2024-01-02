# currentRMS-helper
This is a work-in-progress Chrome extension to add functionality to the CurrentRMS web interface. It was created out of our frustration waiting on "quality of life" modifications to make the user experience better - specifically, as part of warehouse operations. Our warehouse team has found it helpful, so we've decided to share it with others. As it was created with our own in-house work processes in mind, it may or may not work for other users. However, my hope is that others (who are better at coding that I) might take this forward, or even inspire the CurrentRMS team to implement some of the changes within the main product.

**DISCLAIMER: This is a first attempt work-in-progress written by me, an utter rookie in JavaScript. Use at your own risk. This code is in no way affiliated with InspHire Ltd.**

## Installation
1. Copy the folder onto your desktop computer.
2. Open Google Chrome.
3. Go to Settings -> Extensions
4. Click "Load Unpacked"
5. Select the folder location.
6. Turn on the extension.

## Features
- View options: Added tab buttons in Detail View to allow the user to hide Prepared items, hide Sub Rentals, and hide everything except Bulk/Non Stock Items. These hide the rows without effecting the display/sort order. When hiding Prepared Items, the parent item of an unprepared accessory will not be hidden until all its children are prepared.

- Added time stamps to “toast messages” generated when scanning in Detail View. This makes it easier to identify when errors occurred if you return to a screen full of red messages.

- Override the CSS position properties of “toast container” to allow the alerts to be scrolled when they overflow the screen. This is particularly helpful when using “Check shortages” since a long list is generated that would previously flow off the screen and be unreadable (and unlike individual scan errors it’s just one big box, so you can’t dismiss the top ones to bring the other messages into view).

- When using “check shortages” the returned list is now reformatted to be easier to read. Additionally, where an overdue inspection is flagged the name of the product is added after the asset number to make identification easier. Note: This function only works when “Check Shortages” is clicked on from Detail View. The Inspect Now button has been removed because we would never use it.

- If an item is scanned that has already been allocated/prepared a verbal message follows the error buzzer to say “Already scanned”. Previously you’d just hear a generic error buzz and would have to look up to work see why.

- If a temporary container is scanned that has already been allocated/prepared a verbal message follows the error buzzer to say “Container already allocated”. Previously you’d just hear a generic error buzz.

- If an item is scanned that requires an inspection, a verbal message follows the success “ping” to let you know this, and tells you the asset number that needs testing. Previously you wouldn’t know about the missing inspection unless you were looking at the screen whilst scanning.

- When adding serialised stock by scanning barcodes, you now get a success “ding”, or a fault buzz and verbal warning if the asset number already exists. Previously there was no audio of any kind.

- When scanning assets into a container you will receive a verbal warning when trying to scan in an item that already is, or already is in, a container.

- Container weights: Added a section to the info side bar called Container Weights. This gives you a list of all containers currently in use, and the running total of weights in them. This is helpful as a quick reference in the warehouse to see if a crate has been overloaded, or to allow a tech to write the case weight on the road label. Note: In order for the weight of the case/container to be included it needs to be scanned onto the job. For example, if the container is 99008 (one of our laptop cases) the asset 99009 needs to be prepared on the job for the self weight of the that case to be included in the total. 

## Feedback

I've tested this to a point in day to day usage, but please let me know if you encounter and bugs or unuseful behaviour.
If you've got any great ideas on other features you'd like to see, I'd love to hear those too...
