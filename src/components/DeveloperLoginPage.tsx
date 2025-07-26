import * as React from 'react';
import { useState } from 'react';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Lock, Eye, EyeOff } from 'lucide-react';

const DeveloperLoginPage = () => {
  const [developerId, setDeveloperId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useDeveloperAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(developerId, password);
      
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
      <Card className="w-full max-w-sm bg-white rounded-lg shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6 mt-4">
            <img 
              src="/lovable-uploads/5fdd50c2-539c-443b-8f6c-b90cc2365a1e.png" 
              alt="LOGO" 
              className="h-16 w-auto"
            />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm text-gray-600 font-medium">Developer ID</label>
              <Input
                type="text"
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                placeholder="Enter your Developer ID"
                className="h-10 border-gray-200 rounded"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-600 font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-10 border-gray-200 rounded pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-slate-600 hover:bg-slate-700 text-white rounded mt-6"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperLoginPage;
