import { useState, useEffect } from 'react';
import { Camera, Mail, Lock, Bell, Shield, Download, Upload } from 'lucide-react';

export const Profile = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    username: 'John Doe',
    email: 'john.doe@example.com',
    avatar: null,
    userId: '12345',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG, or GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Profile picture must be less than 5MB');
      return;
    }

    // Create preview URL
    const newAvatar = URL.createObjectURL(file);
    setUserData((prev) => ({
      ...prev,
      avatar: newAvatar,
    }));
  };

  const handleSave = async () => {
    if (!userData.username.trim() || !userData.email.trim()) {
      alert('Username and email cannot be empty');
      return;
    }

    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      alert('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      alert('New password and confirmation do not match');
      return;
    }

    const minLength = 8;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*]/;
    if (
      passwordData.newPassword.length < minLength ||
      !hasNumber.test(passwordData.newPassword) ||
      !hasSpecialChar.test(passwordData.newPassword)
    ) {
      alert('New password must be at least 8 characters, include a number, and a special character');
      return;
    }

    alert('Password updated successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Mail },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const stats = [
    { icon: Upload, label: 'Uploaded', value: '24' },
    { icon: Download, label: 'Downloaded', value: '156' },
    { icon: Shield, label: 'Protected Files', value: '18' },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-delay {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-fade-in-delay {
          animation: fade-in-delay 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>

      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">Swiftyy</div>
            <div className="flex space-x-3">
              <button className="border-2 border-black text-black hover:bg-black hover:text-white hover:scale-110 hover:shadow-lg transition-all duration-300 ease-out rounded-full px-6 py-2 font-medium">
                Dashboard
              </button>
              <button className="bg-black text-white hover:bg-gray-800 hover:scale-110 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-2 font-medium">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl p-8 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 hover:border-black transition-colors duration-300 overflow-hidden">
                <img
                  src={userData.avatar || '/api/placeholder/128/128'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-pic-upload"
              />
              <label
                htmlFor="profile-pic-upload"
                className="absolute bottom-2 right-2 p-3 bg-black rounded-full text-white hover:bg-gray-800 hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
              </label>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{userData.username}</h1>
              <p className="text-gray-600 text-lg">{userData.email}</p>
            </div>
            
            <button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              className="bg-black text-white hover:bg-gray-800 hover:scale-110 hover:shadow-xl hover:rotate-1 transition-all duration-300 ease-out px-8 py-3 rounded-full text-lg font-medium"
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-all duration-300 hover:-translate-y-2"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 hover:scale-125 hover:rotate-12 transition-all duration-300 cursor-pointer" />
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden animate-fade-in-delay">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-8 py-6 transition-all duration-300 hover:bg-gray-50 ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Username
                  </label>
                  <input
                    type="text"
                    value={userData.username}
                    onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-black focus:bg-white transition-all duration-300 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-black focus:bg-white transition-all duration-300 disabled:bg-gray-100"
                  />
                </div>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="w-full bg-black text-white hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 py-4 rounded-2xl text-lg font-medium mt-6"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
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
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-black focus:bg-white transition-all duration-300"
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
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-black focus:bg-white transition-all duration-300"
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
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 px-6 text-lg focus:border-black focus:bg-white transition-all duration-300"
                  />
                </div>
                <button
                  onClick={handlePasswordUpdate}
                  className="w-full bg-black text-white hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 py-4 rounded-2xl text-lg font-medium"
                >
                  Update Password
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-300">
                  <div>
                    <h3 className="font-semibold text-lg">Email Notifications</h3>
                    <p className="text-gray-600">Receive email updates about your activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-300">
                  <div>
                    <h3 className="font-semibold text-lg">Push Notifications</h3>
                    <p className="text-gray-600">Get notified about file shares and downloads</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-300">
                  <div>
                    <h3 className="font-semibold text-lg">Profile Visibility</h3>
                    <p className="text-gray-600">Control who can see your profile information</p>
                  </div>
                  <select className="bg-white border-2 border-gray-200 rounded-xl py-2 px-4 font-medium focus:border-black transition-colors duration-300">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-300">
                  <div>
                    <h3 className="font-semibold text-lg">Data Sharing</h3>
                    <p className="text-gray-600">Allow anonymous usage analytics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
                  </label>
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