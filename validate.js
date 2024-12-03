const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res) => {
    // Define allowed origins
    const allowedOrigins = [
        'https://marketer-ux-new.webflow.io',
        'https://www.marketer-ux.com'
    ];

    // Get the request's origin
    const origin = req.headers.origin;

    // Set CORS headers dynamically if the origin is allowed
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*'); // Fallback to allow all origins (if needed)
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).end(); // Respond with 204 for preflight and end request
        return;
    }

    try {
        const apiKey = process.env.ABSTRACT_API_KEY;
        if (!apiKey) {
            console.error('Missing API Key: ABSTRACT_API_KEY is not defined.');
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
        }

        const { type, value } = req.query;

        // Validate input
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

        // Determine the API endpoint based on the type
        let apiUrl;
        if (type === 'phone') {
            apiUrl = `https://phonevalidation.abstractapi.com/v1/?api_key=${apiKey}&phone=${encodeURIComponent(value)}`;
        } else if (type === 'email') {
            apiUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(value)}`;
        }

        // Make the API request
        try {
            const response = await axios.get(apiUrl);

            if (response.status === 200 && response.data) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(response.data); // Return the Abstract API response
            } else {
                console.error('Unexpected API response:', response.status, response.data);
                res.setHeader('Content-Type', 'application/json');
                res.status(502).json({ error: 'Unexpected API response' });
            }
        } catch (axiosError) {
            if (axiosError.response) {
                const { status, data } = axiosError.response;
                console.error(`API Error - Status: ${status}, Data:`, data);
                res.status(status).json({ error: 'API error occurred', details: data });
            } else if (axiosError.request) {
                console.error('No response received from API. Request details:', axiosError.request);
                res.status(504).json({ error: 'No response received from API.' });
            } else {
                console.error('Unexpected error during API request:', axiosError.message);
                res.status(500).json({ error: 'Unexpected error during API request.', details: axiosError.message });
            }
        }
    } catch (error) {
        console.error('Unexpected Server Error:', error.message);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
