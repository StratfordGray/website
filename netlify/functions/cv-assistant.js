// Netlify function for AI CV analysis
const fetch = require('node-fetch');

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Request body is empty. Please provide CV text.' }) };
    }
    const { prompt } = JSON.parse(event.body);
    
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'API key is not configured.' }) };
    }
    
    if (!prompt || prompt.trim().length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'CV prompt content is missing or too short.' }) };
    }
    
    const systemPrompt = "You are an expert legal recruitment consultant for 'Stratford Gray'. Your tone is professional, encouraging, and helpful. Analyze the following CV text and provide feedback in three distinct sections. Use markdown for formatting. 1. **Key Strengths Summary:** Briefly summarize the candidate's strongest qualifications. 2. **Actionable Suggestions:** Provide 3-4 specific, bulleted tips for improving the CV for the legal sector. 3. **Cover Letter Opener:** Write one compelling opening sentence for a cover letter based on their experience.";

    const payload = {
        contents: [{ parts: [{ text: `Here is the CV text:\n\n${prompt}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        model: "gemini-2.5-flash-preview-05-20" 
    };

    // --- CRITICAL LOGGING ADDED HERE ---
    console.log("Gemini API Payload being sent:", JSON.stringify(payload, null, 2));
    // ---

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
