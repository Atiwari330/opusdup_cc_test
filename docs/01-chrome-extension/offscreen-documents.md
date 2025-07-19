# Offscreen Documents

## Creating Offscreen Documents

```javascript
// background.js - Ensure offscreen document exists
async function setupOffscreenDocument(path) {
  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(path)],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Create offscreen document
  await chrome.offscreen.createDocument({
    url: path,
    reasons: ["AUDIO_PLAYBACK", "USER_MEDIA"],
    justification: "Recording audio from tab",
  });
}

// Use it when needed
chrome.action.onClicked.addListener(async () => {
  await setupOffscreenDocument("offscreen.html");

  // Send message to offscreen document
  chrome.runtime.sendMessage({
    type: "start-recording",
    target: "offscreen",
  });
});
```

## Offscreen HTML Structure

```html
<!-- offscreen.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Offscreen Document</title>
  </head>
  <body>
    <script src="offscreen.js"></script>
  </body>
</html>
```

## Offscreen Document Script

```javascript
// offscreen.js - Handle audio capture
let recorder;
let stream;

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== "offscreen") return;

  switch (message.type) {
    case "start-recording":
      await startRecording(message.streamId);
      break;
    case "stop-recording":
      stopRecording();
      break;
  }
});

async function startRecording(streamId) {
  // Get media stream from tab
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  });

  // Setup MediaRecorder
  recorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;codecs=opus",
  });

  recorder.ondataavailable = (event) => {
    // Send audio data back to service worker
    chrome.runtime.sendMessage({
      type: "audio-chunk",
      data: event.data,
    });
  };

  recorder.start(100); // 100ms chunks
}

function stopRecording() {
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
```

## Messaging Between Contexts

```javascript
// Service worker -> Offscreen document
chrome.runtime.sendMessage({
  type: "command",
  target: "offscreen",
  data: {
    /* payload */
  },
});

// Offscreen document -> Service worker
chrome.runtime.sendMessage({
  type: "response",
  target: "background",
  data: {
    /* payload */
  },
});

// Content script cannot directly message offscreen
// Must relay through service worker
```

## Valid Offscreen Reasons

- `AUDIO_PLAYBACK` - Playing audio
- `CLIPBOARD` - Clipboard access
- `DOM_SCRAPING` - Parsing DOM
- `USER_MEDIA` - getUserMedia access
- `DISPLAY_MEDIA` - getDisplayMedia access
- `WEB_RTC` - WebRTC connections
- `BLOBS` - Creating object URLs

## Lifetime Management

```javascript
// Offscreen documents persist until:
// 1. Explicitly closed with closeDocument()
// 2. Audio playback stops (for AUDIO_PLAYBACK)
// 3. Extension is reloaded/updated

// Close when done
async function cleanup() {
  await chrome.offscreen.closeDocument();
}

// Check if exists before operations
async function hasOffscreenDocument(url) {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(url)],
  });
  return contexts.length > 0;
}
```

## Debugging Offscreen Documents

- Open chrome://inspect/#other
- Find your offscreen document
- Click "inspect" to open DevTools
- Alternative: Send logs to service worker for debugging
