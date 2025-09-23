// Function to handle CORS headers
const addCorsHeaders = (response) => {
  response.headers['Access-Control-Allow-Origin'] = '*';
  response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
  return response;
};

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      body: JSON.stringify({ message: "CORS Preflight Check Succeeded" }),
    };
  }

  // Securely retrieve the API key from environment variables
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error: API key missing." }),
    };
  }

  // Construct the request body from the client's request
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON format." }),
    };
  }

  // Construct the secure, server-side request to the external API
  const externalApiUrl = 'https://api.external-ai-service.com/v1/endpoint'; // Replace with the actual external API URL
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  };

  try {
    const response = await fetch(externalApiUrl, requestOptions);
    const data = await response.json();

    const finalResponse = {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    return addCorsHeaders(finalResponse);
  } catch (apiError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `API call failed: ${apiError.message}` }),
    };
  }
};