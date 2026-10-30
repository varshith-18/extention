const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");
const app = express();
const port = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        port: port
    });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app