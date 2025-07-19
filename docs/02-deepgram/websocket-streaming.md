# Deepgram WebSocket Streaming

## Live Transcription Setup

```javascript
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

const deepgramClient = createClient(DEEPGRAM_API_KEY);
const deepgramConnection = deepgramClient.listen.live({
  model: "nova-3",
  smart_format: true,
  interim_results: true,
  endpointing: 300,
});
```

## Event Handling

```javascript
deepgramConnection.on(LiveTranscriptionEvents.Open, () => {
  console.log("Connection opened");
});

deepgramConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
  console.log("Transcript:", data.channel.alternatives[0].transcript);
});

deepgramConnection.on(LiveTranscriptionEvents.Error, (error) => {
  console.error("WebSocket error:", error);
});
```

## Audio Streaming

```javascript
// Send audio data
source.addListener("got-some-audio", async (event) => {
  deepgramConnection.send(event.raw_audio_data);
});

// Keep connection alive
setInterval(() => {
  const keepAliveMsg = JSON.stringify({ type: "KeepAlive" });
  deepgramConnection.send(keepAliveMsg);
}, 3000);
```

## Connection Management

```javascript
// Close connection
const closeMsg = JSON.stringify({ type: "CloseStream" });
deepgramConnection.send(closeMsg);
```

## URL Parameters

```
wss://api.deepgram.com/v1/listen?
  model=nova-3&
  encoding=linear16&
  sample_rate=16000&
  interim_results=true&
  smart_format=true
```

## Best Practices

- Use KeepAlive messages every 3 seconds
- Handle connection drops with reconnection logic
- Avoid sending empty byte arrays (triggers closure)
- Implement proper error handling for robust streaming
