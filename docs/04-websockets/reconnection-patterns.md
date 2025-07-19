# WebSocket Reconnection Patterns

## Exponential Backoff Strategy

```javascript
class ReconnectingWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.maxRetries = options.maxRetries || 10;
    this.retryDelay = options.retryDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.retryCount = 0;
    this.ws = null;
    this.reconnectTimer = null;

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      this.scheduleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.retryCount = 0; // Reset on successful connection
      this.onOpen?.();
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code);
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
      this.onClose?.(event);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      this.onMessage?.(event);
    };
  }

  scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.error("Max reconnection attempts reached");
      return;
    }

    const delay = Math.min(
      this.retryDelay * Math.pow(2, this.retryCount),
      this.maxDelay
    );

    this.retryCount++;
    console.log(`Reconnecting in ${delay}ms (attempt ${this.retryCount})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn("WebSocket not connected, message queued");
      // Implement message queuing here if needed
    }
  }

  close() {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
```

## Heartbeat Pattern

```javascript
class HeartbeatWebSocket {
  constructor(url, heartbeatInterval = 30000) {
    this.url = url;
    this.heartbeatInterval = heartbeatInterval;
    this.heartbeatTimer = null;
    this.pongTimer = null;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "pong") {
        clearTimeout(this.pongTimer);
      } else {
        this.handleMessage(message);
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.scheduleReconnect();
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));

        // Expect pong within 5 seconds
        this.pongTimer = setTimeout(() => {
          console.log("Pong timeout - connection may be dead");
          this.ws.close();
        }, 5000);
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.pongTimer);
  }
}
```

## Message Queuing Pattern

```javascript
class QueuedWebSocket {
  constructor(url) {
    this.url = url;
    this.messageQueue = [];
    this.isConnected = false;
    this.connect();
  }

  send(message) {
    if (this.isConnected) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.flushQueue();
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.scheduleReconnect();
    };
  }

  flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }
}
```

## React Hook Implementation

```javascript
import { useEffect, useRef, useState } from "react";

export const useReconnectingWebSocket = (url, options = {}) => {
  const [connectionStatus, setConnectionStatus] = useState("Connecting");
  const [messageHistory, setMessageHistory] = useState([]);
  const ws = useRef(null);
  const retryCount = useRef(0);

  const connect = () => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setConnectionStatus("Connected");
        retryCount.current = 0;
      };

      ws.current.onclose = () => {
        setConnectionStatus("Disconnected");
        scheduleReconnect();
      };

      ws.current.onmessage = (event) => {
        setMessageHistory((prev) => [...prev, event.data]);
      };
    } catch (error) {
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (retryCount.current < (options.maxRetries || 10)) {
      const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
      retryCount.current++;

      setTimeout(() => {
        setConnectionStatus("Reconnecting");
        connect();
      }, delay);
    }
  };

  const sendMessage = (message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  };

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [url]);

  return { connectionStatus, messageHistory, sendMessage };
};
```

## Best Practices

- **Exponential Backoff**: Prevent server overload during outages
- **Connection Limits**: Set maximum retry attempts to avoid infinite loops
- **Visual Feedback**: Show connection status to users
- **Message Queuing**: Cache important messages during disconnections
- **Heartbeat**: Detect dead connections proactively
- **Clean Shutdown**: Properly close connections and clear timers
