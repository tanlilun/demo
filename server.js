// server.js - Express implementation of the n8nui pattern
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// n8n configuration
const Hosted_URL = process.env.Hosted_URL || 'http://localhost:3000';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://rapidlab.app.n8n.cloud/webhook-test';

// Middleware
app.use(express.json());
app.use(express.static('public'));
const cors = require('cors');
app.use(cors());

// Log API calls
app.use('/api', (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// View routes
// Start page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/start.html'));
});

// Submit Page
app.post('/submit', async (req, res) => {
  try {
    const payload = req.body;

    // Send data to your n8n webhook (GET or POST depending on your flow)
    const webhookRes = await fetch(`${N8N_WEBHOOK_URL}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!webhookRes.ok) {
      console.error('Webhook failed:', await webhookRes.text());
      return res.status(500).send('Webhook call failed');
    }

    // On success, redirect or respond
    res.status(200).send('OK'); // frontend will handle redirect
  } catch (err) {
    console.error('Error in /submit:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Add this line at the top if needed
app.use(express.urlencoded({ extended: true }));

function createInMemoryApi(entityName, routeBase, dataArray) {
  // POST
  app.post(routeBase, (req, res) => {
    const data = req.body;
    dataArray.push(data);
    console.log(`📥 Received ${entityName}:`, data);
    res.redirect(`/api/${entityName}`);
  });

  // GET
  app.get(`/api/${entityName}`, (req, res) => {
    res.json(dataArray);
  });

  // DELETE
  app.delete(`/api/${entityName}`, (req, res) => {
    dataArray.length = 0;
    console.log(`🗑️ Cleared ${entityName} data.`);
    res.status(200).json({ message: `${entityName} data cleared.` });
  });
}

createInMemoryApi('captions', '/captions', captionData = []);
createInMemoryApi('images', '/images', imageData = []);
createInMemoryApi('processed-images', '/processed-images', processedImageData = []);
createInMemoryApi('linkedins', '/linkedin', linkedInData = []);
createInMemoryApi('emails', '/email', emailData = []);
createInMemoryApi('videos', '/video', videoData = []);
createInMemoryApi('social-media-templates-1', '/social-media-template-1', html1Data = []);
createInMemoryApi('social-media-templates-2', '/social-media-template-2', html2Data = []);

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// Start the server
app.listen(PORT, () => {
  console.log(`- Open ${Hosted_URL} in your browser`);
  console.log(`- n8n Webhook URL: ${N8N_WEBHOOK_URL}`);
});