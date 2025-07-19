# Side Panel UI

## Manifest Configuration

```json
{
  "manifest_version": 3,
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Open transcription panel"
  }
}
```

## Enable Side Panel on Action Click

```javascript
// background.js - Open panel when extension icon clicked
chrome.sidePanel
  .setPanelBehavior({
    openPanelOnActionClick: true,
  })
  .catch((error) => console.error(error));

// Or programmatically open
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
```

## Side Panel HTML

```html
<!-- sidepanel.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Live Transcription</title>
    <link rel="stylesheet" href="sidepanel.css" />
  </head>
  <body>
    <div class="header">
      <h2>Live Transcription</h2>
      <button id="toggleRecording">Start Recording</button>
    </div>

    <div id="transcriptionContainer" class="transcription-area">
      <!-- Transcriptions appear here -->
    </div>

    <div class="footer">
      <button id="exportBtn">Export</button>
      <button id="clearBtn">Clear</button>
    </div>

    <script src="sidepanel.js"></script>
  </body>
</html>
```

## Side Panel JavaScript

```javascript
// sidepanel.js - Handle transcription display
let isRecording = false;

document
  .getElementById("toggleRecording")
  .addEventListener("click", async () => {
    const button = document.getElementById("toggleRecording");

    if (!isRecording) {
      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Send message to start recording
      chrome.runtime.sendMessage({
        type: "start-recording",
        tabId: tab.id,
      });

      button.textContent = "Stop Recording";
      button.classList.add("recording");
      isRecording = true;
    } else {
      chrome.runtime.sendMessage({ type: "stop-recording" });
      button.textContent = "Start Recording";
      button.classList.remove("recording");
      isRecording = false;
    }
  });

// Listen for transcription updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "transcription") {
    addTranscription(message.data);
  }
});

function addTranscription(data) {
  const container = document.getElementById("transcriptionContainer");
  const entry = document.createElement("div");
  entry.className = `transcript-entry ${data.is_final ? "final" : "interim"}`;

  entry.innerHTML = `
    <span class="timestamp">${new Date(
      data.timestamp
    ).toLocaleTimeString()}</span>
    <span class="text">${data.text}</span>
    <span class="confidence">${Math.round(data.confidence * 100)}%</span>
  `;

  container.appendChild(entry);
  entry.scrollIntoView({ behavior: "smooth" });
}
```

## Tab-Specific Side Panels

```javascript
// Show panel only on specific sites
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!info.status) return;

  const videoConferencingSites = [
    "meet.google.com",
    "zoom.us",
    "teams.microsoft.com",
  ];

  const url = new URL(tab.url);
  const isVideoConference = videoConferencingSites.some((site) =>
    url.hostname.includes(site)
  );

  await chrome.sidePanel.setOptions({
    tabId,
    path: isVideoConference ? "sidepanel.html" : undefined,
    enabled: isVideoConference,
  });
});
```

## Side Panel Styling

```css
/* sidepanel.css */
body {
  width: 100%;
  margin: 0;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
}

.transcription-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.transcript-entry {
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  background: #f9f9f9;
}

.transcript-entry.interim {
  opacity: 0.7;
  font-style: italic;
}

.recording {
  background-color: #ff4444;
  color: white;
}
```

## Context Menu Integration

```javascript
// Open side panel from context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openTranscriptionPanel",
    title: "Open Transcription Panel",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openTranscriptionPanel") {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
```
