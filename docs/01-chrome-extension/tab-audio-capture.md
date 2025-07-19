# Chrome Extension for Real-Time Audio Capture and Transcription: Comprehensive Implementation Guide

Real-time audio capture from Chrome extensions for healthcare sales demonstrations requires sophisticated architecture combining Manifest V3 compliance, secure WebSocket streaming, and HIPAA-compliant data handling. Based on extensive 2024-2025 research, implementing such a system faces unique challenges around service worker limitations, requiring offscreen documents for media capture and specialized approaches for each video conferencing platform.

The primary technical hurdle is that Chrome's Manifest V3 service workers lack direct DOM access, necessitating workarounds through offscreen documents and the `chrome.tabCapture.getMediaStreamId()` API introduced in Chrome 116+. WebSocket implementation proves superior to Socket.IO for real-time streaming due to Manifest V3 incompatibilities, while transcription services like OpenAI's Realtime API offer sub-200ms latency for live transcription. Security considerations demand end-to-end encryption with AES-256, comprehensive audit logging, and careful handling of Protected Health Information (PHI) to maintain HIPAA compliance.

## Chrome Extension Architecture with Manifest V3

Chrome's Manifest V3 fundamentally changes extension architecture by replacing persistent background pages with service workers that terminate after 30 seconds of inactivity. This creates significant challenges for continuous audio streaming applications.

The solution involves a three-component architecture: service workers handle user interactions and coordinate capture, offscreen documents manage the actual media streams, and content scripts provide UI overlays. The **critical requirement** is Chrome 116+ which introduced `chrome.tabCapture.getMediaStreamId()`, enabling service workers to obtain stream IDs that offscreen documents can consume.

**Complete manifest.json structure**:

```json
{
  "manifest_version": 3,
  "name": "Healthcare Audio Capture",
  "version": "1.0.0",
  "minimum_chrome_version": "116",

  "permissions": [
    "tabCapture",
    "activeTab",
    "storage",
    "offscreen",
    "sidePanel"
  ],

  "host_permissions": ["https://*/*"],

  "background": {
    "service_worker": "background.js"
  },

  "action": {
    "default_popup": "popup.html",
    "default_title": "Start Audio Capture"
  },

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "web_accessible_resources": [
    {
      "resources": ["offscreen.html"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

The offscreen document pattern allows continuous audio processing while the service worker remains dormant. When a user clicks the extension icon, the service worker creates an offscreen document if needed, obtains a media stream ID, and passes it to the offscreen context for recording.

## Real-time audio streaming implementation

WebSocket proves the optimal choice for streaming audio from Chrome extensions to Next.js backends, offering binary data transmission without the 30-50% overhead of base64 encoding. **Socket.IO is incompatible** with Manifest V3 service workers due to ES module limitations.

The streaming architecture requires careful consideration of chunk size and transmission frequency. Research indicates 100ms chunks with Opus codec at 128kbps provides optimal balance between latency and quality. Service workers must implement keepalive mechanisms every 20 seconds to prevent termination during active streaming.

**WebSocket audio streamer implementation**:

```javascript
class WebSocketAudioStreamer {
  constructor(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this.webSocket = null;
  }

  connect() {
    this.webSocket = new WebSocket(this.url);
    this.webSocket.binaryType = "arraybuffer";

    this.webSocket.onopen = () => {
      this.reconnectAttempts = 0;
      this.keepAlive();
    };

    this.webSocket.onclose = () => {
      this.attemptReconnect();
    };
  }

