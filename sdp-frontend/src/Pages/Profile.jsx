import { useState, useEffect } from 'react';
import { Camera, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import SharedNavBar from '../components/SharedNavBar';
import config from '../../config';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAlert, setShowAlert] = useState({ type: '', message: '', show: false });
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: null,
    username: '',
    email: '',
    avatar: null,
    profilePicture: null,
    userId: null,
    isAdmin: false,
  });

  // Load user data from localStorage only
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.warn('No user data found in localStorage');
      showNotification('error', 'Please sign in to view your profile');
      navigate('/signin');
      return;
    }

    const user = JSON.parse(storedUser);
    if (!user.id || !user.username) {
      console.warn('Invalid user data in localStorage:', user);
      showNotification('error', 'Invalid user data. Please sign in again.');
      navigate('/signin');
      return;
    }

    // Set initial user data from localStorage
    setUserData({
      id: user.id,
      username: user.username,
      email: user.email || '',
      userId: user.id,
      isAdmin: user.isAdmin || false,
      profilePicture: null,
      avatar: null,
    });

    setIsLoading(false);
  }, []);

  const showNotification = (type, message) => {
    setShowAlert({ type, message, show: true });
    setTimeout(() => setShowAlert(prev => ({ ...prev, show: false })), 4000);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showNotification('error', 'Please upload a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Profile picture must be less than 5MB');
      return;
    }

    const newAvatar = URL.createObjectURL(file);
    setUserData((prev) => ({
      ...prev,
      avatar: newAvatar,
      profilePictureFile: file,
    }));

    // Just simulate upload (local only, no fetch)
    setIsUploading(true);
    setTimeout(() => {
      showNotification('success', 'Profile picture updated locally!');
      setIsUploading(false);
    }, 1000);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
      tabContent.scrollTo(0, 0);
    }
  };


  const tabs = [
    { id: 'profile', label: 'Profile', icon: Mail },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-black" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 text-black">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
        }
      `}</style>
      {showAlert.show && (
        <div className={`fixed top-4 right-4 z-50 animate-fade-in transition-all duration-300 ${
          showAlert.type === 'success'
            ? 'bg-green-500'
            : 'bg-red-500'
        } text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm`}>
          <div className="flex items-center space-x-3">
            {showAlert.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{showAlert.message}</span>
          </div>
        </div>
      )}
      <SharedNavBar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl p-8 mb-8 animate-fade-in overflow-hidden">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-blue-50 p-8">
            <div className="relative z-10 flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
              <div className="relative group">
                <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${
                  isUploading
                    ? 'border-blue-300 animate-pulse'
                    : 'border-gray-200 hover:border-black/50 group-hover:border-blue-300'
                } transition-all duration-300 bg-gradient-to-br from-white to-gray-50 shadow-lg`}>
                  <img
                    src={userData.avatar || userData.profilePicture || '/api/placeholder/144/144?text=👤'}
                    alt="Profile"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="profile-pic-upload"
                />
                <label
                  htmlFor="profile-pic-upload"
                  className={`absolute -bottom-2 -right-2 p-3 bg-black rounded-full text-white hover:bg-gray-800 hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer shadow-lg ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={isUploading ? 'Uploading...' : 'Change Photo'}
                >
                  <Camera className="h-4 w-4" />
                </label>
              </div>
              <div className="flex-1 text-center lg:text-left lg:ml-8">
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {userData.username}
                </h1>
                <p className="text-gray-600 text-xl mb-1">{userData.email}</p>
                <p className="text-gray-500 text-sm">Member since 2024</p>
                {userData.isAdmin && (
                  <p className="text-blue-600 text-sm font-semibold">Administrator</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden animate-slide-in">
          <div className="flex border-b border-gray-200/50 bg-white/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex-1 flex items-center justify-center space-x-3 px-6 py-6 transition-all duration-300 group ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-black to-gray-900 text-white'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50/50'
                }`}
              >
                <tab.icon className={`h-5 w-5 transition-transform duration-300 ${activeTab === tab.id ? 'rotate-12 scale-110' : 'group-hover:rotate-6'}`} />
                <span className="font-semibold relative">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
          <div className="tab-content p-8 max-h-[600px] overflow-y-auto">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-fade-in">
                {/* General Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Profile Information</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>Username</span>
                    </label>
                    <input
                      type="text"
                      value={userData.username}
                      disabled
                      className="w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg backdrop-blur-sm cursor-not-allowed opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      className="w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg backdrop-blur-sm cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
