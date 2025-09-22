import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../../config';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    minLength: false
  });

  const checkPasswordStrength = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const minLength = password.length >= 8;

    setPasswordStrength({
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      minLength
    });

    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && minLength;
  };

  const validateUsername = (value) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!value) {
      setUsernameError('Username is required');
      return false;
    }
    if (!usernameRegex.test(value)) {
      setUsernameError('Username must be 3-20 characters with letters, numbers, or underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (!checkPasswordStrength(value)) {
      setPasswordError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value) => {
    if (!value) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleInputChange = (field, value) => {
    switch (field) {
      case 'username':
        setUsername(value);
        if (usernameError) validateUsername(value);
        break;
      case 'email':
        setEmail(value);
        if (emailError) validateEmail(value);
        break;
      case 'password':
        setPassword(value);
        checkPasswordStrength(value);
        if (passwordError) validatePassword(value);
        if (confirmPassword && confirmPasswordError) validateConfirmPassword(confirmPassword);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        if (confirmPasswordError) validateConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setSubmitError('');
    
    // Validate all fields
    const isUsernameValid = validateUsername(username);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      toast.error('Please fix the errors above', {
        duration: 4000,
        position: 'top-center'
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Sending registration request:', { username, email });
      
      const response = await axios.post(`${config.url}/api/users/add`, {
        username: username.trim(),
        email: email.trim(),
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      console.log('Registration response:', response.data);
      
      toast.success('Registration successful! Welcome aboard! 🎉', {
        duration: 5000,
        position: 'top-center'
      });

      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to sign in after a delay
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'An unexpected error occurred during registration';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 409:
            if (data === 'Username already taken') {
              errorMessage = 'This username is already taken. Please choose another one.';
              setUsernameError('Username already taken');
            } else if (data === 'Email already taken') {
              errorMessage = 'This email is already registered. Did you forget your password?';
              setEmailError('Email already registered');
            } else {
              errorMessage = data || 'Registration conflict. Please try again.';
            }
            break;
          case 400:
            errorMessage = data?.message || 'Invalid registration data';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = data || 'Registration failed. Please try again.';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Registration timed out. Please check your connection and try again.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'Registration failed.';
      }

      setSubmitError(errorMessage);
      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  const getPasswordStrengthColor = () => {
    const { hasUppercase, hasLowercase, hasNumber, hasSpecialChar, minLength } = passwordStrength;
    const count = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar, minLength].filter(Boolean).length;
    
    if (count === 5) return 'bg-green-500';
    if (count >= 3) return 'bg-yellow-500';
    if (count >= 1) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getPasswordStrengthText = () => {
    const { hasUppercase, hasLowercase, hasNumber, hasSpecialChar, minLength } = passwordStrength;
    const count = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar, minLength].filter(Boolean).length;
    
    if (count === 5) return 'Strong';
    if (count >= 3) return 'Good';
    if (count >= 1) return 'Weak';
    return 'Too weak';
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
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Create Account</h1>
          <p className="text-gray-600">Join Swiftyy and start sharing securely</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <User className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                usernameError 
                  ? 'border-red-300 bg-red-50' 
                  : loading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              required
              disabled={loading}
              autoComplete="username"
            />
            {usernameError && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-600 text-xs mt-1 flex items-center space-x-1"
              >
                <AlertCircle className="h-3 w-3" />
                <span>{usernameError}</span>
              </motion.p>
            )}
          </motion.div>

          {/* Email Input */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                emailError 
                  ? 'border-red-300 bg-red-50' 
                  : loading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              required
              disabled={loading}
              autoComplete="email"
            />
            {emailError && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-600 text-xs mt-1 flex items-center space-x-1"
              >
                <AlertCircle className="h-3 w-3" />
                <span>{emailError}</span>
              </motion.p>
            )}
          </motion.div>

          {/* Password Input */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-10 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                passwordError 
                  ? 'border-red-300 bg-red-50' 
                  : loading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              required
              disabled={loading}
              autoComplete="new-password"
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
            
            {passwordError && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-600 text-xs mt-1 flex items-center space-x-1"
              >
                <AlertCircle className="h-3 w-3" />
                <span>{passwordError}</span>
              </motion.p>
            )}

            {/* Password Strength Indicator */}
            {password && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`w-20 h-1 rounded-full ${getPasswordStrengthColor()}`}></div>
                  <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span className={passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-400'}>
                      <CheckCircle className="h-3 w-3 inline" />
                    </span>
                    <span>Uppercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-400'}>
                      <CheckCircle className="h-3 w-3 inline" />
                    </span>
                    <span>Lowercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                      <CheckCircle className="h-3 w-3 inline" />
                    </span>
                    <span>Number</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}>
                      <CheckCircle className="h-3 w-3 inline" />
                    </span>
                    <span>Special character</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={passwordStrength.minLength ? 'text-green-600' : 'text-gray-400'}>
                      <CheckCircle className="h-3 w-3 inline" />
                    </span>
                    <span>8+ characters</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Confirm Password Input */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-10 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                confirmPasswordError 
                  ? 'border-red-300 bg-red-50' 
                  : loading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <motion.button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors duration-200"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </motion.button>
            
            {confirmPasswordError && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-600 text-xs mt-1 flex items-center space-x-1"
              >
                <AlertCircle className="h-3 w-3" />
                <span>{confirmPasswordError}</span>
              </motion.p>
            )}
          </motion.div>

          {/* Submit Error */}
          {submitError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <p className="text-red-600 text-sm flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{submitError}</span>
              </p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !username || !email || !password || !confirmPassword}
            className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
              loading || !username || !email || !password || !confirmPassword
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl active:bg-gray-900'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Create Account</span>
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
            Already have an account?{' '}
            <Link 
              to="/signin" 
              className="text-black font-medium hover:underline transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-600 hover:text-black text-sm font-medium hover:underline transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </motion.div>

        {/* Development Mode Demo */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <p className="text-xs text-blue-800 text-center">
              🔧 <strong>Demo:</strong> Use unique username/email for registration
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Custom Toast Styling */}
      <style jsx global>{`
        .react-hot-toast {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .react-hot-toast .Toastify__toast--success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        .react-hot-toast .Toastify__toast--error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
      `}</style>
    </div>
  );
}