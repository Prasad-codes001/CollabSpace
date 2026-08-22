import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      const errorMsg = err?.message || 'Authentication failed. Please check your credentials.';
      // Show "Invalid credentials" for authentication failures from the backend
      setError(errorMsg.includes('invalid email or password') ? 'Invalid credentials' : errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 text-left">
      <div className="space-y-1">
        <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
          Sign in to CollabSpace
        </h3>
        <p className="text-xs text-[#78716C]">
          Enter your email and password to access your workspace.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] flex items-center gap-2 text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-xs font-semibold text-[#44403C] mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#44403C]">
              Password
            </label>
            <a href="#" className="text-[11px] text-[#D97706] hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg pl-9 pr-10 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#D6D3D1] text-[#1C1917] focus:ring-[#1C1917]"
            />
            <span className="text-xs text-[#57534E]">Remember me</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] font-semibold text-xs py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center pt-2 text-xs text-[#78716C]">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-[#1C1917] hover:underline text-[#D97706]"
        >
          Create account
        </button>
      </div>
    </div>
  );
};
