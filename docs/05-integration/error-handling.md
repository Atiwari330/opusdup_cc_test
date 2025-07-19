# Error Handling

## Chrome Extension Error Handling

```javascript
// Global error handler for content scripts
window.addEventListener("error", (event) => {
  console.error("Content script error:", event.error);

  // Send error to background script
  chrome.runtime.sendMessage({
    type: "error",
    error: {
      message: event.error.message,
      stack: event.error.stack,
      url: event.filename,
      line: event.lineno,
    },
  });
});

// Background script error tracking
chrome.runtime.lastError && console.error(chrome.runtime.lastError);

// Tab capture error handling
chrome.tabCapture.capture({ audio: true }, (stream) => {
  if (chrome.runtime.lastError) {
    const errorMsg = chrome.runtime.lastError.message;
    if (errorMsg.includes("Cannot access")) {
      showUserNotification("Cannot capture audio from this tab");
    }
  }
});
```

## MediaRecorder Error Handling

```javascript
class SafeMediaRecorder {
  constructor(stream, options) {
    this.mediaRecorder = null;
    this.retryCount = 0;
    this.maxRetries = 3;

    try {
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.setupErrorHandlers();
    } catch (error) {
      this.handleRecorderError(error);
    }
  }

  setupErrorHandlers() {
    this.mediaRecorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error);
      this.handleRecorderError(event.error);
    };

    this.mediaRecorder.onstart = () => {
      this.retryCount = 0; // Reset on successful start
    };
  }

  handleRecorderError(error) {
    if (this.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.retryCount++;
        this.restart();
      }, 1000 * this.retryCount);
    } else {
      this.notifyUser("Recording failed. Please refresh and try again.");
    }
  }
}
```

## Deepgram Error Handling

```javascript
class DeepgramErrorHandler {
  constructor(client) {
    this.client = client;
    this.connection = null;
  }

  connect() {
    this.connection = this.client.listen.live({
      model: "nova-3",
      smart_format: true,
    });

    this.connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error("Deepgram error:", error);

      switch (error.type) {
        case "authentication":
          this.handleAuthError(error);
          break;
        case "connection":
          this.handleConnectionError(error);
          break;
        case "transcription":
          this.handleTranscriptionError(error);
          break;
        default:
          this.handleGenericError(error);
      }
    });

    this.connection.on(LiveTranscriptionEvents.Warning, (warning) => {
      console.warn("Deepgram warning:", warning);
    });
  }

  handleAuthError(error) {
    this.notifyUser("Authentication failed. Please check your API key.");
    this.logError("AUTH_ERROR", error);
  }

  handleConnectionError(error) {
    this.notifyUser("Connection lost. Reconnecting...");
    this.reconnect();
  }

  handleTranscriptionError(error) {
    this.logError("TRANSCRIPTION_ERROR", error);
    // Continue operation, just log the error
  }
}
```

## WebSocket Error Handling

```javascript
class RobustWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  setupEventHandlers() {
    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.handleConnectionError(error);
    };

    this.ws.onclose = (event) => {
      if (!event.wasClean) {
        this.handleUnexpectedClose(event);
      }
    };

    this.ws.onopen = () => {
      this.reconnectAttempts = 0; // Reset on successful connection
    };
  }

  handleConnectionError(error) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      this.notifyUser("Unable to connect. Please check your connection.");
    }
  }
}
```

## User Notification System

```javascript
class ErrorNotificationSystem {
  constructor() {
    this.notifications = new Map();
  }

  showError(id, message, type = "error") {
    // Remove duplicate notifications
    if (this.notifications.has(id)) {
      this.removeNotification(id);
    }

    const notification = this.createNotification(message, type);
    this.notifications.set(id, notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(id);
    }, 5000);
  }

  createNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    return notification;
  }
}
```

## Logging and Analytics

```javascript
class ErrorLogger {
  constructor() {
    this.endpoint = "/api/errors";
  }

  logError(type, error, context = {}) {
    const errorData = {
      type,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context,
    };

    // Send to analytics service
    fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorData),
    }).catch((err) => {
      console.error("Failed to log error:", err);
    });
  }
}
```

## Best Practices

- **Graceful Degradation**: Always provide fallback functionality
- **User Communication**: Show clear, actionable error messages
- **Retry Logic**: Implement exponential backoff for transient errors
- **Error Tracking**: Log errors for debugging and monitoring
- **Context Preservation**: Maintain application state during errors
