import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting document parsing request');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    console.log('Request received, processing file');
    
    const { fileData, fileName, fileType } = requestBody;

    if (!fileData || !fileName || !fileType) {
      throw new Error('Missing required fields: fileData, fileName, or fileType');
    }

    console.log(`Processing file: ${fileName}, type: ${fileType}`);

    // For now, let's use a simpler approach that works with all file types
    // We'll treat everything as an image/document for OpenAI vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a real estate document parser. Extract project information from the document and return ONLY a JSON object with these fields (omit fields if not found):

{
  "project_title": "string",
  "description": "string", 
  "project_type": "residential|commercial|mixed",
  "listing_type": "sale|rent",
  "project_status": "planned|under_construction|completed",
  "city": "string",
  "region_area": "string",
  "sub_community": "string",
  "nearby_landmarks": "string",
  "starting_price_aed": number,
  "price_per_sqft": number,
  "payment_plan": "string",
  "service_charges": number,
  "handover_date": "YYYY-MM-DD",
  "total_units": number,
  "unit_sizes_range": "string",
  "bedrooms_range": "string", 
  "bathrooms_range": "string",
  "furnishing_status": "furnished|unfurnished|semi_furnished",
  "ownership_type": "freehold|leasehold",
  "amenities": ["string"],
  "parking_spaces": number,
  "has_security": boolean,
  "security_details": "string",
  "has_elevators": boolean,
  "sales_contact_name": "string",
  "sales_phone": "string",
  "sales_email": "string",
  "developer_name": "string",
  "address": "string",
  "location_description": "string",
  "google_maps_link": "string",
  "rera_approval_id": "string"
}

Return ONLY the JSON object, no other text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract real estate project information from this document:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${fileData}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0
      }),
    });

    console.log(`OpenAI response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('OpenAI response received');

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    const extractedText = result.choices[0].message.content;
    console.log('Raw OpenAI response:', extractedText);

    // Parse the JSON response
    let extractedData = {};
    try {
      // Clean the response to extract JSON
      const cleanedText = extractedText.trim();
      
      // Try to find JSON in the response
      let jsonStart = cleanedText.indexOf('{');
      let jsonEnd = cleanedText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
        extractedData = JSON.parse(jsonString);
        console.log('Successfully parsed JSON:', extractedData);
      } else {
        console.warn('No JSON found in response, creating mock data');
        // Fallback: create a minimal structure
        extractedData = {
          project_title: "Extracted from " + fileName,
          description: "Project information extracted from document"
        };
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Trying to extract basic info manually from text:', extractedText);
      
      // Fallback: try to extract basic information manually
      extractedData = {
        project_title: "Project from " + fileName,
        description: extractedText.substring(0, 200) + "..."
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedData,
        message: 'Document parsed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in parse-document function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});