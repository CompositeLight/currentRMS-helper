console.log("Global Asset Shortcut script is live");

  const globalSearchTerm = document.getElementById('search_term').value;
  const globalFoundCount = document.getElementById("global_search_count");

  console.log(searchTerm);
  console.log(globalFoundCount.innerText);

  setTimeout(function () {
    console.log(globalFoundCount.innerText);
    const allBlocks = document.querySelectorAll("span.search-result-title");

    var hitCount = 0;
    var hitsFound;

    console.log(allBlocks);



    allBlocks.forEach((item) => {
      if (item.innerText == "Serialised Stock Levels"){
        const hitTable = item.closest("table");
        hitsFound = hitTable.querySelectorAll("a");
        hitCount = hitCount + hitsFound.length;

      }
    });

    console.log(hitCount);
    if (hitCount == 1 && globalFoundCount.innerText == "1") {
      window.location.href = hitsFound[0].href;
    }



  }, 300);
