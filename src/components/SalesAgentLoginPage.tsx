import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

const SalesAgentLoginPage = () => {
  const [formData, setFormData] = useState({
    salesAgentId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useSalesAgentAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic input validation
    if (!formData.salesAgentId.trim() || !formData.password.trim()) {
      setError('Please enter both Sales Agent ID and password');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn(formData.salesAgentId, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/4c4b1c82-25eb-403f-963c-8ae3b42338a1.png" 
              alt="EKARBOT" 
              className="h-12 mx-auto mb-6"
            />
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Secure Sales Agent Access</span>
            </div>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Sales Agent ID
              </label>
              <Input
                type="text"
                value={formData.salesAgentId}
                onChange={(e) => setFormData(prev => ({ ...prev, salesAgentId: e.target.value }))}
                placeholder="Enter your Sales Agent ID"
                className="h-11 border-gray-300 bg-gray-50 focus:border-gray-400 focus:ring-gray-400"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Use the Sales Agent ID provided by your administrator
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="h-11 pr-12 border-gray-300 bg-gray-50 focus:border-gray-400 focus:ring-gray-400"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-600 hover:bg-slate-700 text-white font-medium text-base rounded-md"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Only authorized sales agents can access this system.<br />
              Contact your administrator if you need assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAgentLoginPage;
