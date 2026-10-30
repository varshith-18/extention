const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");
const app = express();


app.use(express.json());
app.use(cors());
const PORT = process.env.PORT;  
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

app.post("/generate",(req, res) => {
  const prompt = req.query.prompt;
  const ask = req.query.ask;
  

  

})


app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        port: PORT
    });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app