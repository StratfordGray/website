// Netlify function to fetch job data from Airtable
const fetch = require('node-fetch');

// --- CRITICAL: Replace 'Jobs' with the EXACT name of your Airtable Table (sheet) ---
const AIRTABLE_TABLE_NAME = "Jobs"; 

exports.handler = async function (event) {
  // Only allow GET requests for fetching data
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // FIX: Using the new AIRTABLE_TOKEN environment variable
    const airtableToken = process.env.AIRTABLE_TOKEN; 
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!airtableToken || !baseId) {
      console.error("Airtable keys/tokens are not configured!");
      return { statusCode: 500, body: JSON.stringify({ error: 'Airtable token or Base ID is missing.' }) };
    }
    
    // Construct the Airtable API URL
    const airtableUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?view=Grid%20view`;

    const response = await fetch(airtableUrl, {
      method: 'GET',
      headers: {
        // FIX: Authorization header now uses 'Bearer' prefix as required by Personal Access Tokens
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Airtable API Error Status:', response.status);
        console.error('Airtable API Error Body:', errorBody);
        return { statusCode: response.status, body: JSON.stringify({ error: 'Failed to fetch jobs from Airtable.' }) };
    }

    const data = await response.json();
    
    // Process the data into the simple format your front-end expects
    const formattedJobs = data.records.map(record => ({
      // Note: Airtable fields must be named exactly: Title, Location, Salary Range, Short Description, Long Description
      id: record.id,
      title: record.fields['Title'] || 'No Title', 
      location: record.fields['Location'] || 'Remote',
      salary: record.fields['Salary Range'] || 'Competitive',
      shortDesc: record.fields['Short Description'] || 'A new opportunity.',
      longDesc: record.fields['Long Description'] || 'Details coming soon.',
    })).filter(job => job.title && job.location);

    return {
        statusCode: 200,
        body: JSON.stringify(formattedJobs)
    };

  } catch (error) {
    console.error('Function Error:', error);
    return {
        statusCode: 500,
        body: JSON.stringify({ error: `Server Error: ${error.message}` })
    };
  }
};
