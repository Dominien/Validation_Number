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
        try {
            const response = await axios.get(apiUrl);

            // Check if the response is valid
            if (response.status === 200 && response.data) {
                res.status(200).json(response.data); // Return the Abstract API response
            } else {
                console.error('Unexpected API response:', response.status, response.data);
                res.status(502).json({ error: 'Unexpected API response' });
            }
        } catch (axiosError) {
            // Handle specific axios errors
            if (axiosError.response) {
                // Server responded with a status outside of the 2xx range
                console.error('API Error Response:', axiosError.response.status, axiosError.response.data);
                res.status(axiosError.response.status).json({
                    error: 'Error from API',
                    details: axiosError.response.data,
                });
            } else if (axiosError.request) {
                // Request was made but no response received
                console.error('No response received from API:', axiosError.request);
                res.status(504).json({ error: 'No response received from API' });
            } else {
                // Error during setup or another issue
                console.error('Error setting up API request:', axiosError.message);
                res.status(500).json({ error: 'Error setting up API request', details: axiosError.message });
            }
        }
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*'); // Ensure CORS for all responses
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
