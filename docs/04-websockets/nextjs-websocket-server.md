# Next.js WebSocket Server

## Custom Server Setup (Required for WebSockets)

WebSockets require a persistent server - serverless functions don't support WebSocket connections.

```javascript
// server.js (root directory)
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", (data) => {
      socket.broadcast.emit("message", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  httpServer.listen(3000, () => {
    console.log("Server running on port 3000");
  });
});
```

## API Route WebSocket Handler

```javascript
// pages/api/socket.js
import { Server } from "socket.io";

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log("Starting Socket.IO server...");

    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      socket.on("audio-stream", (data) => {
        // Forward audio data to other clients
        socket.broadcast.emit("audio-data", data);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default SocketHandler;
```

## Client-Side Connection

```javascript
// hooks/useWebSocket.js
import { useEffect, useState } from "react";
import io from "socket.io-client";

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize connection only on client side
    if (typeof window !== "undefined") {
      const newSocket = io("/api/socket");
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, []);

  return socket;
};
```

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

## Deployment Notes

- Cannot deploy on Vercel (no WebSocket support)
- Use containerized services: AWS Fargate, Railway, Render
- Works with `next start` and standalone output mode
- Requires persistent server infrastructure