  sendAudioChunk(audioData) {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(audioData);
    }
  }

  keepAlive() {
    setInterval(() => {
      if (this.webSocket?.readyState === WebSocket.OPEN) {
        this.webSocket.send("ping");
      }
    }, 20000);
  }
}
```

MediaRecorder configuration significantly impacts streaming performance. Setting the recording interval to 100ms minimizes latency while maintaining stream stability. The audio must remain unmuted for users during capture, requiring AudioContext manipulation to route captured audio back to speakers.

## Next.js backend architecture for transcription

Next.js WebSocket servers **cannot deploy on Vercel** or other serverless platforms due to persistent connection requirements. Production deployments require platforms supporting long-lived connections like Railway, Render, or AWS ECS.

The backend architecture involves three layers: WebSocket server for receiving audio streams, audio processing pipeline for format conversion and buffering, and transcription service integration. OpenAI's Realtime API offers the lowest latency (<200ms) for live transcription, while Whisper API provides cost-effective batch processing.

**Custom Next.js server with WebSocket support**:

```javascript
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const app = next({ dev: false });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(","),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("audio-chunk", async (data) => {
      await processAudioChunk(data, socket);
    });
  });

  httpServer.listen(3000);
});
```

Audio processing requires careful buffer management to handle network jitter and maintain smooth transcription flow. Implementing a circular buffer with 1-second capacity provides adequate protection against packet loss while minimizing latency.

## Security and HIPAA compliance requirements

Healthcare applications demand stringent security measures beyond standard web applications. **HIPAA compliance requires** end-to-end encryption using AES-256, comprehensive audit logging retained for six years, and Business Associate Agreements (BAAs) with all third-party services.

Chrome extensions handling PHI must implement several security layers:

**Encryption standards**: All audio data must be encrypted before WebSocket transmission using FIPS 140-2 validated algorithms. Transport security requires TLS 1.2+ with specific NIST-compliant cipher suites. Local storage must use Chrome's encrypted storage APIs exclusively.

**Audit logging implementation**: Every access to PHI requires logging including user identity, timestamp, and data accessed. Logs themselves require encryption with separate keys and tamper-evident mechanisms like digital signatures.

**Authentication flow**: JWT tokens with 15-30 minute expiration provide session management. Tokens must be stored in Chrome's secure storage, never in localStorage. Implement token rotation on each API call to minimize exposure window.

Certificate pinning prevents man-in-the-middle attacks by validating specific certificates rather than trusting the entire certificate chain. This proves especially critical in healthcare environments where network administrators might install custom root certificates.

## Platform-specific integration strategies

Each video conferencing platform presents unique integration challenges due to different audio handling mechanisms and DOM structures.

**Google Meet** offers the cleanest integration using Chrome's native tabCapture API. The platform uses standard WebRTC with Opus codec preference, making audio capture straightforward. Meeting detection relies on monitoring specific DOM elements and URL patterns.

**Zoom web client** complicates audio capture through complex WebRTC routing and potential audio isolation. Some configurations may require fallback to screen capture with audio to successfully capture all participants. The extension must handle Zoom's waiting room flows and authentication mechanisms.

**Microsoft Teams** requires handling both web and Progressive Web App (PWA) versions. Teams implements sophisticated audio routing with background noise cancellation that can interfere with capture. Extensions must monitor Teams-specific event listeners and handle multiple concurrent audio streams.

Platform detection should use a combination of URL pattern matching and DOM fingerprinting for reliability. Each platform requires specific audio quality settings - Google Meet prefers 48kHz sampling, Zoom supports 44.1kHz, while Teams dynamically adjusts based on bandwidth.

## Development workflow and performance optimization

Modern Chrome extension development benefits from build tools designed specifically for the extension ecosystem. **Vite with CRXJS plugin** provides the optimal development experience with hot module replacement for content scripts and automatic manifest processing.

Performance optimization centers on three critical areas:

**Memory management**: Long recording sessions can exhaust browser memory without proper buffer management. Implement circular buffers with explicit cleanup, limiting retained audio to essential segments. AudioWorklets provide efficient processing with minimal CPU overhead.

**Service worker lifecycle**: Prevent premature termination through strategic API calls every 25 seconds. Lazy loading non-essential modules reduces startup time from 800ms to under 200ms. Critical path optimization ensures recording can begin within 500ms of user interaction.

**Audio processing efficiency**: Use AudioWorklet for all real-time processing to avoid main thread blocking. Implement adaptive processing rates based on CPU usage - reduce processing when CPU exceeds 60% utilization. Throttle non-essential operations during active recording.

Testing strategies must cover both unit tests with mocked Chrome APIs and integration tests using Puppeteer with actual extension loading. Audio quality validation requires automated analysis of signal-to-noise ratio and harmonic distortion metrics.

## Production deployment considerations

Chrome Web Store policies for healthcare extensions require extensive documentation and clear privacy policies. **Single purpose declaration** proves critical - the extension must focus solely on audio capture for sales demonstrations without feature creep.

Deployment automation through GitHub Actions streamlines the release process:

```yaml
- name: Upload to Chrome Web Store
  uses: mobilefirstllc/cws-publish@latest
  with:
    extension_id: ${{ secrets.CHROME_EXTENSION_ID }}
    zip_file: "extension.zip"
