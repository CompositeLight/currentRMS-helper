chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);
  sendResponse({ message: "Background js received your message" });
  (async () => {
    // Sends a message to the service worker and receives a response
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {inpsectionAlerts: message.inpsectionAlerts}, function(response) {});
    });
  })();
});
