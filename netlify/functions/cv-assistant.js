exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY; // Securely get the key from Netlify's environment

    if (!apiKey) {
      throw new Error('API key is not configured.');
    }
    
    const systemPrompt = "You are an expert legal recruitment consultant for 'Stratford Gray'. Your tone is professional, encouraging, and helpful. Analyze the following CV text and provide feedback in three distinct sections. Use markdown for formatting. 1. **Key Strengths Summary:** Briefly summarize the candidate's strongest qualifications. 2. **Actionable Suggestions:** Provide 3-4 specific, bulleted tips for improving the CV for the legal sector. 3. **Cover Letter Opener:** Write one compelling opening sentence for a cover letter based on their experience.";

    const payload = {
        contents: [{ parts: [{ text: `Here is the CV text:\n\n${prompt}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Gemini API Error:', errorBody);
        return { statusCode: response.status, body: JSON.stringify({ error: 'Failed to fetch from Gemini API' }) };
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