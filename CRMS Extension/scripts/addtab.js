
let recentOppsList = [];

if (!orderView){
  var orderView = false;
}
if (!detailView){
  var detailView = false;
}

getSetRecents();

function getSetRecents(){
  // get the multi global check in setting from local storage
  chrome.storage.local.get(["recentsOpps"]).then((result) => {

    if (result.recentsOpps != undefined){
      recentOppsList = result.recentsOpps;
    }
    // populate the tab on this page
    // Call the function to add the menu item
    addMenuItemToNavbar();

    // now check if we need to add a new entry to the list
    if (orderView || detailView){

      var title = document.querySelector("h1.subject-title").innerText;

      // scrape the opportunity ID from the page URL if there is one
      let opportunityID = (function() {
        const currentUrl = window.location.href;
        // Use a regular expression to match the opportunity ID in the URL
        const match = currentUrl.match(/\/opportunities\/(\d+)/);
          // Check if there is a match and return the opportunity ID (group 1 in the regex)
        return match ? match[1] : null;
      })();

      // Check if opportunityID already exists in the recentOppsList array of objects
      const found = recentOppsList.some(item => item[opportunityID] !== undefined);

      if (found){
        const filteredOppsList = recentOppsList.filter(obj => !obj.hasOwnProperty(opportunityID));
        filteredOppsList.unshift({[opportunityID]: title});
        recentOppsList = filteredOppsList;
      } else {
        recentOppsList.unshift({[opportunityID]: title});
      };

      while (recentOppsList.length > 10) {
        recentOppsList.splice(-1, 1);  // Remove the last element
      }

      chrome.storage.local.set({'recentsOpps': recentOppsList}).then(() => {
         console.log("Recent opps list was updated");
         console.log("Recent Opps:");
         console.log(recentOppsList);
       });


    };

  });
}

function clearRecentOpportunitiesList() {
  chrome.storage.local.set({'recentsOpps': []}).then(() => {
     console.log("Recent opps list was cleared");
     recentOppsList = [];
     getSetRecents();
   });
}



function addMenuItemToNavbar() {
  // Find the first <ul> element with classes "nav" and "navbar-nav"
  const navbar = document.querySelector('ul.nav.navbar-nav');

  const existingMenu = document.getElementById('recentsmenu');
  if (existingMenu){
    existingMenu.remove();
  }


  // Check if the navbar was found
  if (navbar) {
    // Create the new <li> element to append
    const newMenuItem = document.createElement('li');
    newMenuItem.className = 'dropdown menu02';
    newMenuItem.id = "recentsmenu";

    let recentItems = "";

    recentOppsList.forEach(obj => {
      // Get the first (and only) key-value pair from each object in the array
      const [key, value] = Object.entries(obj)[0];
      recentItems += `<li><a href="/opportunities/${key}">(${key}) ${value}</a></li>`;

    });


    // Set the innerHTML with the specified structure
    newMenuItem.innerHTML = `
      <a class="dropdown-toggle" data-toggle="dropdown" href="/opportunities">Recent</a>
      <ul class="dropdown-menu">
        ${recentItems}
        <li><a href="#" id="clearRecentsLink"><i>-- Clear Recents --</i></a></li>
      </ul>`;

    // Append the new <li> element to the navbar
    navbar.appendChild(newMenuItem);

    // Add event listener for the "Clear Recents" link
    document.getElementById('clearRecentsLink').addEventListener('click', function(event) {
      event.preventDefault();  // Prevent default link behavior
      clearRecentOpportunitiesList();
    });
  }
}
