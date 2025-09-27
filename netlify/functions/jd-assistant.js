// Netlify function for AI Job Description generation
const fetch = require('node-fetch');

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, details } = JSON.parse(event.body);
    // The key MUST be set in Netlify Site Settings > Environment variables
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      // Return a helpful error if the key isn't found
      return { statusCode: 400, body: JSON.stringify({ error: 'API key is not configured.' }) };
    }
    
    const systemPrompt = "You are an expert legal recruitment copywriter for 'Stratford Gray'. Your tone is professional, engaging, and authoritative. Create a full job description based on the provided title and key responsibilities. The description must be well-structured with the following markdown sections: **The Role**, **Key Responsibilities**, **The Ideal Candidate**, and **What We Offer**. Ensure the language is inclusive and compelling to attract top-tier legal professionals.";

    const payload = {
        contents: [{ parts: [{ text: `Job Title: ${title}\n\nKey Details: ${details}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // Log the full response status if the API call itself fails
        const errorBody = await response.text();
        console.error('Gemini API Error Status:', response.status);
        console.error('Gemini API Error Body:', errorBody);
        return { statusCode: response.status, body: JSON.stringify({ error: 'Gemini API call failed.' }) };
    }

    const data = await response.json();

    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function Error:', error);
    return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
    };
  }
};
