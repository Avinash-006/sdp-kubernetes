
import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
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

  useEffect(() => {
    const generateCode = () => {
      const code = Math.floor(100 + Math.random() * 900).toString();
      setCaptchaCode(code);
      console.log('Generated CAPTCHA:', code);
    };
    generateCode();
  }, []);

  const verifyCaptcha = () => {
    console.log('Verifying CAPTCHA:', { input: captchaInput, code: captchaCode });
    if (captchaInput === captchaCode) {
      setCaptchaVerified(true);
      toast.success('CAPTCHA verified!');
    } else {
      setCaptchaInput('');
      setCaptchaCode(Math.floor(100 + Math.random() * 900).toString());
      toast.error('Incorrect CAPTCHA. Try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaVerified) {
      toast.error('Please verify CAPTCHA first');
      return;
    }

    setLoading(true);
    try {
      const isEmail = usernameOrEmail.includes('@');
      const loginData = {
        username: isEmail ? null : usernameOrEmail,
        email: isEmail ? usernameOrEmail : null,
        password: password,
      };
      console.log('Sending login request:', loginData);

      const response = await axios.post(`${config.url}/api/users/login`, loginData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const user = response.data;
      console.log('Login response:', user);

      if (user && user.id && user.username) {
        // Store user data in localStorage instead of AuthContext
        const userData = { id: user.id, username: user.username, isAdmin: user.admin };
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Stored user in localStorage:', userData);
        toast.success('Login successful');

        if (user.admin) {
          console.log('Navigating to /admin-dashboard');
          navigate('/admin-dashboard', { replace: true });
        } else {
          console.log('Navigating to /pass-share');
          navigate('/pass-share', { replace: true });
        }
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data ||
        error.response?.data?.message ||
        error.message ||
        'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold">Sign In to Swiftyy</h1>
          <p className="text-gray-600 mt-2">Access your account securely</p>
        </motion.div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Username or Email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md text-sm"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-gray-600 mb-2 text-sm">Verify you're not a bot</p>
              <div className="bg-gray-200 p-2 rounded-lg inline-block">
                <span className="text-black text-lg font-mono">
                  {captchaVerified ? '✓ Verified' : captchaCode}
                </span>
              </div>
            </div>
            {!captchaVerified && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter CAPTCHA code"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md text-sm"
                  maxLength={3}
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={verifyCaptcha}
                  className="w-full bg-gray-600 text-white hover:bg-gray-700 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-2 font-medium text-sm"
                >
                  Verify CAPTCHA
                </motion.button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600">
              <input
                type="checkbox"
                className="mr-2 rounded border-gray-400 text-black focus:ring-black"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-black hover:underline">
              Forgot password?
            </Link>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !captchaVerified}
            className={`w-full bg-black text-white hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-3 font-medium text-sm ${
              loading || !captchaVerified ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </motion.button>
        </form>
        <p className="text-center text-gray-600 mt-4 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-black font-medium hover:underline">
            Register
          </Link>
        </p>
        <p className="text-center text-gray-600 mt-2 text-sm">
          <Link to="/" className="text-black font-medium hover:underline">
            Back to Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
