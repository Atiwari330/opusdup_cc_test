# Performance Optimization

## Audio Processing Optimization

```javascript
class OptimizedAudioProcessor {
  constructor() {
    this.audioBuffer = [];
    this.bufferSize = 4096; // Optimal chunk size
    this.sampleRate = 16000; // Deepgram optimized rate
    this.worker = null;

    this.initializeWorker();
  }

  initializeWorker() {
    // Offload processing to Web Worker
    this.worker = new Worker("/audio-worker.js");
    this.worker.onmessage = (event) => {
      this.handleProcessedAudio(event.data);
    };
  }

  processAudio(audioData) {
    // Use optimal chunk size for MediaRecorder
    const mediaRecorder = new MediaRecorder(audioData, {
      mimeType: "audio/webm;codecs=opus",
      audioBitsPerSecond: 128000, // Balanced quality/performance
    });

    // Start with small timeslice for low latency
    mediaRecorder.start(250); // 250ms chunks

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.worker.postMessage(event.data);
      }
    };
  }
}

// audio-worker.js
self.onmessage = (event) => {
  const audioData = event.data;

  // Process audio in worker thread
  const processedData = optimizeAudioData(audioData);

  self.postMessage(processedData);
};

function optimizeAudioData(data) {
  // Apply audio filters, compression, etc.
  return data;
}
```

## WebSocket Performance Optimization

```javascript
class HighPerformanceWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.messageQueue = [];
    this.batchSize = 10;
    this.batchTimeout = 100; // 100ms batching
    this.compressionEnabled = true;

    this.setupConnection();
  }

  setupConnection() {
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = "arraybuffer"; // Faster than blob

    this.ws.onopen = () => {
      this.startBatchProcessor();
    };
  }

  send(data) {
    if (this.compressionEnabled && data.byteLength > 1024) {
      // Compress large payloads
      data = this.compressData(data);
    }

    this.messageQueue.push(data);
  }

  startBatchProcessor() {
    setInterval(() => {
      if (this.messageQueue.length > 0) {
        const batch = this.messageQueue.splice(0, this.batchSize);
        this.sendBatch(batch);
      }
    }, this.batchTimeout);
  }

  sendBatch(messages) {
    if (messages.length === 1) {
      this.ws.send(messages[0]);
    } else {
      // Concatenate multiple messages for efficiency
      const combined = this.combineMessages(messages);
      this.ws.send(combined);
    }
  }

  compressData(data) {
    // Implement compression (simplified example)
    return new CompressionStream("gzip").writable.getWriter().write(data);
  }
}
```

## Real-time Transcription Optimization

```javascript
class OptimizedTranscriptionClient {
  constructor(apiKey) {
    this.deepgram = createClient(apiKey);
    this.connection = null;
    this.audioBuffer = new RingBuffer(1024 * 16); // 16KB ring buffer
    this.vadThreshold = 0.5;
    this.silenceTimeout = 2000;

    this.setupOptimizedConnection();
  }

  setupOptimizedConnection() {
    this.connection = this.deepgram.listen.live({
      model: "nova-3", // Fastest, most accurate
      encoding: "linear16",
      sample_rate: 16000, // Optimal for speech
      interim_results: true, // For real-time feedback
      endpointing: 300, // Quick endpointing
      utterance_end_ms: 1000, // Fast utterance detection
      vad_events: true, // Voice activity detection
    });

    this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      this.handleOptimizedTranscript(data);
    });
  }

  processAudioStream(audioData) {
    // Voice Activity Detection to reduce unnecessary processing
    if (this.detectVoiceActivity(audioData)) {
      this.audioBuffer.write(audioData);

      // Send in optimal chunks
      if (this.audioBuffer.available() >= this.optimalChunkSize) {
        const chunk = this.audioBuffer.read(this.optimalChunkSize);
        this.connection.send(chunk);
      }
    }
  }

  detectVoiceActivity(audioData) {
    // Simple energy-based VAD
    const energy = this.calculateEnergy(audioData);
    return energy > this.vadThreshold;
  }

  calculateEnergy(audioData) {
    const samples = new Float32Array(audioData);
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }
}
```

## Memory Management

