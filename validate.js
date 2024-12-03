const axios = require('axios');

// Load environment variables
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
        const { type, value } = req.query; // Extract type (phone/email) and value from query parameters

        // Validate input
        if (!type || !value) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*'); // Ensure CORS for all responses
            return res.status(400).json({ error: 'Missing type or value parameter' });
        }

        // Determine the API endpoint based on the type
        let apiUrl;
        if (type === 'phone') {
            apiUrl = `https://phonevalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&phone=${encodeURIComponent(
                value
            )}`;
        } else if (type === 'email') {
            apiUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${encodeURIComponent(
                value
            )}`;
        } else {
            res.setHeader('Access-Control-Allow-Origin', origin || '*'); // Ensure CORS for all responses
            return res.status(400).json({ error: 'Invalid type. Must be "phone" or "email".' });
        }

        // Make the API request
        const response = await axios.get(apiUrl);

        // Return the Abstract API response
        res.status(200).json(response.data);
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*'); // Ensure CORS for all responses
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
