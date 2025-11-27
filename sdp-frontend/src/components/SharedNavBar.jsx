import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Folder, Share2, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SharedNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberUser');
    navigate('/signin');
  };

  const isActive = (path) => location.pathname === path;

  if (!user || !user.username) {
    return null; // Don't show navbar if user is not logged in
  }

  return (
    <nav className="border-b border-gray-200/50 backdrop-blur-sm bg-white/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent cursor-pointer" onClick={() => navigate('/profile')}>
              Swiftyy
            </div>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/chat")}
              className={`border-2 rounded-full px-4 py-2 font-medium flex items-center space-x-2 transition-all duration-300 ease-out ${
                isActive('/chat')
                  ? 'bg-black text-white border-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/drive")}
              className={`border-2 rounded-full px-4 py-2 font-medium flex items-center space-x-2 transition-all duration-300 ease-out ${
                isActive('/drive')
                  ? 'bg-black text-white border-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <Folder className="h-4 w-4" />
              <span>Drive</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/pass-share")}
              className={`border-2 rounded-full px-4 py-2 font-medium flex items-center space-x-2 transition-all duration-300 ease-out ${
                isActive('/pass-share')
                  ? 'bg-black text-white border-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/profile")}
              className={`border-2 rounded-full px-4 py-2 font-medium flex items-center space-x-2 transition-all duration-300 ease-out ${
                isActive('/profile')
                  ? 'bg-black text-white border-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="bg-black text-white hover:bg-gray-800 hover:scale-110 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-4 py-2 font-medium flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
