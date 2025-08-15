// index.js - Main Server File
require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const apiRoutes = require('./routes/api');
const Teacher = require('./models/Teacher');

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully.');
        // Seed initial teacher data if none exists
        seedInitialData();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
// All api routes are prefixed with /api
app.use('/api', apiRoutes);


// --- Socket.IO Real-time Setup ---
const io = new Server(server, {
    cors: {
        origin: "*", // In production, change this to your frontend's URL
        methods: ["GET", "POST"]
    }
});

// Make `io` accessible to our routes
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


// --- Server Initialization ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server with real-time support is running on http://localhost:${PORT}`);
});


// --- Initial Data Seeding ---
async function seedInitialData() {
    try {
        const teacherCount = await Teacher.countDocuments();
        if (teacherCount === 0) {
            console.log('No teachers found. Seeding initial teacher data...');
            const initialTeachers = [
                { id: 'T01', name: 'Mudit Jain', subject: 'Mathematics', pin: '1234', section: '12A', isFeeManager: true },
                { id: 'T02', name: 'Hardik Sharma', subject: 'Physics', pin: '5678', section: '12A', isFeeManager: false },
                { id: 'T03', name: 'Rajesh Kumar', subject: 'History', pin: '1111', section: '12B', isFeeManager: true },
                { id: 'T04', name: 'Ananya Singh', subject: 'English', pin: '2222', section: '12B', isFeeManager: false }
            ];
            await Teacher.insertMany(initialTeachers);
            console.log('Initial teacher data seeded successfully.');
        }
    } catch (error) {
        console.error('Error seeding initial data:', error);
    }
}
