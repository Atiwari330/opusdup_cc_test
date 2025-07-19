# Real-time Streaming

## WebSocket Audio Streaming Architecture

```javascript
// Client-side: Stream audio chunks
const websocket = new WebSocket("wss://your-server.com/audio");
websocket.binaryType = "arraybuffer";

mediaRecorder.ondataavailable = (event) => {
  if (websocket.readyState === WebSocket.OPEN && event.data.size > 0) {
    websocket.send(event.data);
  }
};
```

## Low-latency Configuration

```javascript
// Use smaller chunks for lower latency
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "audio/webm;codecs=opus",
});

// Start with 250ms chunks
mediaRecorder.start(250);
```

## Chrome Extension Tab Streaming

```javascript
// Background script - capture tab audio
const startTabCapture = async (tabId) => {
  const stream = await chrome.tabCapture.capture({
    audio: true,
    video: false,
  });

  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    // Forward to content script or WebSocket
    chrome.tabs.sendMessage(tabId, {
      type: "audio-chunk",
      data: event.data,
    });
  };

  mediaRecorder.start(500);
};
```

## Buffer Management

```javascript
// Implement buffering for smooth playback
class AudioBuffer {
  constructor() {
    this.chunks = [];
    this.maxBuffer = 10; // Keep 10 chunks max
  }

  addChunk(chunk) {
    this.chunks.push(chunk);
    if (this.chunks.length > this.maxBuffer) {
      this.chunks.shift(); // Remove oldest
    }
  }

  getBuffer() {
    return new Blob(this.chunks, { type: "audio/webm" });
  }
}
```

## Next.js WebSocket Server

```javascript
// pages/api/socket.js or app/api/socket/route.js
import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      socket.on("audio-stream", (data) => {
        // Forward to transcription service
        socket.broadcast.emit("audio-data", data);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
```

## Performance Optimization

- Use binary WebSockets (avoid base64 encoding)
- Implement adaptive bitrate based on network conditions
- Use Web Workers for audio processing to avoid UI blocking
- Configure proper buffering strategies to prevent dropouts
