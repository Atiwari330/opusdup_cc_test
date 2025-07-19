# MediaRecorder API

## Chrome Extension Setup

```javascript
// Manifest V3 permissions required
"permissions": ["activeTab", "tabs"]

// Get audio from tab capture
const stream = await chrome.tabCapture.capture({
  audio: true,
  video: false
});
```

## Basic MediaRecorder Implementation

```javascript
let chunks = [];
let mediaRecorder;

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;codecs=opus",
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    chunks = [];
    // Send to Deepgram or process
  };

  mediaRecorder.start(1000); // 1 second chunks
};
```

## Real-time Processing for Transcription

```javascript
// For streaming to Deepgram
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    // Send directly to WebSocket
    deepgramConnection.send(event.data);
  }
};

// Use smaller timeslices for lower latency
mediaRecorder.start(250); // 250ms chunks
```

## Best Practices

- Use `audio/webm;codecs=opus` for best compression
- Set timeslice to 250-1000ms for real-time transcription
- Always check `MediaRecorder.isTypeSupported()` before use
- Handle permission requests gracefully
- Implement proper cleanup with `stop()` and `stream.getTracks().forEach(track => track.stop())`
