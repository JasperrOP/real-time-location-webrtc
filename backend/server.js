const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(express.json());

// Auth Routes
app.use('/api/auth', require('./routes/authRoutes')); 

app.use('/api/rooms', require('./routes/roomRoutes'));

app.get('/', (req, res) => {
    res.send('Real-Time Location API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
});
