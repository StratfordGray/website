// Netlify function for AI Job Description generation
const fetch = require('node-fetch');

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- START FIX for "Unexpected end of JSON input" ---
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Request body is empty. Please provide job details.' }) };
    }
    const { title, details } = JSON.parse(event.body);
    // --- END FIX ---
    
    // The key MUST be set in Netlify Site Settings > Environment variables (GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'API key is not configured.' }) };
    }
    
    // Check if fields themselves are empty (should be handled by front-end but safe here)
    if (!title || title.trim().length === 0 || !details || details.trim().length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Job title or key details are missing.' }) };
    }
    
    const systemPrompt = "You are an expert legal recruitment copywriter for 'Stratford Gray'. Your tone is professional, engaging, and authoritative. Create a full job description based on the provided title and key responsibilities. The description must be well-structured with the following markdown sections: **The Role**, **Key Responsibilities**, **The Ideal Candidate**, and **What We Offer**. Ensure the language is inclusive and compelling to attract top-tier legal professionals.";

    const payload = {
        contents: [{ parts: [{ text: `Job Title: ${title}\n\nKey Details: ${details}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        model: "gemini-2.5-flash-preview-05-20"
    };

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Gemini API Error Status:', response.status);
        console.error('Gemini API Error Body:', errorBody);
        return { statusCode: response.status, body: JSON.stringify({ error: `Gemini API call failed with status ${response.status}.` }) };
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
        body: JSON.stringify({ error: `Server Error: ${error.message}` })
    };
  }
};