```

Cross-browser support requires conditional implementations. Microsoft Edge offers full compatibility with Chrome extensions, while Firefox requires the WebExtension polyfill and alternative audio capture methods. Safari's limited WebExtension support makes it impractical for this use case.

Error tracking through Sentry provides essential production monitoring, though sensitive healthcare data must be filtered before transmission. Implement custom beforeSend handlers to strip any PHI from error reports while maintaining debugging context.

## Key technical recommendations

Based on comprehensive analysis of current technologies and constraints, the following architecture provides optimal results:

1. **Use native WebSocket API over Socket.IO** - Manifest V3 incompatibilities make Socket.IO impractical for production use

2. **Implement offscreen documents for audio capture** - Service worker limitations require this pattern for continuous recording

3. **Choose OpenAI Realtime API for live transcription** - Sub-200ms latency enables natural conversation flow during demos

4. **Deploy on container-based platforms** - Railway, Render, or AWS ECS support required WebSocket connections

5. **Prioritize security from design phase** - HIPAA compliance cannot be retrofitted effectively

6. **Test across all major conferencing platforms** - Each platform requires specific handling for reliable audio capture

This implementation approach balances technical requirements with practical constraints, providing a robust foundation for healthcare-compliant real-time audio transcription in sales demonstrations. The architecture scales from single-user demos to enterprise deployments while maintaining security and performance standards required for healthcare applications.

# Tab Audio Capture

## Using chrome.tabCapture.getMediaStreamId (Chrome 116+)

```javascript
// background.js - Get stream ID in service worker
chrome.action.onClicked.addListener(async (tab) => {
  // Get stream ID for the current tab
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  });

  // Send to offscreen document for processing
  chrome.runtime.sendMessage({
    type: "start-capture",
    target: "offscreen",
    data: { streamId, tabId: tab.id },
  });
});
```

## Offscreen Document Audio Capture

```javascript
// offscreen.js - Use stream ID to capture audio
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "start-capture") {
    const { streamId } = message.data;

    // Get MediaStream using the stream ID
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false, // Audio only
    });

    // Keep audio playing for user
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(audioContext.destination);

    // Start recording
    startRecording(stream);
  }
});

function startRecording(stream) {
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;codecs=opus",
    audioBitsPerSecond: 128000,
  });

  const chunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
      // Stream chunk to backend
      sendChunkToBackend(event.data);
    }
  };

  mediaRecorder.start(100); // 100ms chunks
}
```

## Direct Capture in Popup (Audio Only)

```javascript
// popup.js - Direct capture without offscreen
document.getElementById("start-btn").addEventListener("click", () => {
  chrome.tabCapture.capture({ audio: true }, (stream) => {
    if (!stream) {
      console.error("Failed to capture tab audio");
      return;
    }

    // Continue playing audio
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(audioContext.destination);

    // Record for 5 seconds
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      saveAudioFile(blob);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 5000);
  });
});
```

## Tab Capture Status Monitoring

```javascript
// Monitor capture status across tabs
chrome.tabCapture.onStatusChanged.addListener((info) => {
  console.log(`Tab ${info.tabId} capture status: ${info.status}`);

  if (info.status === "active") {
    // Update UI to show recording
    chrome.action.setBadgeText({ text: "REC", tabId: info.tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  } else {
    // Clear badge when not recording
    chrome.action.setBadgeText({ text: "", tabId: info.tabId });
  }
});

// Get all tabs currently being captured
async function getCapturingTabs() {
  const captureTabs = await chrome.tabCapture.getCapturedTabs();
  return captureTabs.filter((tab) => tab.status === "active");
}
```

## Common Issues & Solutions

- **Audio muted during capture**: Use AudioContext to route audio back to speakers
- **Stream ends on navigation**: Use offscreen documents for persistent capture
- **Permission errors**: Ensure tabCapture permission in manifest
- **Chrome 116+ required**: For getMediaStreamId() with offscreen documents
