import { useState, useEffect } from 'react';
import { Camera, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import config from '../../config';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const API_BASE_URL = `${config.url}/api/users`;

  // Password validation regex patterns
  const passwordRegex = {
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
    hasUppercase: /[A-Z]/,
  };

  // Fetch user data on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
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

    // Fetch updated user data from API
    if (token) {
      fetchUserData(user.id, token);
    } else {
      console.warn('No token found in localStorage');
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (userId, token) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/view/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const user = response.data;
      const newUserData = {
        id: user.id,
        username: user.username,
        email: user.email,
        userId: user.id,
        isAdmin: user.isAdmin || false,
        profilePicture: user.profilePicture ? `data:image/jpeg;base64,${user.profilePicture}` : null,
        avatar: null,
      };
      setUserData(newUserData);
      localStorage.setItem('user', JSON.stringify({
        id: newUserData.id,
        username: newUserData.username,
        email: newUserData.email,
        isAdmin: newUserData.isAdmin,
      }));
    } catch (error) {
      console.error('Error fetching user data:', error.response?.data || error.message);
      showNotification('error', 'Failed to load profile data. Using cached data.');
      if (error.response?.status === 401) {
        console.warn('Unauthorized access, token may be invalid or expired');
        showNotification('error', 'Session expired. Please sign in again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberUser');
        navigate('/signin');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    await uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file) => {
    if (!userData.id) {
      showNotification('error', 'User ID not found');
      return;
    }
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please sign in again');
        navigate('/signin');
        return;
      }
      await axios.post(
        `${API_BASE_URL}/update-profile-picture/${userData.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showNotification('success', 'Profile picture updated successfully!');
      fetchUserData(userData.id, token);
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        showNotification('error', error.response.data.message || 'Failed to upload profile picture');
      } else if (error.response?.status === 401) {
        showNotification('error', 'Session expired. Please sign in again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberUser');
        navigate('/signin');
      } else {
        showNotification('error', 'Failed to upload profile picture');
      }
      setUserData(prev => ({ ...prev, avatar: prev.profilePicture }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userData.username.trim() || !userData.email.trim()) {
      showNotification('error', 'Username and email cannot be empty');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please sign in again');
        navigate('/signin');
        return;
      }
      const updateData = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        isAdmin: userData.isAdmin,
      };
      const response = await axios.put(`${API_BASE_URL}/update`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.includes('successfully')) {
        showNotification('success', 'Profile updated successfully!');
        setIsEditing(false);
        localStorage.setItem('user', JSON.stringify({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          isAdmin: userData.isAdmin,
        }));
        fetchUserData(userData.id, token);
      } else {
        showNotification('error', response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      if (error.response?.status === 409) {
        showNotification('error', error.response.data.message || 'Profile update conflict');
      } else if (error.response?.status === 401) {
        showNotification('error', 'Session expired. Please sign in again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberUser');
        navigate('/signin');
      } else {
        showNotification('error', 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      showNotification('error', 'All password fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showNotification('error', 'New password and confirmation do not match');
      return;
    }
    const minLength = 8;
    const hasNumber = passwordRegex.hasNumber.test(passwordData.newPassword);
    const hasSpecialChar = passwordRegex.hasSpecialChar.test(passwordData.newPassword);
    const hasUppercase = passwordRegex.hasUppercase.test(passwordData.newPassword);
    if (
      passwordData.newPassword.length < minLength ||
      !hasNumber ||
      !hasSpecialChar ||
      !hasUppercase
    ) {
      showNotification('error', 'New password must be at least 8 characters, include uppercase, number, and special character');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please sign in again');
        navigate('/signin');
        return;
      }
      const response = await axios.put(`${API_BASE_URL}/update-password/${userData.id}`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        showNotification('success', 'Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else {
        showNotification('error', response.data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        showNotification('error', 'Current password is incorrect or session expired');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberUser');
        navigate('/signin');
      } else if (error.response?.status === 400) {
        showNotification('error', error.response.data.message || 'Invalid password format');
      } else {
        showNotification('error', 'Failed to update password');
      }
    }
  };

  const getPasswordStrength = () => {
    if (!passwordData.newPassword) return { strength: 'empty', label: 'Enter password' };
    const length = passwordData.newPassword.length >= 8;
    const hasNumber = passwordRegex.hasNumber.test(passwordData.newPassword);
    const hasSpecialChar = passwordRegex.hasSpecialChar.test(passwordData.newPassword);
    const hasUppercase = passwordRegex.hasUppercase.test(passwordData.newPassword);
    const checks = [length, hasNumber, hasSpecialChar, hasUppercase];
    const passed = checks.filter(Boolean).length;
    if (passed === 4) return { strength: 'strong', label: 'Strong' };
    if (passed >= 2) return { strength: 'medium', label: 'Medium' };
    return { strength: 'weak', label: 'Weak' };
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
      tabContent.scrollTo(0, 0);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberUser');
    navigate('/signin');
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Security', icon: Mail },
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

  const passwordStrength = getPasswordStrength();

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
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 0 30px rgba(0,0,0,0.2); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
        }
        .pulse-glow {
          animation: pulse-glow 2s infinite;
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
      <nav className="border-b border-gray-200/50 backdrop-blur-sm bg-white/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">
                Swiftyy
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate("/drive")}
                className="border-2 border-black text-black hover:bg-black hover:text-white hover:scale-110 hover:shadow-lg transition-all duration-300 ease-out rounded-full px-6 py-2 font-medium flex items-center space-x-2"
              >
                <span>Drive</span>
              </button>
              <button
                onClick={handleSignOut}
                className="bg-black text-white hover:bg-gray-800 hover:scale-110 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-2 font-medium flex items-center space-x-2"
              >
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl p-8 mb-8 animate-fade-in overflow-hidden">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-blue-50 p-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,#e0e7ff_0%,transparent_50%)]"></div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_75%_25%,#dbeafe_0%,transparent_50%)]"></div>
            </div>
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
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  disabled={isSaving}
                  className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center space-x-3 ${
                    isEditing
                      ? isSaving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105'
                      : 'border-2 border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden animate-slide-in">
          <div className="flex border-b border-gray-200/50 bg-white/50">
            {tabs.map((tab, index) => (
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
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                      disabled={!isEditing || isSaving}
                      className={`w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:bg-white transition-all duration-300 ${
                        isEditing ? 'hover:border-gray-300' : 'cursor-not-allowed opacity-70'
                      }`}
                      placeholder="Enter your username"
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
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      disabled={!isEditing || isSaving}
                      className={`w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:bg-white transition-all duration-300 ${
                        isEditing ? 'hover:border-gray-300' : 'cursor-not-allowed opacity-70'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                      <span>Bio</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-3 px-4 text-base backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:bg-white transition-all duration-300 resize-none"
                      disabled
                    />
                  </div>
                </div>
                {/* Security Section */}
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Lock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Password Security</h3>
                    <p className="text-gray-600 max-w-md mx-auto text-sm">
                      Update your password to keep your account secure. We recommend using a strong, unique password.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:bg-white transition-all duration-300"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:bg-white transition-all duration-300"
                        placeholder="Create a new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmNewPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                        }
                        className="w-full bg-white/50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:bg-white transition-all duration-300"
                        placeholder="Confirm new password"
                      />
                    </div>
                    {passwordData.newPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                passwordStrength.strength === 'strong'
                                  ? 'bg-green-500'
                                  : passwordStrength.strength === 'medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((passwordData.newPassword.length / 12) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength.strength === 'strong' ? 'text-green-600' :
                            passwordStrength.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className={`flex items-center space-x-2 ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${passwordRegex.hasNumber.test(passwordData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordRegex.hasNumber.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span>Contains a number</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${passwordRegex.hasSpecialChar.test(passwordData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordRegex.hasSpecialChar.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span>Contains special character</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${passwordRegex.hasUppercase.test(passwordData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordRegex.hasUppercase.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span>Contains uppercase letter</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handlePasswordUpdate}
                      disabled={!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmNewPassword}
                      className={`w-full py-4 rounded-2xl text-lg font-semibold flex items-center justify-center space-x-3 transition-all duration-300 ${
                        passwordData.newPassword && passwordData.newPassword === passwordData.confirmNewPassword
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                      <span>Update Password</span>
                    </button>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                      <span>Forgot Password?</span>
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 disabled:from-gray-400 disabled:to-gray-500 text-white hover:scale-105 hover:shadow-2xl transition-all duration-300 py-4 rounded-2xl text-lg font-semibold flex items-center justify-center space-x-3 ${
                      isSaving ? 'cursor-not-allowed' : 'hover:rotate-1'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;