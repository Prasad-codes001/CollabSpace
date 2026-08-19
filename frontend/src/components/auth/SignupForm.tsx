import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(name, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4 text-left">
      <div className="space-y-1">
        <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
          Create your account
        </h3>
        <p className="text-xs text-[#78716C]">
          Join CollabSpace to start collaborating on shared documents.
        </p>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] flex items-center gap-2 text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-semibold text-[#44403C] mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elena Rostova"
              className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-xs font-semibold text-[#44403C] mb-1">
            Work Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@collabspace.io"
              className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[#44403C] mb-1">
            Password
          </label>
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

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-[#44403C] mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] font-semibold text-xs py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center pt-2 text-xs text-[#78716C]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[#1C1917] hover:underline text-[#D97706]"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};
