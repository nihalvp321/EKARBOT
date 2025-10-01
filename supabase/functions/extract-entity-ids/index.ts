import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Extracting entity IDs from message:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an ID extraction assistant. Your ONLY job is to find entity IDs that are explicitly labeled in the text.

CRITICAL: You MUST ONLY extract IDs if the text contains these EXACT label phrases:
- "lead_id" or "Lead ID" → Extract ALL values and return as "lead_ids" array
- "customer_id" or "Customer ID" → Extract ALL values and return as "customer_ids" array
- "activity_id" or "Activity ID" → Extract ALL values and return as "activity_ids" array
- "project_id" or "Project ID" → Extract ALL values and return as "project_ids" array

If NONE of these label phrases appear in the text, return an empty object: {}

ID Format Rules:
- IDs typically start with LEAD, CUST, ACT, or PROJ followed by numbers
- Remove any markdown formatting (**, -, etc.)
- Return only uppercase alphanumeric IDs
- Extract ALL occurrences of each ID type into arrays
- Each ID type should be an array, even if there's only one ID

Examples:

Input: "Lead ID: **LEAD1000**"
Output: {"lead_ids": ["LEAD1000"]}

Input: "Customer ID: CUST1003, Lead ID: LEAD1008"
Output: {"customer_ids": ["CUST1003"], "lead_ids": ["LEAD1008"]}

Input: "Project ID: PROJ001, Project ID: PROJ002, Lead ID: LEAD1008"
Output: {"project_ids": ["PROJ001", "PROJ002"], "lead_ids": ["LEAD1008"]}

Input: "Here are 3 properties: Project ID: PROJ001, Project ID: PROJ002, Project ID: PROJ003"
Output: {"project_ids": ["PROJ001", "PROJ002", "PROJ003"]}

Input: "Here are some properties you requested"
Output: {}

Input: "The project details are..."
Output: {}

Return ONLY a valid JSON object with arrays for each ID type, no other text.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    console.log('OpenAI raw response:', content);

    let extractedIds = {};
    try {
      extractedIds = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      extractedIds = {};
    }

    console.log('Extracted IDs:', extractedIds);

    return new Response(JSON.stringify({ extractedIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-entity-ids function:', error);
    return new Response(
      JSON.stringify({ error: error.message, extractedIds: {} }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
