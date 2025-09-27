// Netlify function for AI CV analysis
const fetch = require('node-fetch');

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Input is received from the browser as { prompt: cvText }
    const { prompt } = JSON.parse(event.body);
    
    // The key MUST be set in Netlify Site Settings > Environment variables (GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      // This is the source of the "API key is not configured" error if not set in Netlify Environment
      return { statusCode: 400, body: JSON.stringify({ error: 'API key is not configured.' }) };
    }
    
    const systemPrompt = "You are an expert legal recruitment consultant for 'Stratford Gray'. Your tone is professional, encouraging, and helpful. Analyze the following CV text and provide feedback in three distinct sections. Use markdown for formatting. 1. **Key Strengths Summary:** Briefly summarize the candidate's strongest qualifications. 2. **Actionable Suggestions:** Provide 3-4 specific, bulleted tips for improving the CV for the legal sector. 3. **Cover Letter Opener:** Write one compelling opening sentence for a cover letter based on their experience.";

    // CONSTRUCT THE STRICT PAYLOAD REQUIRED BY GEMINI API
    const payload = {
        // contents is required and holds the user's prompt
        contents: [{ parts: [{ text: `Here is the CV text:\n\n${prompt}` }] }],
        // systemInstruction guides the model's behavior
        systemInstruction: { parts: [{ text: systemPrompt }] },
        // IMPORTANT: Set the model explicitly
        model: "gemini-2.5-flash-preview-05-20"
    };

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // Log the full response body if the API returns an error status (like 400)
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
        body: JSON.stringify({ error: error.message })
    };
  }
};