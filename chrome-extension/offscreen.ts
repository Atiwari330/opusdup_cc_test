// Offscreen document for audio capture and processing
// Handles MediaStream acquisition, MediaRecorder setup, and audio streaming

console.log('[Offscreen] Initializing offscreen document');

// Audio capture state
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioContext: AudioContext | null = null;
let isCapturing = false;

// Audio buffering for network resilience
const audioBuffer: ArrayBuffer[] = [];
const MAX_BUFFER_SIZE = 50; // Max 50 chunks (~12.5 seconds at 250ms per chunk)
let isWebSocketConnected = false;
let bufferRetryTimer: number | null = null;

// WebSocket connection
let websocket: WebSocket | null = null;
const WEBSOCKET_URL = 'ws://localhost:3000/ws/transcription';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000; // 2 seconds

// Message types
interface StartCaptureMessage {
  target: 'offscreen';
  action: 'startCapture';
  streamId: string;
}

interface StopCaptureMessage {
  target: 'offscreen';
  action: 'stopCapture';
}

type OffscreenMessage = StartCaptureMessage | StopCaptureMessage;

// Update status display
function updateStatus(status: string) {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = status;
  }
  console.log('[Offscreen]', status);
}

// Message handler
chrome.runtime.onMessage.addListener((message: OffscreenMessage, sender, sendResponse) => {
  // Only handle messages targeted at offscreen
  if (message.target !== 'offscreen') {
    return false;
  }
  
  console.log('[Offscreen] Message received:', message.action);
  
  switch (message.action) {
    case 'startCapture':
      startAudioCapture(message.streamId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('[Offscreen] Start capture error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
      
    case 'stopCapture':
      stopAudioCapture()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('[Offscreen] Stop capture error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    default:
      console.warn('[Offscreen] Unknown action:', (message as any).action);
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

// Start audio capture
async function startAudioCapture(streamId: string) {
  try {
    updateStatus('Starting audio capture...');
    
    // Get media stream using the stream ID from tab capture
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      } as any,
      video: false
    });
    
    console.log('[Offscreen] Got media stream with', mediaStream.getAudioTracks().length, 'audio tracks');
    
    // Create audio context for playback routing
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(mediaStream);
    
    // Route audio to speakers so user can still hear
    // Create a gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0; // Full volume
    
    // Connect source -> gain -> destination (speakers)
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set up MediaRecorder for streaming
    const mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
    
    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000 // 128 kbps for quality/performance balance
    });
    
    // Handle data available events
    mediaRecorder.ondataavailable = handleAudioData;
    
    // Handle recorder state changes
    mediaRecorder.onstart = () => {
      updateStatus('Recording audio...');
      isCapturing = true;
    };
    
    mediaRecorder.onstop = () => {
      updateStatus('Recording stopped');
      isCapturing = false;
    };
    
    mediaRecorder.onerror = (event: any) => {
      console.error('[Offscreen] MediaRecorder error:', event.error);
      updateStatus('Recording error: ' + event.error);
    };
    
    // Start recording with 250ms chunks for low latency
    mediaRecorder.start(250);
    
    // Connect to WebSocket server
    connectWebSocket();
    
    console.log('[Offscreen] Audio capture started successfully');
    
  } catch (error) {
    updateStatus('Error: ' + (error as Error).message);
    throw error;
  }
}

// Stop audio capture
async function stopAudioCapture() {
  try {
    updateStatus('Stopping audio capture...');
    
    // Stop MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    // Stop all tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('[Offscreen] Stopped track:', track.kind, track.label);
      });
    }
    
    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close();
    }
    
    // Clean up
    mediaStream = null;
    mediaRecorder = null;
    audioContext = null;
    isCapturing = false;
    
    // Clear buffer when stopping
    clearBuffer();
    
    // Disconnect WebSocket
    disconnectWebSocket();
    
    updateStatus('Audio capture stopped');
    console.log('[Offscreen] Audio capture stopped successfully');
    
  } catch (error) {
    updateStatus('Error stopping: ' + (error as Error).message);
    throw error;
  }
}