```javascript
class MemoryOptimizer {
  constructor() {
    this.audioChunks = new Map();
    this.maxChunks = 100; // Limit memory usage
    this.cleanupInterval = 30000; // 30 seconds

    this.startMemoryCleanup();
  }

  addAudioChunk(id, data) {
    // Remove oldest chunks if at limit
    if (this.audioChunks.size >= this.maxChunks) {
      const oldestKey = this.audioChunks.keys().next().value;
      this.audioChunks.delete(oldestKey);
    }

    this.audioChunks.set(id, {
      data,
      timestamp: Date.now(),
    });
  }

  startMemoryCleanup() {
    setInterval(() => {
      const now = Date.now();
      const maxAge = 60000; // 1 minute

      for (const [id, chunk] of this.audioChunks) {
        if (now - chunk.timestamp > maxAge) {
          this.audioChunks.delete(id);
        }
      }

      // Force garbage collection hint
      if (window.gc) {
        window.gc();
      }
    }, this.cleanupInterval);
  }
}

// Efficient Ring Buffer implementation
class RingBuffer {
  constructor(size) {
    this.buffer = new ArrayBuffer(size);
    this.view = new Uint8Array(this.buffer);
    this.size = size;
    this.writePos = 0;
    this.readPos = 0;
    this.available = 0;
  }

  write(data) {
    const dataView = new Uint8Array(data);
    const spaceAvailable = this.size - this.available;
    const toWrite = Math.min(dataView.length, spaceAvailable);

    for (let i = 0; i < toWrite; i++) {
      this.view[this.writePos] = dataView[i];
      this.writePos = (this.writePos + 1) % this.size;
    }

    this.available += toWrite;
    return toWrite;
  }

  read(length) {
    const toRead = Math.min(length, this.available);
    const result = new ArrayBuffer(toRead);
    const resultView = new Uint8Array(result);

    for (let i = 0; i < toRead; i++) {
      resultView[i] = this.view[this.readPos];
      this.readPos = (this.readPos + 1) % this.size;
    }

    this.available -= toRead;
    return result;
  }
}
```

## Connection Pooling and Load Balancing

```javascript
class ConnectionPool {
  constructor(endpoints, poolSize = 3) {
    this.endpoints = endpoints;
    this.poolSize = poolSize;
    this.connections = [];
    this.currentIndex = 0;
    this.initializePool();
  }

  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const endpoint = this.endpoints[i % this.endpoints.length];
      const connection = this.createConnection(endpoint);
      this.connections.push(connection);
    }
  }

  createConnection(endpoint) {
    const ws = new WebSocket(endpoint);
    ws.binaryType = "arraybuffer";

    ws.onclose = () => {
      // Auto-reconnect on close
      setTimeout(() => {
        const newConnection = this.createConnection(endpoint);
        const index = this.connections.indexOf(ws);
        if (index !== -1) {
          this.connections[index] = newConnection;
        }
      }, 1000);
    };

    return ws;
  }

  getConnection() {
    // Round-robin load balancing
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.connections.length;

    // Return healthy connection
    if (connection.readyState === WebSocket.OPEN) {
      return connection;
    }

    // Find next healthy connection
    return this.connections.find((conn) => conn.readyState === WebSocket.OPEN);
  }
}
```

## Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      audioLatency: [],
      transcriptionLatency: [],
      throughput: [],
      memoryUsage: [],
      cpuUsage: [],
    };

    this.startMonitoring();
  }

  measureAudioLatency(startTime) {
    const latency = performance.now() - startTime;
    this.metrics.audioLatency.push(latency);

    // Keep only last 100 measurements
    if (this.metrics.audioLatency.length > 100) {
      this.metrics.audioLatency.shift();
    }

    return latency;
  }

  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
    }, 5000); // Every 5 seconds
  }

  collectMetrics() {
    // Memory usage
    if (performance.memory) {
      this.metrics.memoryUsage.push({
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        timestamp: Date.now(),
      });
    }

    // Send metrics to analytics
    this.sendMetrics();
  }

  getAverageLatency() {
    const latencies = this.metrics.audioLatency;
    return latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }
}
```

## Chrome Extension Performance

```javascript
// Optimize extension lifecycle
chrome.runtime.onStartup.addListener(() => {
  // Preload critical resources
  preloadAudioProcessor();
  initializeConnectionPool();
});

// Efficient tab capture
const optimizeTabCapture = () => {
  const constraints = {
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        echoCancellation: false, // Reduce processing
        autoGainControl: false, // Reduce processing
        noiseSuppression: false, // Reduce processing
      },
    },
  };

  return navigator.mediaDevices.getUserMedia(constraints);
};

// Background script optimization
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process relevant tab changes
  if (changeInfo.status === "complete" && tab.url?.startsWith("https://")) {
    // Initialize transcription for HTTPS pages only
    initializeTranscription(tabId);
  }
});
```

## Performance Optimization Checklist

- ✅ **Audio Processing**: Use Web Workers, optimal chunk sizes (250ms)
- ✅ **WebSocket**: Binary type, compression, batching
- ✅ **Memory**: Ring buffers, cleanup intervals, size limits
- ✅ **Transcription**: VAD, optimal sample rates (16kHz)
- ✅ **Connection**: Pooling, load balancing, health checks
- ✅ **Monitoring**: Latency tracking, memory profiling
- ✅ **Chrome Extension**: Efficient permissions, lifecycle management
- ✅ **Caching**: Audio chunks, transcription results
- ✅ **Compression**: Large payloads, voice detection
