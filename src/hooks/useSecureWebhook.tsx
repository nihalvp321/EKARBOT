
import { useState } from 'react';
import { sanitizeInput } from '@/utils/inputValidation';
import { logSecurityEvent, checkRateLimit } from '@/utils/securityUtils';
import { toast } from 'sonner';

interface Project {
  project_id: string;
  project_title: string;
  developer_name: string;
  emirate: string;
  region_area: string;
  project_type: string;
  description: string;
  relevance_score: number;
  reasoning: string;
}

export const useSecureWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);

  const callSecureWebhook = async (promptText: string, salesAgentId: string): Promise<Project[]> => {
    setIsLoading(true);
    
    try {
      console.log('=== Starting secure n8n webhook call ===');
      console.log('Prompt text:', promptText);
      console.log('Sales agent ID:', salesAgentId);
      
      // Input validation
      if (!promptText || promptText.trim().length === 0) {
        toast.error('Please enter a search query');
        return [];
      }

      if (promptText.length > 1000) {
        toast.error('Search query is too long (max 1000 characters)');
        return [];
      }

      // Rate limiting
      const rateLimitKey = `webhook_${salesAgentId}`;
      if (!checkRateLimit(rateLimitKey, 10, 60000)) { // 10 requests per minute
        toast.error('Too many requests. Please wait a moment before trying again.');
        return [];
      }

      // Sanitize input
      const sanitizedPrompt = sanitizeInput(promptText);
      
      const requestBody = {
        prompt: sanitizedPrompt,
        message: sanitizedPrompt,
        sales_agent_id: salesAgentId,
        timestamp: new Date().toISOString(),
        source: 'sales_agent_chat'
      };

      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));

      // Use the n8n webhook URL - make sure this matches your n8n webhook configuration
      const webhookUrl = 'https://shafil.app.n8n.cloud/webhook-test/recommend-projects';
      console.log('Using webhook URL:', webhookUrl);

      // Log security event
      await logSecurityEvent('webhook_call_attempt', {
        webhook_url: webhookUrl,
        sales_agent_id: salesAgentId,
        prompt_length: sanitizedPrompt.length
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EkarBot-SecureClient/1.0'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response received - Status:', response.status);
      console.log('Response OK:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}`);
        console.error('Error response body:', errorText);
        
        await logSecurityEvent('webhook_call_failed', {
          status: response.status,
          error: errorText,
          sales_agent_id: salesAgentId
        });
        
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.log('Response was not valid JSON, treating as plain text:', responseText);
        
        await logSecurityEvent('webhook_response_parse_error', {
          error: parseError.message,
          response_text: responseText.substring(0, 500),
          sales_agent_id: salesAgentId
        });
        
        // Return empty array if we can't parse the response
        toast.error('Invalid response format from webhook');
        return [];
      }

      // Handle different response formats
      let projects = [];
      if (Array.isArray(data)) {
        projects = data;
      } else if (data.projects && Array.isArray(data.projects)) {
        projects = data.projects;
      } else if (data.data && Array.isArray(data.data)) {
        projects = data.data;
      } else if (data.result && Array.isArray(data.result)) {
        projects = data.result;
      } else if (data.message) {
        // Handle case where n8n returns a message instead of projects
        console.log('Webhook returned message:', data.message);
        toast.info('Search completed but no projects found');
        return [];
      } else {
        console.log('Creating single project from response:', data);
        // If response is a single object, wrap it in an array
        projects = [data];
      }

      console.log('Extracted projects count:', projects.length);

      // Log successful webhook call
      await logSecurityEvent('webhook_call_success', {
        projects_count: projects.length,
        sales_agent_id: salesAgentId
      });

      // Ensure all projects have required fields
      return projects.map((project: any, index: number) => ({
        project_id: project.project_id || project.id || `project_${Date.now()}_${index}`,
        project_title: project.project_title || project.title || project.name || 'Untitled Project',
        developer_name: project.developer_name || project.developer || 'Unknown Developer',
        emirate: project.emirate || project.location || 'Dubai',
        region_area: project.region_area || project.area || 'Unknown Area',
        project_type: project.project_type || project.type || 'Residential',
        description: project.description || project.desc || 'No description available',
        relevance_score: project.relevance_score || project.score || Math.floor(Math.random() * 50) + 50,
        reasoning: project.reasoning || project.reason || 'Recommended based on your search criteria',
      }));

    } catch (error) {
      console.error('=== Secure webhook call failed ===');
      console.error('Error details:', error);
      
      await logSecurityEvent('webhook_call_exception', {
        error: error.message,
        sales_agent_id: salesAgentId
      });
      
      toast.error('Failed to connect to recommendation service');
      
      // Return empty array instead of mock data for production
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { callSecureWebhook, isLoading };
};
