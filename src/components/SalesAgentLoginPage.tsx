import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ForgotPasswordModal from '@/components/ForgotPasswordModal'; // make sure the path is correct

const SalesAgentLoginPage = () => {
  const [formData, setFormData] = useState({ salesAgentId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn } = useSalesAgentAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-slate-500/20 overflow-hidden"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center p-6 bg-slate-600 text-white">
            <motion.img
              src="/lovable-uploads/4c4b1c82-25eb-403f-963c-8ae3b42338a1.png"
              alt="EKARBOT"
              className="h-20 mx-auto mb-4 animate-pulse-slow"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            <div className="flex items-center justify-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              <span>Secure Sales Agent Access</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 text-slate-700">
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
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sales Agent ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Sales Agent ID <span className="text-red-600">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.salesAgentId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, salesAgentId: e.target.value }))
                  }
                  placeholder="Enter your Sales Agent ID"
                  className="h-12 border-slate-500 focus:border-slate-600 focus:ring-2 focus:ring-slate-600 rounded-lg bg-white transition-all"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Use the Sales Agent ID provided by your administrator
                </p>
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Enter your password"
                    className="h-12 pr-12 border-slate-500 focus:border-slate-600 focus:ring-2 focus:ring-slate-600 rounded-lg bg-white transition-all"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-gray-800 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
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
                className="text-sm text-slate-600 hover:text-gray-800 underline"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Only authorized sales agents can access this system.
                <br />
                Contact your administrator if you need assistance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Background blobs */}
        <motion.div
          className="absolute -bottom-8 -left-8 w-32 h-32 bg-slate-500/30 rounded-full filter blur-xl animate-blob"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full filter blur-xl animate-blob animation-delay-2000"
          animate={{ scale: [1, 1.2, 1], rotate: [0, -360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* 🔹 Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType="sales_agent"
      />

      {/* Animations */}
      <style>{`
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
      `}</style>
    </div>
  );
};

export default SalesAgentLoginPage;
