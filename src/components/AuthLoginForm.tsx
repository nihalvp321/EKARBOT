import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type AuthLoginFormProps = {
  title: string;
  userLabel: string;
  logo?: string;
  onSubmit: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthLoginForm = ({ title, userLabel, logo, onSubmit }: AuthLoginFormProps) => {
  const [formData, setFormData] = useState({ userId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.userId.trim() || !formData.password.trim()) {
      setError(`Please enter both ${userLabel} and password`);
      setLoading(false);
      return;
    }

    try {
      const result = await onSubmit(formData.userId, formData.password);
      if (!result.success) setError(result.error || 'Login failed');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#455560] flex items-center justify-center p-4">
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-[#455560]/20 overflow-hidden"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center p-6 bg-[#455560] text-white">
            {logo && (
              <motion.img
                src={logo}
                alt="EKARBOT"
                className="h-20 mx-auto mb-4 animate-pulse-slow"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
              />
            )}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              <span>{title}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 text-[#455560]">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm shadow"
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  {userLabel} <span className="text-red-600">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                  placeholder={`Enter your ${userLabel}`}
                  className="h-12 border-[#455560] focus:border-[#455560] focus:ring-2 focus:ring-[#455560] rounded-lg bg-white transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="h-12 pr-12 border-[#455560] focus:border-[#455560] focus:ring-2 focus:ring-[#455560] rounded-lg bg-white transition-all"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#455560] hover:text-gray-700 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-[#455560] hover:bg-[#3a4852] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-[#455560] hover:text-gray-800 underline"
                onClick={() => {
                  toast.info('Forgot password feature coming soon. Please contact admin.');
                }}
              >
                Forgot password?
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Only authorized users can access this system.<br />
                Contact your administrator if you need assistance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Background blobs */}
        <motion.div
          className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#455560]/30 rounded-full filter blur-xl animate-blob"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full filter blur-xl animate-blob animation-delay-2000"
          animate={{ scale: [1, 1.2, 1], rotate: [0, -360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
};

// 🔹 Shared Animations
const styles = `
  @keyframes blob {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(15px, -15px) scale(1.1); }
    66% { transform: translate(-15px, 15px) scale(1.05); }
    100% { transform: translate(0, 0) scale(1); }
  }
  .animate-blob { animation: blob 15s infinite; }
  .animate-pulse-slow { animation: pulse 3s infinite; }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .animation-delay-2000 { animation-delay: 2s; }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default AuthLoginForm;
