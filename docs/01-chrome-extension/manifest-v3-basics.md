# Manifest V3 Basics

## Complete Manifest Structure

```json
{
  "manifest_version": 3,
  "name": "Healthcare Audio Capture",
  "version": "1.0.0",
  "description": "Real-time transcription for healthcare demos",
  "minimum_chrome_version": "116",

  "permissions": [
    "tabs",
    "tabCapture",
    "activeTab",
    "storage",
    "offscreen",
    "sidePanel",
    "scripting",
    "contextMenus"
  ],

  "host_permissions": ["https://*/*", "wss://*/*"],

  "background": {
    "service_worker": "background.js",
    "type": "module" // Only if using ES modules
  },

  "action": {
    "default_popup": "popup.html",
    "default_title": "Start Audio Capture",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "content_scripts": [
    {
      "matches": ["https://meet.google.com/*", "https://*.zoom.us/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],

  "web_accessible_resources": [
    {
      "resources": ["offscreen.html", "assets/*"],
      "matches": ["<all_urls>"]
    }
  ],

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Service Worker (background.js)

```javascript
// Top-level event listeners (required for MV3)
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.action.onClicked.addListener(handleActionClick);
chrome.runtime.onMessage.addListener(handleMessage);

async function onInstalled() {
  // Set default values
  await chrome.storage.local.set({
    isRecording: false,
    sessionData: [],
  });
}

async function handleActionClick(tab) {
  // Check if already recording
  const { isRecording } = await chrome.storage.local.get("isRecording");

  if (!isRecording) {
    await startRecording(tab);
  } else {
    await stopRecording();
  }
}

function handleMessage(request, sender, sendResponse) {
  // Handle messages from content scripts/offscreen docs
  switch (request.type) {
    case "audio-data":
      processAudioData(request.data);
      break;
    case "get-status":
      chrome.storage.local.get("isRecording").then(sendResponse);
      return true; // Keep channel open for async response
  }
}

// Use chrome.alarms instead of setTimeout
chrome.alarms.create("keepAlive", { periodInMinutes: 0.25 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    // Perform periodic tasks
  }
});
```

## Key MV3 Changes from V2

- Service workers replace background pages
- No DOM access in service workers
- Event listeners must be synchronous and top-level
- Use chrome.storage instead of global variables
- Host permissions separated from API permissions
- No remote code execution
- chrome.alarms replaces setTimeout/setInterval
