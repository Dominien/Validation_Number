const axios = require('axios');
require('dotenv').config();

// CORS Wrapper Function
const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with specific domains if needed
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

// Main Function
const handler = async (req, res) => {
  try {
    const apiKey = process.env.ABSTRACT_API_KEY;
    if (!apiKey) {
      console.error('Missing API Key: ABSTRACT_API_KEY is not defined.');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
    }

    const { type, value } = req.query;

    if (!type || !value) {
      console.warn(`Invalid input - Type: ${type}, Value: ${value}`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Missing type or value parameter' });
    }

    const validTypes = ['phone', 'email'];
    if (!validTypes.includes(type)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    let apiUrl;
    if (type === 'phone') {
      apiUrl = `https://phonevalidation.abstractapi.com/v1/?api_key=${apiKey}&phone=${encodeURIComponent(value)}`;
    } else if (type === 'email') {
      apiUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(value)}`;
    }

    const response = await axios.get(apiUrl);

    if (response.status === 200 && response.data) {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(response.data);
    } else {
      console.error('Unexpected API response:', response.status, response.data);
      res.setHeader('Content-Type', 'application/json');
      res.status(502).json({ error: 'Unexpected API response' });
    }
  } catch (error) {
    console.error('Error during API request:', error.message);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

module.exports = allowCors(handler);
