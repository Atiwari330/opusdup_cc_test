# Deepgram JavaScript SDK

## Installation

```bash
npm install @deepgram/sdk
```

## Basic Setup

```javascript
import { createClient } from "@deepgram/sdk";
// For Next.js/browser applications
const deepgramClient = createClient(DEEPGRAM_API_KEY);
```

## Configuration Options

```javascript
const deepgramClient = createClient(DEEPGRAM_API_KEY, {
  global: {
    fetch: { options: { url: "https://api.beta.deepgram.com" } },
    websocket: { options: { url: "ws://localhost:8080" } },
  },
  listen: {
    fetch: { options: { url: "http://localhost:8080" } },
  },
});
```

## Browser Support

For Chrome extension usage, configure proxy for CORS:

```javascript
const deepgramClient = createClient("proxy", {
  global: {
    fetch: {
      options: { proxy: { url: "http://localhost:8080" } },
    },
  },
});
```

## Pre-recorded Transcription

```javascript
const { result, error } = await deepgramClient.listen.prerecorded.transcribeUrl(
  {
    url: "https://example.com/audio.wav",
  },
  {
    model: "nova-3",
    smart_format: true,
  }
);
```

## Key Features

- ESM and CommonJS support
- Scoped configuration system
- Browser compatibility with proxy setup
- Error handling improvements
- Fetch API integration (replaces deprecated request library)
