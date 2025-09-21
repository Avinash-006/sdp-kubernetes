import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../../config';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Start OTP timer
  const startTimer = () => {
    setOtpTimer(60);
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Sending OTP to email:', email);
      
      const response = await axios.post(`${config.url}/api/users/forgot-password`, {
        email: email
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('OTP sent response:', response.data);
      toast.success('OTP sent to your email!');
      setStep(2);
      startTimer();
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data || 
        error.message || 
        'Failed to send OTP';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Verifying OTP:', { email, otp });
      
      const response = await axios.post(`${config.url}/api/users/verify-otp`, {
        email: email,
        otp: otp
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('OTP verified:', response.data);
      toast.success('OTP verified successfully!');
      setStep(3);
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data || 
        error.message || 
        'Invalid OTP';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Resetting password for:', email);
      
      const response = await axios.post(`${config.url}/api/users/reset-password`, {
        email: email,
        otp: otp,
        newPassword: newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Password reset response:', response.data);
      toast.success('Password reset successfully!');
      
      // Redirect to sign in page after successful reset
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data || 
        error.message || 
        'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpTimer > 0) return;
    
    setLoading(true);
    try {
      await axios.post(`${config.url}/api/users/forgot-password`, {
        email: email
      });
      toast.success('OTP resent to your email!');
      startTimer();
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Password';
      case 2: return 'Verify OTP';
      case 3: return 'New Password';
      default: return 'Reset Password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Enter your email to receive an OTP';
      case 2: return 'Enter the OTP sent to your email';
      case 3: return 'Create your new password';
      default: return 'Reset your password';
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-4 py-8 bg-gray-50 rounded-3xl shadow-lg animate-fade-in"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold">{getStepTitle()}</h1>
          <p className="text-gray-600 mt-2">{getStepDescription()}</p>
          
          {/* Step indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full ${
                  step >= stepNum ? 'bg-black' : 'bg-gray-300'
                } transition-all duration-300`}
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
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md text-sm"
                required
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full bg-black text-white hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-3 font-medium text-sm ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </motion.button>
          </motion.form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleOtpSubmit}
            className="space-y-6"
          >
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">
                OTP sent to: <span className="font-medium text-black">{email}</span>
              </p>
            </div>
            <div className="relative">
              <KeyRound className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md text-sm text-center tracking-widest"
                maxLength={6}
                required
              />
            </div>
            
            <div className="text-center">
              {otpTimer > 0 ? (
                <p className="text-gray-600 text-sm">
                  Resend OTP in {otpTimer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading}
                  className="text-black hover:underline text-sm font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-600 text-white hover:bg-gray-700 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-3 font-medium text-sm"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`flex-1 bg-black text-white hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-3 font-medium text-sm ${
                  loading || otp.length !== 6 ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
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
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-sm text-center">
                Passwords do not match
              </p>
            )}

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-600 text-white hover:bg-gray-700 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-3 font-medium text-sm"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className={`flex-1 bg-black text-white hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-3 font-medium text-sm ${
                  loading || !newPassword || !confirmPassword || newPassword !== confirmPassword ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </div>
          </motion.form>
        )}

        {/* Footer links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-center text-gray-600 text-sm">
            Remember your password?{' '}
            <Link to="/signin" className="text-black font-medium hover:underline">
              Sign In
            </Link>
          </p>
          <p className="text-center text-gray-600 text-sm">
            <Link to="/" className="text-black font-medium hover:underline">
              Back to Home
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}