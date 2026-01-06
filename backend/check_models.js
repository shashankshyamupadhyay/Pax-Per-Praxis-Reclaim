// check_models.js
require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ No API Key found in .env");
  process.exit(1);
}

console.log("🔍 Checking available models...");

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.error) {
      console.error("❌ API Error:", response.error.message);
    } else {
      console.log("✅ AVAILABLE MODELS:");
      // Filter for 'generateContent' support
      const models = response.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace("models/", "")); // Clean up the name
      
      console.log(models.join("\n"));
      console.log("\n👉 PICK ONE FROM ABOVE AND PUT IT IN SERVER.JS");
    }
  });
}).on('error', (e) => {
  console.error("❌ Network Error:", e.message);
});