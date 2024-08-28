require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const authRoute = require('./routes/auth');
const notesRoute = require('./routes/notes');
const spellCheckRoutes = require('./routes/suggestion');
const connectToMongo = require('./utils/db');
const cors = require('cors');

// Simplified CORS options
const corsOption = {
    origin: "*", // Allows all origins
    methods: ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH"], // Allowed methods
    allowedHeaders: ["Content-Type", "auth-token"] // Allowed headers
};

// Apply CORS middleware
app.use(cors(corsOption));

// Handle preflight requests for all routes
app.options('*', cors(corsOption));

// Body parser middleware
app.use(bodyParser.json());
app.use(express.json());

// Available Routes
app.use('/api/auth', authRoute);
app.use('/api/notes', notesRoute);
app.use('/api', spellCheckRoutes);

// Connect to MongoDB
connectToMongo().then(()=>{
    app.listen(5000, ()=>{
        console.log("Server is running on 5000")
    })
});

module.exports = app;
