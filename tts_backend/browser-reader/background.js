chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Forward messages to the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, request)
                .then(response => sendResponse(response))
                .catch(error => sendResponse({ success: false, error: error.message }));
        }
    });
    return true; // Keep the message channel open for async responses
});