// Handle audio data chunks
function handleAudioData(event: BlobEvent) {
  if (event.data && event.data.size > 0) {
    console.log('[Offscreen] Audio chunk received:', event.data.size, 'bytes');
    
    // Convert to ArrayBuffer for WebSocket streaming
    event.data.arrayBuffer().then(buffer => {
      console.log('[Offscreen] Converted to ArrayBuffer:', buffer.byteLength, 'bytes');
      
      // Add to buffer
      addToBuffer(buffer);
      
      // Try to send buffered data if WebSocket is connected
      if (isWebSocketConnected) {
        processBuffer();
      }
    }).catch(error => {
      console.error('[Offscreen] Error converting blob to buffer:', error);
    });
  }
}

// Add audio data to buffer
function addToBuffer(data: ArrayBuffer) {
  audioBuffer.push(data);
  
  // Check buffer size and clear if too large
  if (audioBuffer.length > MAX_BUFFER_SIZE) {
    console.warn('[Offscreen] Buffer full, removing oldest chunks');
    // Remove oldest chunks (FIFO)
    audioBuffer.splice(0, audioBuffer.length - MAX_BUFFER_SIZE);
  }
  
  console.log('[Offscreen] Buffer size:', audioBuffer.length, 'chunks');
}

// Process buffered audio data
function processBuffer() {
  if (audioBuffer.length === 0 || !websocket || websocket.readyState !== WebSocket.OPEN) {
    return;
  }
  
  console.log('[Offscreen] Processing buffer with', audioBuffer.length, 'chunks');
  
  // Send each buffered chunk via WebSocket
  const chunksToSend = [...audioBuffer];
  audioBuffer.length = 0; // Clear buffer
  
  let sentCount = 0;
  let totalBytes = 0;
  
  for (const chunk of chunksToSend) {
    try {
      // Send binary audio data directly
      console.log('[Offscreen] Sending audio chunk:', chunk.byteLength, 'bytes, type:', typeof chunk);
      websocket.send(chunk);
      sentCount++;
      totalBytes += chunk.byteLength;
    } catch (error) {
      console.error('[Offscreen] Error sending audio chunk:', error);
      // Re-add failed chunks to buffer
      audioBuffer.push(...chunksToSend.slice(sentCount));
      break;
    }
  }
  
  console.log('[Offscreen] Sent', sentCount, 'chunks,', totalBytes, 'bytes total');
}

// Retry buffer processing with basic retry logic
function scheduleBufferRetry() {
  // Cancel existing retry timer
  if (bufferRetryTimer) {
    clearTimeout(bufferRetryTimer);
  }
  
  // Schedule retry after 2 seconds
  bufferRetryTimer = setTimeout(() => {
    console.log('[Offscreen] Retrying buffer processing...');
    if (!isWebSocketConnected && audioBuffer.length > 0) {
      // In Epic 4, this will attempt WebSocket reconnection
      console.log('[Offscreen] WebSocket not connected, keeping data in buffer');
      scheduleBufferRetry(); // Schedule next retry
    } else if (isWebSocketConnected) {
      processBuffer();
    }
  }, 2000);
}

// Clear buffer and cancel retries
function clearBuffer() {
  audioBuffer.length = 0;
  if (bufferRetryTimer) {
    clearTimeout(bufferRetryTimer);
    bufferRetryTimer = null;
  }
  console.log('[Offscreen] Buffer cleared');
}

// Initialize status
updateStatus('Offscreen document ready');

// Handle page unload
window.addEventListener('unload', () => {
  console.log('[Offscreen] Page unloading, cleaning up...');
  if (isCapturing) {
    stopAudioCapture();
  }
});

