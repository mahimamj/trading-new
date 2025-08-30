'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { Eye, EyeOff, Mail, Lock, User, Phone, Copy } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      onLogin();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Registration successful!');
      onLogin();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      toast.success('Referral code copied!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <span className="text-2xl font-bold text-white">₹</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cashback Dashboard</h1>
          <p className="text-slate-400">Professional Referral Platform</p>
        </div>

        {/* Referral Code Display */}
        {new URLSearchParams(window.location.search).get('ref') && (
          <div className="bg-primary-600/20 border border-primary-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-300 text-sm">Referral Code</p>
                <p className="text-primary-100 font-mono text-lg">
                  {new URLSearchParams(window.location.search).get('ref')}
                </p>
              </div>
              <button
                onClick={copyReferralCode}
                className="p-2 text-primary-300 hover:text-primary-100 transition-colors"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-dark-800 rounded-xl border border-slate-700 p-8 shadow-2xl">
          {/* Toggle Buttons */}
          <div className="flex bg-dark-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            /* Login Form */
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    {...loginForm.register('email', { required: 'Email is required' })}
                    className="input pl-10"
                    placeholder="Enter your email"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-red-400 text-sm mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...loginForm.register('password', { required: 'Password is required' })}
                    className="input pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-400 text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    {...registerForm.register('name', { required: 'Name is required' })}
                    className="input pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="text-red-400 text-sm mt-1">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    {...registerForm.register('email', { required: 'Email is required' })}
                    className="input pl-10"
                    placeholder="Enter your email"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-red-400 text-sm mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="tel"
                    {...registerForm.register('phone', { required: 'Phone is required' })}
                    className="input pl-10"
                    placeholder="Enter your phone number"
                  />
                </div>
                {registerForm.formState.errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{registerForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerForm.register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className="input pl-10 pr-10"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-red-400 text-sm mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  {...registerForm.register('referralCode')}
                  className="input"
                  placeholder="Enter referral code"
                  defaultValue={new URLSearchParams(window.location.search).get('ref') || ''}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Support Info */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Need help? Contact support at{' '}
            <a href="https://wa.me/919876543210" className="text-primary-400 hover:text-primary-300">
              +91 98765 43210
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
