# Deepgram Audio Formats

## Supported Formats

Deepgram supports 100+ audio formats including:

### Common Raw Audio Encodings

- **linear16**: 16-bit PCM (most common for web applications)
- **opus**: Compressed audio codec (ideal for web streaming)
- **mulaw**: μ-law encoding (telephony applications)
- **alaw**: A-law encoding (telephony applications)
- **flac**: Free Lossless Audio Codec

### Container Formats

- **WAV**: Uncompressed audio container
- **MP3**: MPEG audio compression
- **OGG**: Open-source container format
- **M4A**: MPEG-4 audio container

## Live Streaming Configuration

### Raw Audio (Chrome Extension/MediaRecorder)

```javascript
// For raw audio, specify encoding and sample rate
const connection = deepgramClient.listen.live({
  encoding: "linear16",
  sample_rate: 16000,
  model: "nova-3",
});
```

### Containerized Audio

```javascript
// For containerized audio, let Deepgram auto-detect
const connection = deepgramClient.listen.live({
  model: "nova-3",
  smart_format: true,
  // No encoding/sample_rate needed
});
```

## Chrome Extension Audio Capture

```javascript
// MediaRecorder API setup for Chrome extensions
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "audio/webm;codecs=opus",
});

mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    connection.send(event.data);
  }
};
```

## Sample Rate Options

- **8000 Hz**: Telephony quality
- **16000 Hz**: Standard for voice applications
- **24000 Hz**: High quality (default for TTS)
- **48000 Hz**: Professional audio

## Best Practices

- Test small audio samples first with new sources
- Use linear16 encoding for web applications
- Set container=none for VoIP to avoid clicks
- Match sample rate to your audio source
- Prefer containerized formats when headers are available