// WebSocket connection management
function connectWebSocket() {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    console.log('[Offscreen] WebSocket already connected');
    return;
  }
  
  console.log('[Offscreen] Connecting to WebSocket server:', WEBSOCKET_URL);
  updateStatus('Connecting to server...');
  
  try {
    websocket = new WebSocket(WEBSOCKET_URL);
    websocket.binaryType = 'arraybuffer';
    
    websocket.onopen = () => {
      console.log('[Offscreen] WebSocket connected');
      isWebSocketConnected = true;
      reconnectAttempts = 0; // Reset reconnect counter on successful connection
      updateStatus('Connected to server');
      
      // Send session start message as text (not binary)
      const startMessage = JSON.stringify({
        type: 'start_session',
        timestamp: new Date().toISOString()
      });
      console.log('[Offscreen] Sending start_session message:', startMessage);
      console.log('[Offscreen] WebSocket readyState:', websocket!.readyState);
      console.log('[Offscreen] WebSocket binaryType:', websocket!.binaryType);
      
      try {
        websocket!.send(startMessage);
        console.log('[Offscreen] start_session message sent successfully');
      } catch (error) {
        console.error('[Offscreen] Error sending start_session message:', error);
      }
      
      // Process any buffered data
      if (audioBuffer.length > 0) {
        console.log('[Offscreen] Processing buffered audio:', audioBuffer.length, 'chunks');
        processBuffer();
      }
    };
    
    websocket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Handle text messages from server
        try {
          const message = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (error) {
          console.error('[Offscreen] Error parsing server message:', error);
        }
      }
    };
    
    websocket.onerror = (error) => {
      console.error('[Offscreen] WebSocket error:', error);
      updateStatus('Connection error');
    };
    
    websocket.onclose = (event) => {
      console.log('[Offscreen] WebSocket closed:', event.code, event.reason);
      isWebSocketConnected = false;
      websocket = null;
      
      // Check if we should attempt reconnection
      if (isCapturing && event.code !== 1000) { // 1000 = normal closure
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = RECONNECT_DELAY * reconnectAttempts; // Progressive delay
          updateStatus(`Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          console.log(`[Offscreen] Scheduling reconnection attempt ${reconnectAttempts} in ${delay}ms`);
          
          setTimeout(() => {
            if (isCapturing) { // Still capturing, attempt reconnect
              connectWebSocket();
            }
          }, delay);
        } else {
          updateStatus('Connection lost - max retries exceeded');
          console.error('[Offscreen] Max reconnection attempts reached');
        }
      } else {
        updateStatus('Disconnected from server');
      }
    };
    
  } catch (error) {
    console.error('[Offscreen] Error creating WebSocket:', error);
    updateStatus('Failed to connect');
  }
}

// Disconnect WebSocket
function disconnectWebSocket() {
  if (websocket) {
    console.log('[Offscreen] Disconnecting WebSocket');
    
    // Send session end message if connected
    if (websocket.readyState === WebSocket.OPEN) {
      const endMessage = JSON.stringify({
        type: 'end_session',
        timestamp: new Date().toISOString()
      });
      console.log('[Offscreen] Sending end_session message:', endMessage);
      try {
        websocket.send(endMessage);
        console.log('[Offscreen] end_session message sent successfully');
      } catch (error) {
        console.error('[Offscreen] Error sending end_session message:', error);
      }
    }
    
    websocket.close(1000, 'Normal closure');
    websocket = null;
    isWebSocketConnected = false;
  }
}

// Handle messages from server
function handleServerMessage(message: any) {
  console.log('[Offscreen] Server message received:', JSON.stringify(message));
  
  switch (message.type) {
    case 'connected':
      console.log('[Offscreen] Server acknowledged connection:', message.clientId);
      break;
      
    case 'audio_received':
      console.log('[Offscreen] Server received audio:', message.chunksReceived, 'chunks,', message.bytesReceived, 'bytes');
      break;
      
    case 'pong':
      console.log('[Offscreen] Server pong received');
      break;
      
    case 'transcription_started':
      console.log('[Offscreen] Transcription started:', message.message);
      updateStatus('Transcription active');
      break;
      
    case 'transcript':
      console.log('[Offscreen] Transcript received:', message.transcript, 'Final:', message.is_final);
      // Forward transcript to side panel
      chrome.runtime.sendMessage({
        action: 'transcriptUpdate',
        transcript: message.transcript,
        isFinal: message.is_final,
        confidence: message.confidence,
        timestamp: message.timestamp
      });
      break;
      
    case 'transcription_error':
      console.error('[Offscreen] Transcription error:', message.error);
      updateStatus('Transcription error: ' + message.error);
      break;
      
    default:
      console.log('[Offscreen] Unknown server message:', message);
  }
}

