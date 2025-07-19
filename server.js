// Custom Next.js server with WebSocket support for real-time audio streaming
// This server handles both HTTP requests and WebSocket connections

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app instance
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// WebSocket clients management
const wsClients = new Map(); // Map of client ID to WebSocket connection
let clientIdCounter = 0;

// Initialize Deepgram client
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
let deepgramClient = null;

if (deepgramApiKey) {
  console.log('[Server] Deepgram API key found, length:', deepgramApiKey.length);
  console.log('[Server] API key starts with:', deepgramApiKey.substring(0, 8) + '...');
  
  try {
    deepgramClient = createClient(deepgramApiKey);
    console.log('[Server] Deepgram client initialized');
    
    // Test the API key with a simple request
    deepgramClient.manage.getProjects()
      .then(response => {
        const projects = response.result?.projects || response.projects || [];
        console.log('[Server] Deepgram API key verified - Projects found:', projects.length);
        if (projects.length > 0) {
          console.log('[Server] First project ID:', projects[0].project_id);
          console.log('[Server] Project name:', projects[0].name);
        }
      })
      .catch(err => {
        console.error('[Server] Deepgram API key verification failed:', err.message);
        if (err.status) {
          console.error('[Server] Status code:', err.status);
        }
      });
  } catch (error) {
    console.error('[Server] Failed to create Deepgram client:', error);
  }
} else {
  console.warn('[Server] No DEEPGRAM_API_KEY found in environment variables');
}

