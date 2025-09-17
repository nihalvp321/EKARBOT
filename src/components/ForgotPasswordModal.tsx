import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'sales_agent' | 'developer';
}

type Step = 'email' | 'otp' | 'password' | 'success';

interface FormData {
  agentId: string;
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const ForgotPasswordModal = ({ isOpen, onClose, userType }: ForgotPasswordModalProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    agentId: '',
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) score += 12.5;
    return Math.min(score, 100);
  };

  const getProgressColor = (strength: number) => {
    if (strength < 25) return 'bg-destructive';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'email': return 25;
      case 'otp': return 50;
      case 'password': return 75;
      case 'success': return 100;
      default: return 0;
    }
  };

  const handleSendOTP = async () => {
    if (!formData.agentId.trim() || !formData.email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the secure edge function to send OTP
      const { data, error } = await supabase.functions.invoke('forgot-password-send-otp', {
        body: {
          email: formData.email.toLowerCase(),
          userType,
          agentId: formData.agentId
        }
      });

      // Check if there's an edge function error or if the response indicates failure
      if (error) {
        throw new Error(error.message || 'Failed to send OTP');
      }
      
      // Check if the edge function returned an error response
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      // If we have data but no success field, something is wrong
      if (!data || data.success !== true) {
        throw new Error('Failed to send OTP. Please try again.');
      }
      
      toast.success('OTP sent to your email address');
      setCurrentStep('otp');
      setOtpTimer(600); // 10 minutes
      
      // Start countdown
      const interval = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('Send OTP error:', error);
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim() || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the secure edge function to verify OTP
      const { data, error } = await supabase.functions.invoke('forgot-password-verify-otp', {
        body: {
          email: formData.email.toLowerCase(),
          userType,
          otpCode: formData.otp
        }
      });

      // Check if there's an edge function error or if the response indicates failure
      if (error) {
        throw new Error(error.message || 'Failed to verify OTP');
      }
      
      // Check if the edge function returned an error response
      if (data && !data.success) {
        throw new Error(data.error || 'Invalid OTP');
      }
      
      // If we have data but no success field, something is wrong
      if (!data || data.success !== true) {
        throw new Error('Failed to verify OTP. Please try again.');
      }
      
      toast.success('OTP verified successfully');
      setCurrentStep('password');
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      setError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (getPasswordStrength(formData.newPassword) < 75) {
      setError('Password is too weak. Please choose a stronger password with uppercase, lowercase, numbers, and special characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the secure edge function to reset password
      const { data, error } = await supabase.functions.invoke('forgot-password-reset', {
        body: {
          email: formData.email.toLowerCase(),
          userType,
          newPassword: formData.newPassword
        }
      });

      // Check if there's an edge function error or if the response indicates failure
      if (error) {
        throw new Error(error.message || 'Failed to reset password');
      }
      
      // Check if the edge function returned an error response
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      // If we have data but no success field, something is wrong
      if (!data || data.success !== true) {
        throw new Error('Failed to reset password. Please try again.');
      }
      
      toast.success('Password reset successfully');
      setCurrentStep('success');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setCurrentStep('email');
    setFormData({
      agentId: '',
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Reset Your Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your {userType === 'sales_agent' ? 'Sales Agent ID' : 'Developer ID'} and email to receive an OTP
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {userType === 'sales_agent' ? 'Sales Agent ID' : 'Developer ID'}
          </label>
          <Input
            value={formData.agentId}
            onChange={(e) => setFormData(prev => ({ ...prev, agentId: e.target.value }))}
            placeholder={`Enter your ${userType === 'sales_agent' ? 'Sales Agent' : 'Developer'} ID`}
            className="h-11"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email Address</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your registered email"
            className="h-11"
            disabled={loading}
          />
        </div>
      </div>

      <Button 
        onClick={handleSendOTP}
        className="w-full h-11"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Sending OTP...
          </div>
        ) : (
          'Send OTP'
        )}
      </Button>
    </div>
  );

  const renderOTPStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Verify OTP</h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to {formData.email}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">OTP Code</label>
          <Input
            value={formData.otp}
            onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="000000"
            className="h-11 text-center text-lg tracking-widest"
            disabled={loading}
            maxLength={6}
          />
          {otpTimer > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Code expires in {formatTime(otpTimer)}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={handleVerifyOTP}
          className="w-full h-11"
          disabled={loading || formData.otp.length !== 6}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Verifying...
            </div>
          ) : (
            'Verify OTP'
          )}
        </Button>

        <Button 
          variant="ghost"
          onClick={() => setCurrentStep('email')}
          className="w-full h-11"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Email
        </Button>
      </div>
    </div>
  );

  const renderPasswordStep = () => {
    const passwordStrength = getPasswordStrength(formData.newPassword);
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Set New Password</h3>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your account
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">New Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
                className="h-11 pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formData.newPassword && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Password Strength</span>
                  <span className={`font-medium ${passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {passwordStrength >= 75 ? 'Strong' : passwordStrength >= 50 ? 'Medium' : 'Weak'}
                  </span>
                </div>
                <Progress value={passwordStrength} className="h-2" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="h-11 pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleResetPassword}
            className="w-full h-11"
            disabled={loading || !formData.newPassword || !formData.confirmPassword}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating Password...
              </div>
            ) : (
              'Update Password'
            )}
          </Button>

          <Button 
            variant="ghost"
            onClick={() => setCurrentStep('otp')}
            className="w-full h-11"
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to OTP
          </Button>
        </div>
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Password Reset Successful!</h3>
          <p className="text-sm text-muted-foreground">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
        </div>
      </div>

      <Button 
        onClick={handleBackToLogin}
        className="w-full h-11"
      >
        Back to Sign In
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full mx-4">
        <DialogHeader className="space-y-4">
          <div className="text-center">
            <img 
              src="/lovable-uploads/5fdd50c2-539c-443b-8f6c-b90cc2365a1e.png" 
              alt="EKARBOT" 
              className="h-10 mx-auto mb-4"
            />
          </div>
          <DialogTitle className="text-center">Forgot Password</DialogTitle>
          <div className="space-y-2">
            <Progress value={getStepProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep === 'email' ? 1 : currentStep === 'otp' ? 2 : currentStep === 'password' ? 3 : 4}</span>
              <span>of 4</span>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6">
          {currentStep === 'email' && renderEmailStep()}
          {currentStep === 'otp' && renderOTPStep()}
          {currentStep === 'password' && renderPasswordStep()}
          {currentStep === 'success' && renderSuccessStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;