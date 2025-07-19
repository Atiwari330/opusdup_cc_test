// Content script - Establishes extension presence on the page
console.log('[Content] EHR Transcription extension loaded on:', window.location.href);

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content] Message received:', request);
  
  if (request.action === 'ping') {
    // Respond to confirm the content script is loaded
    sendResponse({ status: 'ready', url: window.location.href });
  }
  
  return true; // Keep message channel open for async response
});

// Notify background script that content script is loaded
chrome.runtime.sendMessage({
  action: 'contentScriptLoaded',
  url: window.location.href,
  timestamp: new Date().toISOString()
});