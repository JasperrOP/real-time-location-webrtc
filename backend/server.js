const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); 
const { Server } = require('socket.io'); 

dotenv.config();
connectDB();

const app = express();

const server = http.createServer(app); 

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Replace app.use(cors()); with:
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://real-time-location-webrtc.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));

// <-- NEW: A temporary memory bank to track who is on which socket
const socketUserMap = {}; 

io.on('connection', (socket) => {
    console.log(`🔌 New WebSocket Connection: ${socket.id}`);

    // 1. User joins Map Room (Tracking Only - NO PeerID here anymore!)
    socket.on('join-room', ({ roomCode, user }) => {
        socket.join(roomCode);
        socketUserMap[socket.id] = { roomCode, userId: user._id }; 
        console.log(`👤 ${user.name} joined tracking room: ${roomCode}`);
        socket.to(roomCode).emit('user-joined', user);
    });

    // 2. User moves on the map
    socket.on('location-update', ({ roomCode, user, location }) => {
        socket.to(roomCode).emit('receive-location', { user, location });
    });

    // 3. User sends a text chat
    socket.on('send-chat', ({ roomCode, user, text }) => {
        socket.to(roomCode).emit('receive-chat', { user, text, id: Date.now() });
    });

    // 4. User actively clicks "Join Video"
    socket.on('join-video-call', ({ roomCode, user, peerId }) => {
        console.log(`🎥 ${user.name} activated video.`);
        socket.to(roomCode).emit('user-joined-video', { user, peerId });
    });

    // 5. User actively clicks "Leave Video"
    socket.on('leave-video-call', ({ roomCode, userId }) => {
        socket.to(roomCode).emit('user-left-video', userId);
    });

    // 6. User closes tab / loses connection
    socket.on('disconnect', () => {
        const userData = socketUserMap[socket.id]; 
        if (userData) {
            io.to(userData.roomCode).emit('user-disconnected', userData.userId);
            delete socketUserMap[socket.id]; 
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
});