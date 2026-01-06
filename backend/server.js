// 1. Load dotenv FIRST
require('dotenv').config();

console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);

const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key missing" });
    }

    const postData = JSON.stringify(req.body);

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      // 2. FIXED: Changed 2.5 to 1.5 (or 2.0-flash-exp if you have access)
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiRequest = https.request(options, (apiResponse) => {
      let data = '';

      apiResponse.on('data', chunk => data += chunk);
      apiResponse.on('end', () => {
        if (apiResponse.statusCode !== 200) {
          // Log the actual error from Google for easier debugging
          console.error("Gemini API Error:", data); 
          res.status(apiResponse.statusCode).json({ error: data });
        } else {
          res.json(JSON.parse(data));
        }
      });
    });

    apiRequest.on('error', error => {
      res.status(500).json({ error: error.message });
    });

    apiRequest.write(postData);
    apiRequest.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running 🚀 on port ${PORT}`);
});