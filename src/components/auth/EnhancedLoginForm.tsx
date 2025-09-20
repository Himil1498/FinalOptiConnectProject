import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UserIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ValidationState {
  email: { isValid: boolean; message: string };
  password: { isValid: boolean; message: string };
}

const EnhancedLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<ValidationState>({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' }
  });
  const [loginError, setLoginError] = useState('');

  const { login, loading } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, message: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters' };
    }
    return { isValid: true, message: '' };
  };

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setErrors(prev => ({
      ...prev,
      email: validateEmail(value)
    }));
    setLoginError('');
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setErrors(prev => ({
      ...prev,
      password: validatePassword(value)
    }));
    setLoginError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setErrors({
      email: emailValidation,
      password: passwordValidation
    });

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return;
    }

    try {
      const success = await login(email, password);
      if (!success) {
        setLoginError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      setLoginError('An error occurred during login. Please try again.');
    }
  };

  const demoAccounts = [
    {
      role: 'Administrator',
      email: 'admin@opticonnect.com',
      description: 'Full system access',
      icon: ShieldCheckIcon,
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    {
      role: 'Manager',
      email: 'manager@opticonnect.com',
      description: 'Regional management access',
      icon: BuildingOfficeIcon,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      role: 'Technician',
      email: 'tech@opticonnect.com',
      description: 'Field operations access',
      icon: UserIcon,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      role: 'Viewer',
      email: 'user@opticonnect.com',
      description: 'Read-only access',
      icon: UserIcon,
      color: 'text-gray-600 bg-gray-50 border-gray-200'
    }
  ];

  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setErrors({
      email: { isValid: true, message: '' },
      password: { isValid: true, message: '' }
    });
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full flex">
        {/* Left Panel - Branding and Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-l-2xl p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-700/90"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-12">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <ShieldCheckIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">OptiConnect</h1>
                <p className="text-indigo-200">GIS Platform</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold leading-tight">
                Professional Network Infrastructure Management
              </h2>
              <p className="text-lg text-indigo-100 leading-relaxed">
                Advanced GIS platform for telecom infrastructure optimization,
                real-time monitoring, and data-driven decision making.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center text-indigo-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400" />
              <span>Enterprise-grade security</span>
            </div>
            <div className="flex items-center text-indigo-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400" />
              <span>Real-time data visualization</span>
            </div>
            <div className="flex items-center text-indigo-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400" />
              <span>Advanced analytics & reporting</span>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-32 -left-16 w-64 h-64 bg-white/5 rounded-full"></div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 bg-white rounded-2xl lg:rounded-l-none shadow-2xl p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
                Welcome Back
              </h2>
              <p className="text-gray-600 font-medium">
                Please sign in to your account
              </p>
              <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mt-3"></div>
            </div>

            {loginError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{loginError}</div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-indigo-600 mr-2">📧</span>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                      !errors.email.isValid
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                  />
                </div>
                {!errors.email.isValid && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-indigo-600 mr-2">🔒</span>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                      !errors.password.isValid
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center transition-all duration-200 hover:scale-110 active:scale-95 rounded-full p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-indigo-500 hover:text-indigo-700 transition-colors duration-200" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-indigo-500 hover:text-indigo-700 transition-colors duration-200" />
                    )}
                  </button>
                </div>
                {!errors.password.isValid && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-800">
                    Remember me
                  </label>
                </div>
                <button type="button" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-all duration-200 hover:scale-105 active:scale-95 px-3 py-1 rounded-lg hover:bg-indigo-50">
                  🔄 Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 hover:scale-105 hover:shadow-xl hover:-translate-y-1 active:scale-95 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 transition-all duration-300 ease-in-out relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative z-10 flex items-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Sign In</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {demoAccounts.map((account) => {
                  const IconComponent = account.icon;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillDemoCredentials(account.email)}
                      className={`p-4 border-2 rounded-xl text-left hover:shadow-xl hover:-translate-y-2 active:translate-y-0 active:scale-95 transition-all duration-300 ease-in-out ${account.color} hover:scale-105 cursor-pointer relative overflow-hidden group backdrop-blur-sm`}
                      style={{
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center mb-2">
                          <IconComponent className="w-5 h-5 mr-3 drop-shadow-sm" />
                          <span className="text-sm font-bold tracking-wide">{account.role}</span>
                        </div>
                        <div className="text-xs opacity-90 truncate font-medium">
                          {account.email}
                        </div>
                        <div className="text-xs opacity-75 mt-1 font-medium">
                          {account.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  🔑 Demo Account Access
                </p>
                <p className="text-xs text-gray-600">
                  Password for all accounts: <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border">password</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginForm;