
import { supabase } from '@/integrations/supabase/client';

export const useChatPromptStorage = () => {
  const savePromptToDatabase = async (promptText: string, salesAgentId: string) => {
    try {
      if (!salesAgentId) {
        console.error('No sales agent ID available');
        throw new Error('Sales agent ID is required');
      }

      console.log('=== Saving prompt to database ===');
      console.log('Prompt text:', promptText);
      console.log('Sales agent ID:', salesAgentId);
      
      const { data, error } = await supabase.from('chat_prompts').insert([
        {
          sales_agent_id: salesAgentId,
          prompt_text: promptText,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Database save error:', error);
        throw error;
      }

      console.log('Prompt saved to database successfully:', data);
    } catch (error) {
      console.error('Failed to save prompt to database:', error);
      throw error;
    }
  };

  return { savePromptToDatabase };
};
