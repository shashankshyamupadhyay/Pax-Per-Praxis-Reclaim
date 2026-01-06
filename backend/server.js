// In your backend server file (e.g., app.js or server.js)

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();

app.use(cors());

app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {
    console.log('=== Request received ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Extract the prompt from the request
    const { contents } = req.body;
    const prompt = contents[0].parts[0].text;
    console.log('Extracted prompt:', prompt);
    
    const apiKey = 'AIzaSyDSRLq_edZWBalkUpasuZZLcoWXMU-4Nmg';
    const postData = JSON.stringify(req.body);
    
    const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};
    
    console.log('Calling Google API...');
    
    const apiRequest = https.request(options, (apiResponse) => {
      let data = '';
      
      apiResponse.on('data', (chunk) => {
        data += chunk;
      });
      
      apiResponse.on('end', () => {
        console.log('Google API response status:', apiResponse.statusCode);
        
        if (apiResponse.statusCode !== 200) {
          console.error('Google API error response:', data);
          res.status(apiResponse.statusCode).json({ error: data });
        } else {
          console.log('Success! Sending response back to frontend');
          const parsedData = JSON.parse(data);
          console.log('Response preview:', JSON.stringify(parsedData).substring(0, 200));
          res.json(parsedData);
        }
      });
    });
    
    apiRequest.on('error', (error) => {
      console.error('Request error:', error);
      res.status(500).json({ error: error.message });
    });
    
    apiRequest.write(postData);
    apiRequest.end();
    
  } catch (error) {
    console.error('=== Backend error ===');
    console.error('Error details:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Waiting for requests...');
});