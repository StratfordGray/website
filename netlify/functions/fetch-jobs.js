// Removed explicit require, relying on Netlify's global fetch

/**
 * Netlify serverless function to securely fetch job data from Airtable.
 * This acts as a proxy to keep your API key hidden.
 * * To debug the 404 error:
 * 1. Ensure you have set the three Environment Variables (AIRTABLE_...) in Netlify.
 * 2. Check the Netlify function logs for the "Airtable URL Attempt" printout below.
 * 3. Copy that URL and test it directly in your browser or Postman with the token 
 * in the Authorization header to confirm the URL is valid.
 */
exports.handler = async (event, context) => {
    // --- CRITICAL CONFIGURATION: These must be set in Netlify Environment Variables ---
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN; // Your Personal Access Token (PAT)
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;   // e.g., 'appxxxxxxxxxxxxxx'
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME; // e.g., 'Jobs' or 'Current Openings'
    // --- END CONFIGURATION ---

    let missingVars = [];
    if (!AIRTABLE_TOKEN) missingVars.push('AIRTABLE_TOKEN'); // Checking for the new name
    if (!AIRTABLE_BASE_ID) missingVars.push('AIRTABLE_BASE_ID');
    if (!AIRTABLE_TABLE_NAME) missingVars.push('AIRTABLE_TABLE_NAME');

    if (missingVars.length > 0) {
        const errorMessage = `Server misconfiguration: Missing required environment variables: ${missingVars.join(', ')}.`;
        console.error(errorMessage);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
        };
    }

    // IMPORTANT: The table name must be URL encoded. The view is assumed to be 'Website Jobs'
    // and the filter assumes a 'Status' field set to 'Active'. Adjust as needed.
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?view=Website%20Jobs&filterByFormula={Status}='Active'`;

    // **THIS IS THE LINE YOU MUST CHECK IN YOUR NETLIFY LOGS!**
    console.log('Airtable URL Attempt:', url); 

    try {
        // Fetch is now global (in Netlify's execution context)
        const airtableResponse = await fetch(url, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_TOKEN}`, // Using the new token variable
            },
        });

        // If Airtable returns a 404 (or any non-200 status), we log it and pass the status back.
        if (!airtableResponse.ok) {
            const errorText = await airtableResponse.text();
            console.error(`Airtable API returned error status ${airtableResponse.status}:`, errorText);
            
            return {
                statusCode: airtableResponse.status,
                body: JSON.stringify({ 
                    error: `Airtable fetch failed (Status: ${airtableResponse.status}). Check Airtable Base ID, Table Name, and PAT permissions.`,
                    airtable_message: errorText // Include the exact error message from Airtable
                }),
            };
        }

        const { records } = await airtableResponse.json();
        
        // Map Airtable records into the simple structure your HTML expects (must match field names)
        const jobs = records.map(record => ({
            // Use the actual field names from your Airtable base:
            id: record.id,
            title: record.fields['Job Title'] || 'N/A', 
            location: record.fields['Location'] || 'Remote',
            salary: record.fields['Salary Band'] || 'Competitive', 
            shortDesc: record.fields['Summary'] || 'Details available upon request.', 
            longDesc: record.fields['Full Description'] || 'Detailed job description.', 
            // Add any other fields like 'ApplyLink' if needed
        }));

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=0, must-revalidate'
            },
            body: JSON.stringify(jobs), // Return the cleaned up array of job objects
        };

    } catch (error) {
        console.error('Netlify function execution failed:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Netlify function failed: ${error.message}` }),
        };
    }
};
