exports.handler = async function(event, context) {
  // Ensure the request is a POST method.
  if (event.httpMethod!== "POST") {
    return {
      statusCode: 405, // Method Not Allowed
      body: "Method Not Allowed"
    };
  }

  // Use a try...catch block to handle potential JSON parsing errors.
  try {
    // The event.body is the raw request body. You must parse it as JSON.
    const body = JSON.parse(event.body);
    const prompt = body.prompt;

    // Check if the required 'prompt' property is present.
    if (!prompt) {
      return {
        statusCode: 400, // Bad Request
        body: "Missing 'prompt' in request body"
      };
    }

    // This is the correct, full API endpoint path for the Gemini API.
    const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    // Make a secure API call to the Gemini service.
    // The API key is retrieved from a Netlify environment variable.
    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY // Use an environment variable for security
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    // Check if the response from the Gemini API was successful.
    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the generated text from the Gemini response.
    const generatedText = data.candidates?.?.content?.parts?.?.text |

| "No content generated.";

    // Return a successful response to the client.
    return {
      statusCode: 200,
      body: JSON.stringify({ response: generatedText })
    };

  } catch (error) {
    console.error("Error processing request:", error);
    // Return a generic 400 Bad Request if parsing fails or a 500 Internal Server Error for other issues.
    return {
      statusCode: 500,
      body: `Internal Server Error: ${error.message}`
    };
  }
};