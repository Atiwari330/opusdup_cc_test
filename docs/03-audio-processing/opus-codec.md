# Opus Codec

## Overview

Opus is the gold standard for WebRTC audio, combining SILK (speech) and CELT (low-latency) algorithms for optimal real-time communication.

## Key Characteristics

- **Bitrate Range**: 6 kbps to 510 kbps (effective floor ~8-9 kbps in browsers)
- **Sample Rates**: 8, 12, 16, 24, 48 kHz (48 kHz recommended)
- **Latency**: 26.5ms default, can be reduced to 5ms
- **Mandatory**: Required for WebRTC implementations

## MediaRecorder Configuration

```javascript
// Check support first
if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;codecs=opus",
    audioBitsPerSecond: 128000, // 128 kbps for high quality
  });
}
```

## WebRTC SDP Configuration

```javascript
// Force Opus with specific parameters
const modifySDP = (sdp) => {
  // Set max bandwidth and sample rate
  return sdp.replace(
    /a=rtpmap:111 opus\/48000\/2/g,
    "a=rtpmap:111 opus/48000/2\r\na=fmtp:111 maxplaybackrate=48000;sprop-maxcapturerate=48000"
  );
};
```

## Deepgram Integration

```javascript
// Opus is automatically handled by Deepgram
const connection = deepgramClient.listen.live({
  encoding: "opus", // When using raw Opus packets
  model: "nova-3",
  smart_format: true,
});

// Or let Deepgram auto-detect from WebM container
const connection = deepgramClient.listen.live({
  model: "nova-3", // No encoding needed for containerized
  smart_format: true,
});
```

## Browser Support

- Chrome, Firefox, Safari, Edge: Full support
- Mandatory for WebRTC compliance
- Native support in major multimedia frameworks
