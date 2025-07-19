# Security Best Practices

## Chrome Extension Security

```javascript
// Manifest V3 security configuration
{
  "manifest_version": 3,
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  },
  "permissions": [
    "activeTab",  // Only request necessary permissions
    "tabs"
  ],
  "host_permissions": [
    "https://api.deepgram.com/*"  // Restrict to specific domains
  ]
}

// Secure message passing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender
  if (!sender.tab) {
    console.error('Message not from tab');
    return;
  }

  // Validate message structure
  if (!isValidMessage(message)) {
    console.error('Invalid message format');
    return;
  }

  // Process message
  handleSecureMessage(message, sendResponse);
});

function isValidMessage(message) {
  return message &&
         typeof message.type === 'string' &&
         message.type.length < 50; // Prevent abuse
}
```

## WebSocket Security (WSS)

```javascript
class SecureWebSocket {
  constructor(url, apiKey) {
    // Always use WSS (WebSocket Secure)
    if (!url.startsWith("wss://")) {
      throw new Error("Only secure WebSocket connections allowed");
    }

    this.url = url;
    this.apiKey = apiKey;
    this.ws = null;
    this.isAuthenticated = false;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.authenticate();
    };

    this.ws.onmessage = (event) => {
      if (!this.isAuthenticated) {
        console.error("Received message before authentication");
        return;
      }
      this.handleSecureMessage(event.data);
    };
  }

  authenticate() {
    // Use ticket-based authentication
    const authTicket = this.generateAuthTicket();
    this.ws.send(
      JSON.stringify({
        type: "auth",
        ticket: authTicket,
      })
    );
  }

  generateAuthTicket() {
    // Generate secure, time-limited ticket
    const timestamp = Date.now();
    const nonce = this.generateNonce();

    return {
      apiKey: this.apiKey,
      timestamp,
      nonce,
      signature: this.createSignature(timestamp, nonce),
    };
  }
}
```

## Input Validation and Sanitization

```javascript
class SecurityValidator {
  static validateAudioData(data) {
    // Check data type
    if (!(data instanceof ArrayBuffer || data instanceof Blob)) {
      throw new Error("Invalid audio data type");
    }

    // Check size limits (prevent DoS)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (data.size > maxSize) {
      throw new Error("Audio data too large");
    }

    return true;
  }

  static sanitizeMessage(message) {
    if (typeof message !== "object") {
      throw new Error("Message must be object");
    }

    // Remove dangerous properties
    const sanitized = {};
    const allowedKeys = ["type", "data", "timestamp", "id"];

    for (const key of allowedKeys) {
      if (message.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeValue(message[key]);
      }
    }

    return sanitized;
  }

  static sanitizeValue(value) {
    if (typeof value === "string") {
      // Remove HTML and script tags
      return value.replace(/<[^>]*>/g, "").substring(0, 1000);
    }
    return value;
  }
}
```

## API Key Protection

```javascript
// Environment-based configuration
const getApiKey = () => {
  // Never hardcode API keys
  if (process.env.NODE_ENV === "development") {
    return process.env.DEEPGRAM_API_KEY_DEV;
  }
  return process.env.DEEPGRAM_API_KEY_PROD;
};

// Secure API key storage in extension
class SecureStorage {
  static async storeApiKey(apiKey) {
    // Store in chrome.storage.local (encrypted by Chrome)
    await chrome.storage.local.set({
      apiKey: await this.encrypt(apiKey),
    });
  }

  static async getApiKey() {
    const { apiKey } = await chrome.storage.local.get("apiKey");
    return apiKey ? await this.decrypt(apiKey) : null;
  }

  static async encrypt(data) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(data)
    );

    return { encrypted, iv, key };
  }
}
```

## CORS and Origin Validation

```javascript
// Server-side origin validation
const validateOrigin = (origin) => {
  const allowedOrigins = [
    "https://yourdomain.com",
    "chrome-extension://your-extension-id",
  ];

  return allowedOrigins.includes(origin);
};

// WebSocket connection with origin check
const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: (info) => {
    const origin = info.origin;

    if (!validateOrigin(origin)) {
      console.error("Unauthorized origin:", origin);
      return false;
    }

    return true;
  },
});
```

## Content Security Policy (CSP)

```html
<!-- Strict CSP for web application -->
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  connect-src 'self' wss://api.deepgram.com;
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  media-src 'self' blob:;
"
/>
```

## Rate Limiting and DoS Protection

```javascript
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old requests
    if (this.requests.has(identifier)) {
      const requests = this.requests
        .get(identifier)
        .filter((time) => time > windowStart);
      this.requests.set(identifier, requests);
    }

    const currentRequests = this.requests.get(identifier) || [];

    if (currentRequests.length >= this.maxRequests) {
      return false;
    }

    currentRequests.push(now);
    this.requests.set(identifier, currentRequests);
    return true;
  }
}

// Usage in WebSocket server
const rateLimiter = new RateLimiter();

wss.on("connection", (ws, req) => {
  const clientIP = req.connection.remoteAddress;

  ws.on("message", (data) => {
    if (!rateLimiter.isAllowed(clientIP)) {
      ws.close(1008, "Rate limit exceeded");
      return;
    }

    // Process message
  });
});
```

## Data Privacy and Encryption

```javascript
class DataProtection {
  static async encryptSensitiveData(data) {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(JSON.stringify(data))
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      key: await crypto.subtle.exportKey("raw", key),
    };
  }

  static sanitizeAudioMetadata(audioData) {
    // Remove potentially sensitive metadata
    return {
      duration: audioData.duration,
      size: audioData.size,
      type: audioData.type,
      // Exclude: location, device info, etc.
    };
  }
}
```

## Authentication Token Management

```javascript
class TokenManager {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.expiryTime = null;
  }

  async getValidToken() {
    if (!this.token || this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    return this.token;
  }

  isTokenExpired() {
    return Date.now() >= this.expiryTime - 60000; // Refresh 1 min early
  }

  async refreshAccessToken() {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();
      this.token = data.accessToken;
      this.expiryTime = Date.now() + data.expiresIn * 1000;
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  }
}
```

## Security Checklist

- ✅ **Use HTTPS/WSS**: Always encrypt data in transit
- ✅ **Validate Input**: Sanitize all user input and API responses
- ✅ **Restrict Permissions**: Request minimal necessary permissions
- ✅ **Implement CSP**: Use strict Content Security Policy
- ✅ **Rate Limiting**: Prevent DoS attacks with rate limits
- ✅ **Token Management**: Use short-lived, renewable tokens
- ✅ **Origin Validation**: Verify request origins
- ✅ **Error Handling**: Don't leak sensitive info in errors
- ✅ **Audit Logs**: Log security events for monitoring
