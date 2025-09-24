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
    const body = JSON.parse(event.body); // Parse the raw request body as JSON
    const prompt = body.prompt; // Access the 'prompt' property

    // Check if the required 'prompt' property is present.
    if (!prompt) {
      return {
        statusCode: 400, // Bad Request
        body: "Missing 'prompt' in request body"
      };
    }

    //
    //... rest of your API logic using the 'prompt' value
    //

    // Return a successful response.
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success", data: "your processed data here" })
    };

  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 400, // Bad Request
      body: "Invalid JSON format in request body"
    };
  }
};