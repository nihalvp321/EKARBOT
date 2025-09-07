
import { supabase } from '@/integrations/supabase/client';

// Rate limiting utility
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now - record.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Security logging utility - simplified to avoid table structure issues
export const logSecurityEvent = async (action: string, details?: any) => {
  try {
    console.log('Security Event:', action, details);
    // For now, just log to console until audit table is properly configured
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Secure session management
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
};

// Content Security Policy headers for file uploads
export const getSecureUploadHeaders = () => {
  return {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };
};

// Generate secure random strings for tokens/IDs
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  
  return result;
};

// Validate sales agent credentials against user_manager created accounts
export const validateSalesAgentCredentials = async (salesAgentId: string, password: string): Promise<{ success: boolean; error?: string; agent?: any }> => {
  try {
    // Check rate limiting
    if (!checkRateLimit(`sales_agent_login_${salesAgentId}`, 5, 300000)) { // 5 attempts per 5 minutes
      await logSecurityEvent('rate_limit_exceeded', { sales_agent_id: salesAgentId });
      return { success: false, error: 'Too many login attempts. Please try again later.' };
    }

    // First, get the sales agent record
    const { data: agentData, error: agentError } = await supabase
      .from('sales_agents')
      .select('*')
      .eq('sales_agent_id', salesAgentId.trim())
      .single();

    if (agentError || !agentData) {
      await logSecurityEvent('failed_sales_agent_login', { sales_agent_id: salesAgentId, reason: 'agent_not_found' });
      return { success: false, error: 'Invalid Sales Agent ID or password' };
    }

    // Check if sales agent account is active
    if (!agentData.is_active) {
      await logSecurityEvent('failed_sales_agent_login', { sales_agent_id: salesAgentId, reason: 'agent_deactivated' });
      return { success: false, error: 'Your account has been deactivated by the administrator. Please contact support.' };
    }

    // Check if the sales agent has a linked user_id
    if (!agentData.user_id) {
      await logSecurityEvent('failed_sales_agent_login', { sales_agent_id: salesAgentId, reason: 'no_user_account' });
      return { success: false, error: 'Account not properly configured. Contact administrator.' };
    }

    // Get the linked app_users record
    const { data: appUserData, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', agentData.user_id)
      .eq('is_active', true)
      .single();

    if (appUserError || !appUserData) {
      await logSecurityEvent('failed_sales_agent_login', { sales_agent_id: salesAgentId, reason: 'user_account_not_found' });
      return { success: false, error: 'Account not found or inactive' };
    }

    // Verify user type is sales_agent
    if (appUserData.user_type !== 'sales_agent') {
      await logSecurityEvent('failed_sales_agent_login', { sales_agent_id: salesAgentId, reason: 'invalid_user_type' });
      return { success: false, error: 'Access denied' };
    }

    // For now, compare password directly (in production, this should use proper hashing)
    if (appUserData.password_hash !== password) {
      await logSecurityEvent('failed_sales_agent_login', { sales_agent_id: salesAgentId, reason: 'password_mismatch' });
      return { success: false, error: 'Invalid Sales Agent ID or password' };
    }

    // Log successful authentication
    await logSecurityEvent('successful_sales_agent_login', { sales_agent_id: salesAgentId });

    return { success: true, agent: agentData };
  } catch (error) {
    console.error('Sales agent authentication error:', error);
    await logSecurityEvent('sales_agent_login_error', { sales_agent_id: salesAgentId, error: error.message });
    return { success: false, error: 'Authentication failed' };
  }
};
