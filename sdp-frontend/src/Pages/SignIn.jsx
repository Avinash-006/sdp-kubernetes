import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../../config';

export default function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [showCaptchaError, setShowCaptchaError] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Generate initial CAPTCHA
  useEffect(() => {
    const generateCode = () => {
      const code = Math.floor(100 + Math.random() * 900).toString();
      setCaptchaCode(code);
      setShowCaptchaError(false);
      console.log('Generated CAPTCHA:', code);
    };
    generateCode();
  }, []);

  // Load remember me preference
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    const savedUser = localStorage.getItem('user');
    if (savedRememberMe === 'true' && savedUser) {
      const userData = JSON.parse(savedUser);
      setUsernameOrEmail(userData.username || '');
      setRememberMe(true);
    }
  }, []);

  const generateNewCaptcha = () => {
    const code = Math.floor(100 + Math.random() * 900).toString();
    setCaptchaCode(code);
    setCaptchaInput('');
    setShowCaptchaError(false);
    console.log('Generated new CAPTCHA:', code);
  };

  const verifyCaptcha = async () => {
    if (!captchaInput.trim()) {
      toast.error('Please enter the CAPTCHA code', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    setCaptchaLoading(true);
    setShowCaptchaError(false);

    // Simulate brief verification delay
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('Verifying CAPTCHA:', { input: captchaInput, code: captchaCode });

    if (captchaInput.trim() === captchaCode) {
      setCaptchaVerified(true);
      setShowCaptchaError(false);
      toast.success('CAPTCHA verified successfully! 👋', {
        duration: 3000,
        position: 'top-center'
      });
    } else {
      setShowCaptchaError(true);
      setCaptchaInput('');
      generateNewCaptcha();
      toast.error('Incorrect CAPTCHA. Please try again.', {
        duration: 4000,
        position: 'top-center'
      });
    }

    setCaptchaLoading(false);
  };

  const handleInputChange = (field, value) => {
    if (field === 'captcha') {
      // Allow only numbers for CAPTCHA
      const numericValue = value.replace(/[^0-9]/g, '');
      setCaptchaInput(numericValue);
    } else {
      setUsernameOrEmail(field === 'usernameOrEmail' ? value : usernameOrEmail);
      setPassword(field === 'password' ? value : password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!usernameOrEmail.trim()) {
      toast.error('Please enter your username or email', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }
    
    if (!password.trim()) {
      toast.error('Please enter your password', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    if (!captchaVerified) {
      toast.error('Please verify CAPTCHA first', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    setLoading(true);
    
    try {
      const isEmail = usernameOrEmail.includes('@');
      const loginData = {
        username: isEmail ? null : usernameOrEmail.trim(),
        email: isEmail ? usernameOrEmail.trim() : null,
        password: password.trim(),
      };

      console.log('Sending login request:', loginData);

      const response = await axios.post(`${config.url}/api/users/login`, loginData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const user = response.data;
      console.log('Login response:', user);

      if (user && user.id && user.username) {
        // Store user data
        const userData = { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          isAdmin: user.admin || false 
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          // Don't store password for security
          const rememberData = { username: usernameOrEmail.trim() };
          localStorage.setItem('rememberUser', JSON.stringify(rememberData));
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberUser');
        }
        
        console.log('Stored user in localStorage:', userData);
        
        toast.success('Login successful! Welcome back 🎉', {
          duration: 4000,
          position: 'top-center'
        });

        // Small delay for better UX
        setTimeout(() => {
          if (user.admin) {
            console.log('Admin user - Navigating to /admin-dashboard');
            navigate('/admin-dashboard', { replace: true });
          } else {
            console.log('Regular user - Navigating to /drive');
            navigate('/drive', { replace: true });
          }
        }, 800);
        
      } else {
        throw new Error('Invalid user data received from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred during login';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            errorMessage = 'Invalid username/email or password. Please try again.';
            break;
          case 403:
            errorMessage = 'Account access temporarily restricted. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please wait 5 minutes before trying again.';
            break;
          default:
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data && data.message) {
              errorMessage = data.message;
            } else if (data && data.error) {
              errorMessage = data.error;
            } else {
              errorMessage = 'Login failed. Please try again.';
            }
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Login request timed out. Please check your connection and try again.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message || 'Login failed. Please try again.';
      }

      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (loading) return;
      
      if (!captchaVerified) {
        verifyCaptcha();
      } else {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-4 py-8 bg-gray-50 rounded-3xl shadow-lg animate-fade-in"
      >
        {/* Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8 animate-slide-up"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4 mx-auto">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Swiftyy account securely</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username/Email Input */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <User className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Username or Email"
              value={usernameOrEmail}
              onChange={(e) => handleInputChange('usernameOrEmail', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                loading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              required
              disabled={loading}
              autoComplete="username email"
            />
          </motion.div>

          {/* Password Input */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-10 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                loading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </motion.button>
          </motion.div>

          {/* CAPTCHA Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="text-center animate-slide-up">
              <p className="text-gray-600 mb-3 text-sm flex items-center justify-center">
                <Shield className="h-4 w-4 mr-2 text-gray-500" />
                Verify you're not a bot
              </p>
              
              {/* CAPTCHA Display */}
              <motion.div 
                initial={false}
                animate={{ 
                  scale: captchaVerified ? [1, 1.05, 1] : 1 
                }}
                transition={{ duration: 0.3 }}
                className={`inline-flex items-center justify-center bg-gray-200 p-3 rounded-lg transition-all duration-300 ${
                  captchaVerified 
                    ? 'bg-green-100 border-2 border-green-200' 
                    : 'hover:bg-gray-300'
                }`}
              >
                <span className={`text-lg font-mono font-bold text-black ${
                  captchaVerified ? 'text-green-700' : ''
                }`}>
                  {captchaVerified ? (
                    <>
                      <CheckCircle className="h-5 w-5 inline mr-2" />
                      Verified
                    </>
                  ) : (
                    captchaCode
                  )}
                </span>
              </motion.div>
            </div>

            {/* CAPTCHA Input - Only show if not verified */}
            {!captchaVerified && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 animate-slide-up"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter CAPTCHA code"
                    value={captchaInput}
                    onChange={(e) => handleInputChange('captcha', e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={3}
                    className={`w-full pl-4 pr-12 py-3 border-2 rounded-full focus:outline-none focus:border-blue-500 transition-all duration-300 text-sm text-center font-mono tracking-wider uppercase ${
                      showCaptchaError 
                        ? 'border-red-300 bg-red-50' 
                        : loading 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                    disabled={captchaLoading || loading}
                  />
                  <motion.button
                    type="button"
                    onClick={generateNewCaptcha}
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={captchaLoading || loading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={verifyCaptcha}
                  disabled={captchaLoading || loading || !captchaInput}
                  className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                    captchaLoading || loading || !captchaInput
                      ? 'bg-gray-400 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-xl'
                  }`}
                >
                  {captchaLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Verify CAPTCHA</span>
                    </>
                  )}
                </motion.button>

                {showCaptchaError && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-600 text-xs flex items-center justify-center space-x-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    <span>Incorrect code. Try again.</span>
                  </motion.p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Remember Me & Forgot Password */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between text-sm pt-2"
          >
            <label className="flex items-center text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 rounded border-gray-400 text-black focus:ring-black w-4 h-4 transition-all duration-200"
                disabled={loading}
              />
              <span className="hover:text-gray-800 transition-colors">Remember me</span>
            </label>
            <Link 
              to="/forgot-password" 
              className="text-black hover:text-gray-600 font-medium hover:underline transition-colors duration-200"
              disabled={loading}
            >
              Forgot password?
            </Link>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !captchaVerified}
            className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
              loading || !captchaVerified
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl active:bg-gray-900'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Sign In Securely</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Links */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-3 mt-6 pt-6 border-t border-gray-200"
        >
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-black font-medium hover:underline transition-colors duration-200"
            >
              Create one here
            </Link>
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-600 hover:text-black text-sm font-medium hover:underline transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </motion.div>

        {/* Development Mode Demo Credentials */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-xl"
          >
            
          </motion.div>
        )}
      </motion.div>

      {/* Custom Toast Styling */}
      <style jsx global>{`
        .react-hot-toast {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .react-hot-toast .Toastify__toast {
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }
        .react-hot-toast .Toastify__toast--success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 1px solid #059669;
        }
        .react-hot-toast .Toastify__toast--error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid #dc2626;
        }
        .react-hot-toast .Toastify__toast--default {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          border: 1px solid #4b5563;
        }
      `}</style>
    </div>
  );
}