console.log('[Server] Starting custom Next.js server with WebSocket support...');

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('[Server] Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Create WebSocket server
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws/transcription',
    // Configure for binary data
    perMessageDeflate: false, // Disable compression for real-time audio
  });

  // WebSocket connection handler
  wss.on('connection', (ws, req) => {
    const clientId = ++clientIdCounter;
    console.log(`[WebSocket] Client ${clientId} connected from ${req.socket.remoteAddress}`);
    
    // Configure WebSocket for binary data
    ws.binaryType = 'arraybuffer';
    
    let deepgramConnection = null;
    
    // Store client connection
    wsClients.set(clientId, {
      ws: ws,
      connectedAt: new Date(),
      audioChunksReceived: 0,
      bytesReceived: 0,
      deepgramConnection: null,
      keepAliveInterval: null
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId: clientId,
      message: 'WebSocket connection established'
    }));

    // Handle incoming messages
    ws.on('message', (data, isBinary) => {
      console.log(`[WebSocket] Client ${clientId} - Message received, isBinary: ${isBinary}, data type: ${typeof data}, size: ${data.length || data.byteLength || 0}`);
      
      if (isBinary) {
        // Handle binary audio data
        console.log(`[WebSocket] Client ${clientId} - Processing as binary audio data`);
        handleBinaryAudioData(clientId, data);
      } else {
        // Handle text messages (control messages)
        console.log(`[WebSocket] Client ${clientId} - Processing as text message`);
        try {
          const textData = data.toString();
          console.log(`[WebSocket] Client ${clientId} - Text message content:`, textData);
          const message = JSON.parse(textData);
          console.log(`[WebSocket] Client ${clientId} - Parsed message type:`, message.type);
          handleControlMessage(clientId, message);
        } catch (error) {
          console.error(`[WebSocket] Client ${clientId} - Invalid JSON message:`, error);
          console.error(`[WebSocket] Client ${clientId} - Raw data:`, data.toString());
        }
      }
    });

    // Handle ping/pong for keepalive
    ws.on('ping', () => {
      console.log(`[WebSocket] Client ${clientId} - Ping received`);
      ws.pong();
    });

    // Handle client disconnect
    ws.on('close', (code, reason) => {
      console.log(`[WebSocket] Client ${clientId} disconnected - Code: ${code}, Reason: ${reason}`);
      cleanupClient(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocket] Client ${clientId} - Error:`, error);
    });
  });

  // Handle binary audio data
  function handleBinaryAudioData(clientId, data) {
    const client = wsClients.get(clientId);
    if (!client) return;

    // Check for empty data (causes Deepgram to close connection)
    if (!data || data.byteLength === 0) {
      console.warn(`[WebSocket] Client ${clientId} - Received empty audio chunk, skipping`);
      return;
    }
    
    // Log first few bytes to check if audio is not silent
    const view = new Uint8Array(data);
    const firstBytes = Array.from(view.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    console.log(`[WebSocket] Client ${clientId} - First 10 bytes: ${firstBytes}`);

    // Update statistics
    client.audioChunksReceived++;
    client.bytesReceived += data.byteLength;

    console.log(`[WebSocket] Client ${clientId} - Audio chunk received: ${data.byteLength} bytes (Total: ${client.audioChunksReceived} chunks, ${client.bytesReceived} bytes)`);

    // Forward to Deepgram if connection exists
    if (client.deepgramConnection) {
      const readyState = client.deepgramConnection.getReadyState();
      console.log(`[WebSocket] Client ${clientId} - Deepgram connection ready state:`, readyState);
      
      if (readyState === 1) {
        console.log(`[WebSocket] Client ${clientId} - Sending audio to Deepgram, ${data.byteLength || data.length} bytes`);
        try {
          // The ws library gives us a Buffer in Node.js, which Deepgram SDK can handle
          client.deepgramConnection.send(data);
          console.log(`[WebSocket] Client ${clientId} - Audio sent to Deepgram successfully`);
        } catch (error) {
          console.error(`[WebSocket] Client ${clientId} - Error sending to Deepgram:`, error);
        }
      } else {
        console.warn(`[WebSocket] Client ${clientId} - Deepgram not ready, state:`, readyState);
      }
    } else {
      console.log(`[WebSocket] Client ${clientId} - No Deepgram connection available`);
    }
    
    // Acknowledge receipt periodically
    if (client.audioChunksReceived % 10 === 0) { // Every 10 chunks
      client.ws.send(JSON.stringify({
        type: 'audio_received',
        chunksReceived: client.audioChunksReceived,
        bytesReceived: client.bytesReceived
      }));
    }
  }

  // Handle control messages
  function handleControlMessage(clientId, message) {
    console.log(`[WebSocket] Client ${clientId} - Control message received:`, JSON.stringify(message));

    switch (message.type) {
      case 'ping':
        // Respond to ping
        const client = wsClients.get(clientId);
        if (client) {
          client.ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;

      case 'start_session':
        // Initialize new transcription session
        console.log(`[WebSocket] Client ${clientId} - Starting transcription session at`, message.timestamp);
        console.log(`[WebSocket] Client ${clientId} - Calling initializeDeepgramConnection`);
        initializeDeepgramConnection(clientId);
        break;

      case 'end_session':
        // End transcription session
        console.log(`[WebSocket] Client ${clientId} - Ending transcription session`);
        const endClient = wsClients.get(clientId);
        if (endClient && endClient.deepgramConnection) {
          // Send CloseStream message before finishing
          try {
            const closeMsg = JSON.stringify({ type: 'CloseStream' });
            endClient.deepgramConnection.send(closeMsg);
          } catch (err) {
            console.log(`[WebSocket] Client ${clientId} - Error sending CloseStream:`, err.message);
          }
          endClient.deepgramConnection.finish();
          endClient.deepgramConnection = null;
        }
        break;

      default:
        console.warn(`[WebSocket] Client ${clientId} - Unknown message type:`, message.type);
    }
  }

  // Initialize Deepgram connection for a client
  function initializeDeepgramConnection(clientId) {
    console.log(`[Deepgram] initializeDeepgramConnection called for client ${clientId}`);
    
    const client = wsClients.get(clientId);
    console.log(`[Deepgram] Client exists:`, !!client);
    console.log(`[Deepgram] deepgramClient exists:`, !!deepgramClient);
    console.log(`[Deepgram] DEEPGRAM_API_KEY exists:`, !!process.env.DEEPGRAM_API_KEY);
    
    if (!client) {
      console.error(`[Deepgram] Client ${clientId} not found in wsClients map`);
      return;
    }
    
    if (!deepgramClient) {
      console.error(`[Deepgram] deepgramClient is null - API key issue?`);
      return;
    }

    try {
      console.log(`[Deepgram] Creating live transcription connection for client ${clientId}`);
      
      // For containerized audio (WebM), don't specify encoding/sample_rate
      console.log(`[Deepgram] Using containerized audio config (WebM)`);
      
      const connection = deepgramClient.listen.live({
        model: 'nova-2',  // Using nova-2 for now (nova-3 may require different API access)
        language: 'en-US',
        smart_format: true,  // Important for containerized audio!
        container: 'webm',   // Explicitly specify WebM container
        punctuate: true,
        interim_results: true,
        utterance_end_ms: 1000,  // Detect end of utterance after 1 second of silence
        endpointing: 300  // Detect speech pauses after 300ms
        // No encoding/sample_rate for containerized audio!
      });

      // Set up event handlers before opening connection
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log(`[Deepgram] Connection opened for client ${clientId}`);
        console.log(`[Deepgram] Connection state after open:`, connection.getReadyState());
        
        // Start keep-alive messages every 3 seconds
        client.keepAliveInterval = setInterval(() => {
          if (connection.getReadyState() === 1) {
            const keepAlive = JSON.stringify({ type: 'KeepAlive' });
            console.log(`[Deepgram] Sending keep-alive for client ${clientId}`);
            connection.send(keepAlive);
          }
        }, 3000);
        
        client.ws.send(JSON.stringify({
          type: 'transcription_started',
          message: 'Deepgram connection established'
        }));
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        console.log(`[Deepgram] Transcript event received for client ${clientId}`);
        
        const transcript = data.channel.alternatives[0].transcript;
        const isFinal = data.is_final;
        const speechFinal = data.speech_final;
        
        // Only log non-empty transcripts or final results
        if (transcript || isFinal) {
          console.log(`[Deepgram] Transcript: "${transcript}" (is_final: ${isFinal}, speech_final: ${speechFinal})`);
        }
        
        // Forward transcription to client with all flags
        const transcriptMessage = {
          type: 'transcript',
          transcript: transcript,
          is_final: isFinal,
          speech_final: speechFinal,  // Include speech_final flag
          confidence: data.channel.alternatives[0].confidence,
          timestamp: new Date().toISOString()
        };
        
        client.ws.send(JSON.stringify(transcriptMessage));
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error(`[Deepgram] Error for client ${clientId}:`, error);
        console.error(`[Deepgram] Error details:`, JSON.stringify(error));
        client.ws.send(JSON.stringify({
          type: 'transcription_error',
          error: error.message
        }));
      });
      
      // Add metadata event handler
      connection.on(LiveTranscriptionEvents.Metadata, (data) => {
        console.log(`[Deepgram] Metadata received for client ${clientId}:`, JSON.stringify(data));
        client.ws.send(JSON.stringify({
          type: 'metadata',
          metadata: data
        }));
      });
      
      // Add utterance end handler  
      connection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
        console.log(`[Deepgram] Utterance end for client ${clientId}`);
        // Send utterance end event to client
        client.ws.send(JSON.stringify({
          type: 'utterance_end',
          timestamp: new Date().toISOString()
        }));
      });

      connection.on(LiveTranscriptionEvents.Close, (code, reason) => {
        console.log(`[Deepgram] Connection closed for client ${clientId}, code: ${code}, reason: ${reason}`);
        
        // Clear keep-alive interval when connection closes
        if (client.keepAliveInterval) {
          clearInterval(client.keepAliveInterval);
          client.keepAliveInterval = null;
        }
      });

      // Store the connection
      client.deepgramConnection = connection;
      console.log(`[Deepgram] Connection stored for client ${clientId}, ready state:`, connection.getReadyState());
      
      // Ensure all event handlers are set up before any errors can occur
      console.log(`[Deepgram] All event handlers configured for client ${clientId}`);
      
    } catch (error) {
      console.error(`[Deepgram] Failed to initialize for client ${clientId}:`, error);
      console.error(`[Deepgram] Error stack:`, error.stack);
      client.ws.send(JSON.stringify({
        type: 'transcription_error',
        error: 'Failed to initialize transcription service'
      }));
    }
  }

  // Cleanup client resources
  function cleanupClient(clientId) {
    const client = wsClients.get(clientId);
    if (client) {
      console.log(`[WebSocket] Cleaning up client ${clientId} - Received ${client.audioChunksReceived} chunks, ${client.bytesReceived} bytes`);
      
      // Clear keep-alive interval
      if (client.keepAliveInterval) {
        clearInterval(client.keepAliveInterval);
      }
      
      // Close Deepgram connection if exists
      if (client.deepgramConnection) {
        client.deepgramConnection.finish();
      }
      
      wsClients.delete(clientId);
    }
  }

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`[Server] Ready on http://${hostname}:${port}`);
    console.log(`[Server] WebSocket endpoint: ws://${hostname}:${port}/ws/transcription`);
    console.log(`[Server] Environment: ${dev ? 'development' : 'production'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM signal received: closing HTTP server');
    
    // Close all WebSocket connections
    wsClients.forEach((client, clientId) => {
      console.log(`[Server] Closing WebSocket connection for client ${clientId}`);
      client.ws.close(1001, 'Server shutting down');
    });
    
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  });
});