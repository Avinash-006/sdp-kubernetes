import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../../config';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const otpRefs = useRef([]);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP Entry, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Individual OTP digits
  const [enteredOtp, setEnteredOtp] = useState(''); // Complete OTP string
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    minLength: false
  });

  // Start OTP timer
  const startTimer = () => {
    setOtpTimer(120); // 2 minutes
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Email validation
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

  // OTP validation
  const validateOtp = () => {
    const otpString = otp.join('');
    if (!otpString || otpString.length !== 6) {
      setOtpError('Please enter a complete 6-digit OTP');
      return false;
    }
    setOtpError('');
    return true;
  };

  // Password validation
  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('New password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const minLength = value.length >= 8;

    setPasswordStrength({
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      minLength
    });

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar || !minLength) {
      setPasswordError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value) => {
    if (!value) {
      setConfirmPasswordError('Please confirm your new password');
      return false;
    }
    if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Handle individual OTP digit input
  const handleOtpChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);
    setEnteredOtp(newOtp.join(''));

    // Clear error when user starts typing
    if (otpError) setOtpError('');

    // Auto-focus next input
    if (numericValue && index < 5) {
      setTimeout(() => otpRefs.current[index + 1]?.focus(), 10);
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      setTimeout(() => handleOtpSubmit({ preventDefault: () => {} }), 300);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace handling
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setTimeout(() => otpRefs.current[index - 1]?.focus(), 10);
    }
    
    // Arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
    
    // Paste handling
    if (e.key === 'v' && e.ctrlKey) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const pastedData = text.replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < Math.min(pastedData.length, 6 - index); i++) {
          newOtp[index + i] = pastedData[i];
        }
        setOtp(newOtp);
        setEnteredOtp(newOtp.join(''));
        
        const lastFilledIndex = Math.min(index + pastedData.length - 1, 5);
        if (lastFilledIndex < 5) {
          setTimeout(() => otpRefs.current[lastFilledIndex + 1]?.focus(), 10);
        } else if (newOtp.every(digit => digit !== '')) {
          setTimeout(() => handleOtpSubmit({ preventDefault: () => {} }), 300);
        }
      }).catch(() => {
        // Fallback for older browsers
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < Math.min(pastedData.length, 6 - index); i++) {
          newOtp[index + i] = pastedData[i];
        }
        setOtp(newOtp);
        setEnteredOtp(newOtp.join(''));
      });
    }
  };

  const handleInputChange = (field, value) => {
    switch (field) {
      case 'email':
        setEmail(value);
        if (emailError) validateEmail(value);
        if (generalError) setGeneralError('');
        break;
      case 'newPassword':
        setNewPassword(value);
        validatePassword(value);
        if (confirmPassword && confirmPasswordError) validateConfirmPassword(confirmPassword);
        if (generalError) setGeneralError('');
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        if (confirmPasswordError) validateConfirmPassword(value);
        if (generalError) setGeneralError('');
        break;
      default:
        break;
    }
  };

  // FIXED: Simplified email submission - just send OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    setEmailError('');
    setGeneralError('');
    setOtpError('');
    
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address', {
        duration: 4000,
        position: 'top-center'
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Sending OTP to:', email);
      
      // Reset OTP state
      setOtp(['', '', '', '', '', '']);
      setEnteredOtp('');
      
      const response = await axios.post(
        `${config.url}/api/users/forgot-password`,
        null,
        {
          params: { email },
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000, // 60 seconds
        }
      );

      console.log('OTP sent:', response.data);
      
      toast.success('Verification code sent! Check your email (including spam folder).', {
        duration: 5000,
        position: 'top-center'
      });
      
      setStep(2);
      startTimer();
      
      // Focus first OTP input after short delay
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 500);
      
    } catch (error) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'Failed to send verification code.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Email not found. Please check and try again.';
        setEmailError('Email not registered');
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait before trying again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data || errorMessage;
        setEmailError(errorMessage);
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setGeneralError(errorMessage);
      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  // FIXED: OTP entry - just collect the code, no verification call needed
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    
    setOtpError('');
    setGeneralError('');
    
    if (!validateOtp()) {
      toast.error('Please enter a complete 6-digit code', {
        duration: 4000,
        position: 'top-center'
      });
      return;
    }

    const otpString = enteredOtp;
    console.log('OTP entered:', otpString);
    
    // Store the entered OTP and proceed to password step
    // The actual verification happens during password reset
    toast.success('Code accepted! Now create your new password.', {
      duration: 3000,
      position: 'top-center'
    });
    
    setStep(3);
    
    // Focus password input
    setTimeout(() => {
      const passwordInput = document.querySelector('input[type="password"]');
      passwordInput?.focus();
    }, 300);
  };

  // FIXED: Single password reset call with all parameters
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
    
    const isPasswordValid = validatePassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      toast.error('Please fix the password errors above', {
        duration: 4000,
        position: 'top-center'
      });
      return;
    }

    if (!enteredOtp || enteredOtp.length !== 6) {
      toast.error('Please enter the verification code first', {
        duration: 4000,
        position: 'top-center'
      });
      setStep(2);
      return;
    }

    setLoading(true);
    
    try {
      console.log('Resetting password for:', email, 'with OTP:', enteredOtp);
      
      // FIXED: Single call to reset-password with all required parameters
      const response = await axios.post(
        `${config.url}/api/users/reset-password`,
        null,
        {
          params: {
            email: email,
            otp: enteredOtp, // Use the entered OTP directly
            newPassword: newPassword
          },
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000, // 45 seconds
        }
      );

      console.log('Password reset success:', response.data);
      
      toast.success('Password reset successfully! Redirecting to sign in...', {
        duration: 4000,
        position: 'top-center'
      });

      // Reset all state and redirect
      setTimeout(() => {
        setStep(1);
        setEmail('');
        setOtp(['', '', '', '', '', '']);
        setEnteredOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setEmailError('');
        setOtpError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setGeneralError('');
        navigate('/signin');
      }, 2500);
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to reset password.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('Reset error details:', { status, data });
        
        switch (status) {
          case 400:
            if (data && (data.includes('OTP') || data.includes('No OTP found'))) {
              errorMessage = 'Invalid or expired verification code. Please request a new one.';
              setOtpError(errorMessage);
              setStep(2);
            } else if (data && data.includes('password')) {
              errorMessage = data;
              setPasswordError(errorMessage);
            } else {
              errorMessage = data || 'Invalid request. Please try again.';
              setGeneralError(errorMessage);
            }
            break;
          case 404:
            errorMessage = 'Email not found. Please start over.';
            setStep(1);
            setGeneralError(errorMessage);
            break;
          case 409:
            errorMessage = 'Password reset conflict. Please try again.';
            setGeneralError(errorMessage);
            break;
          case 429:
            errorMessage = 'Too many attempts. Please wait before trying again.';
            setGeneralError(errorMessage);
            break;
          default:
            errorMessage = data || errorMessage;
            setGeneralError(errorMessage);
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
        setGeneralError(errorMessage);
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
        setGeneralError(errorMessage);
      }

      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpTimer > 0) {
      toast.error(`Please wait ${otpTimer}s before requesting another code`, {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }
    
    setOtpError('');
    setGeneralError('');
    
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address', {
        duration: 4000,
        position: 'top-center'
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Resending OTP to:', email);
      
      await axios.post(
        `${config.url}/api/users/resend-otp`,
        null,
        {
          params: { email },
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000,
        }
      );
      
      toast.success('New verification code sent!', {
        duration: 5000,
        position: 'top-center'
      });
      
      // Reset OTP inputs
      setOtp(['', '', '', '', '', '']);
      setEnteredOtp('');
      startTimer();
      
      // Focus first input
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 500);
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      let errorMessage = 'Failed to resend code.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Email not found. Please check and try again.';
        setEmailError('Email not registered');
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait before trying again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data || errorMessage;
        setEmailError(errorMessage);
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setGeneralError(errorMessage);
      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Password';
      case 2: return 'Enter Verification Code';
      case 3: return 'Create New Password';
      default: return 'Reset Password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Enter your registered email address';
      case 2: return `Enter the 6-digit code sent to ${email}`;
      case 3: return `Create a new password for ${email}`;
      default: return 'Reset your password';
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      switch (step) {
        case 1:
          handleEmailSubmit(e);
          break;
        case 3:
          handlePasswordReset(e);
          break;
      }
    }
  };

  // Clear errors when step changes
  useEffect(() => {
    setGeneralError('');
    setOtpError('');
  }, [step]);

  // Initialize OTP refs
  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6);
  }, []);

  // Focus management
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

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
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">{getStepTitle()}</h1>
          <p className="text-gray-600">{getStepDescription()}</p>
          
          {/* Step indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <motion.div
                key={stepNum}
                initial={false}
                animate={{ 
                  scale: step === stepNum ? [1, 1.1, 1] : 1 
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  step >= stepNum ? 'bg-black' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleEmailSubmit}
            className="space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
              <input
                type="email"
                placeholder="Enter your email address"
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

            {generalError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-red-600 text-sm flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{generalError}</span>
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !email}
              className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
                loading || !email
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                  : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Send Code</span>
                </>
              )}
            </motion.button>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500 text-center"
            >
              We'll send a 6-digit code to your email
            </motion.p>
          </motion.form>
        )}

        {/* Step 2: OTP Entry */}
        {step === 2 && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleOtpSubmit}
            className="space-y-6"
          >
            <motion.div className="text-center mb-6 animate-slide-up">
              <p className="text-gray-600 text-sm mb-2">
                Enter the 6-digit code sent to:
              </p>
              <p className="font-medium text-black bg-gray-100 px-3 py-1 rounded-full inline-block">
                {email}
              </p>
            </motion.div>

            {/* Circular OTP Inputs */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex justify-center space-x-3 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    className={`w-14 h-14 text-xl font-mono rounded-full border-2 text-center focus:outline-none focus:ring-4 focus:ring-black/10 transition-all duration-200 ${
                      otpError 
                        ? 'border-red-400 bg-red-50' 
                        : digit 
                        ? 'border-green-400 bg-green-50' 
                        : loading 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={loading}
                    placeholder=""
                    style={{ 
                      fontSize: '1.25rem',
                      letterSpacing: '1px'
                    }}
                  />
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(enteredOtp.length / 6) * 100}%` }}
                />
              </div>
              
              {otpError && (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-xs flex items-center justify-center space-x-1 mt-2"
                >
                  <AlertCircle className="h-3 w-3" />
                  <span>{otpError}</span>
                </motion.p>
              )}
            </motion.div>
            
            {/* Timer & Resend */}
            <motion.div className="text-center space-y-3">
              <motion.div 
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  otpTimer > 0 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200 cursor-pointer'
                }`}
                whileHover={otpTimer === 0 ? { scale: 1.02 } : {}}
                onClick={otpTimer > 0 ? undefined : resendOtp}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                ) : otpTimer > 0 ? (
                  <>
                    <Clock className={`h-4 w-4 ${otpTimer < 20 ? 'animate-pulse' : ''}`} />
                    <span className="font-mono">{Math.floor(otpTimer/60)}:{(otpTimer%60).toString().padStart(2, '0')}</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Send New Code</span>
                  </>
                )}
              </motion.div>
              
              <p className="text-xs text-gray-500">
                Code expires in {Math.floor(otpTimer/60)}:{(otpTimer%60).toString().padStart(2, '0')}
              </p>
            </motion.div>

            {generalError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-red-600 text-sm flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{generalError}</span>
                </p>
              </motion.div>
            )}

            <div className="flex space-x-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp(['', '', '', '', '', '']);
                  setEnteredOtp('');
                  setOtpTimer(0);
                  setOtpError('');
                  setGeneralError('');
                }}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white hover:bg-gray-700 transition-all duration-300 rounded-full py-3 font-medium text-sm flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || enteredOtp.length !== 6}
                className={`flex-1 py-3 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
                  loading || enteredOtp.length !== 6
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                    : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Continue</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handlePasswordReset}
            className="space-y-6"
          >
            <motion.div className="text-center mb-6 animate-slide-up">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                Verification successful! Create your new password:
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password (8+ characters)"
                value={newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
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
              {newPassword && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Password Strength</span>
                    <div className={`w-20 h-2 rounded-full overflow-hidden bg-gray-200`}>
                      <motion.div 
                        className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
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

            {generalError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-red-600 text-sm flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{generalError}</span>
                </p>
              </motion.div>
            )}

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setStep(2);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setConfirmPasswordError('');
                  setGeneralError('');
                  // Focus first OTP input
                  setTimeout(() => otpRefs.current[0]?.focus(), 100);
                }}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white hover:bg-gray-700 transition-all duration-300 rounded-full py-3 font-medium text-sm flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || enteredOtp.length !== 6}
                className={`flex-1 py-3 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
                  loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || enteredOtp.length !== 6
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                    : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </motion.button>
            </div>

            {!loading && (
              <motion.div className="text-xs text-gray-500 space-y-1 mt-4">
                <p className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>8+ characters, 1 uppercase, 1 lowercase, 1 number, 1 special character</span>
                </p>
              </motion.div>
            )}
          </motion.form>
        )}

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6 space-y-2 pt-6 border-t border-gray-200"
        >
          <p className="text-gray-600 text-sm">
            Remembered your password?{' '}
            <Link to="/signin" className="text-black font-medium hover:underline">
              Sign In
            </Link>
          </p>
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-black text-sm font-medium hover:underline">
            ← Back to Home
          </Link>
        </motion.div>
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