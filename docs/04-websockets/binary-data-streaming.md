# Binary Data Streaming

## WebSocket Binary Types

```javascript
// Set binary type before connection
const websocket = new WebSocket("wss://your-server.com");
websocket.binaryType = "arraybuffer"; // or 'blob' (default)

websocket.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    // Handle binary data
    const view = new DataView(event.data);
    console.log("Binary data received:", view.byteLength);
  } else {
    // Handle text data
    console.log("Text data:", event.data);
  }
};
```

## Sending Binary Data

```javascript
// Send ArrayBuffer
const buffer = new ArrayBuffer(1024);
const view = new Uint8Array(buffer);
view[0] = 65; // 'A'
websocket.send(buffer);

// Send Blob (from MediaRecorder)
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    websocket.send(event.data); // Blob sent as binary
  }
};

// Send Typed Arrays
const audioData = new Float32Array([0.1, 0.2, 0.3]);
websocket.send(audioData.buffer);
```

## Audio Streaming Implementation

```javascript
class AudioStreamer {
  constructor(websocketUrl) {
    this.ws = new WebSocket(websocketUrl);
    this.ws.binaryType = "arraybuffer";
    this.audioBuffer = [];
  }

  streamAudio() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(event.data);
        }
      };

      mediaRecorder.start(250); // 250ms chunks
    });
  }

  handleIncomingAudio(arrayBuffer) {
    // Convert to blob for audio playback
    const blob = new Blob([arrayBuffer], { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(blob);

    const audio = new Audio(audioUrl);
    audio.play();
  }
}
```

## Node.js Server Binary Handling

```javascript
// ws library (Node.js)
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      console.log("Binary data received:", data.length, "bytes");

      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: true });
        }
      });
    }
  });
});
```

## Data Conversion Utilities

```javascript
// ArrayBuffer to Base64 (avoid for binary streaming)
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
};

// Efficient binary concatenation
const concatenateArrayBuffers = (buffers) => {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  buffers.forEach((buffer) => {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  });

  return result.buffer;
};
```

## Performance Tips

- Use `arraybuffer` for better performance than `blob`
- Avoid base64 encoding for binary data (50% size increase)
- Send binary directly without JSON wrapping
- Use typed arrays for efficient memory usage
