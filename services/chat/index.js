const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for testing (Postman, web, etc.)
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('message', (msg) => {
    console.log('Received message:', msg);
    setTimeout(() => {
      socket.emit('message', msg); // Echo the message back after 1 second
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// For HTTP compatibility
app.get('/messages', (req, res) => {
  // TODO: Return chat messages
  res.json({ messages: [] });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat Service running (HTTP+Socket.IO) on port ${PORT}`);
  console.log('Socket.IO endpoint: ws://localhost:3005 (if mapped)');
}); 