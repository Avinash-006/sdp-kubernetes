import React, { useState } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration Data', { username, email, password });
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
      <div className="max-w-md w-full px-4 py-8 bg-gray-50 rounded-3xl shadow-lg animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Register for Swiftyy</h1>
          <p className="text-gray-600 mt-2">Create your account to start sharing</p>
        </div>
        <div className="space-y-6">
          <div className="relative">
            <User className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md"
            />
          </div>
          <div className="relative">
            <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md"
            />
          </div>
          <div className="relative">
            <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all hover:shadow-md"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-black text-white hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-3 font-medium"
          >
            Register
          </button>
        </div>
        <p className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/signin" className="text-black font-medium hover:underline">
            Sign In
          </Link>
        </p>
        <p className="text-center text-gray-600 mt-2">
          <Link to="/" className="text-black font-medium hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}