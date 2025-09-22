import React, { useState, useEffect } from 'react';
import { User, Trash2, PlusCircle, Search, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../../config';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.url}/api/users/viewall`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      setUsers(response.data);
      console.log('Fetched users:', response.data);
    } catch (error) {
      handleError(error, 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error('All fields are required', { duration: 3000, position: 'top-center' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${config.url}/api/users/add`, newUser, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      toast.success('User added successfully! 🎉', { duration: 4000, position: 'top-center' });
      setUsers([...users, { ...newUser, id: response.data.id }]);
      setNewUser({ username: '', email: '', password: '', admin: false });
      setAddUserModalOpen(false);
    } catch (error) {
      handleError(error, 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const adminId = JSON.parse(localStorage.getItem('user'))?.id;
    if (!adminId) {
      toast.error('Admin session not found', { duration: 3000, position: 'top-center' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${config.url}/api/users/admin/delete/${adminId}/${userId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      setUsers(users.filter((user) => user.id !== userId));
      toast.success('User deleted successfully', { duration: 4000, position: 'top-center' });
    } catch (error) {
      handleError(error, 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error, defaultMessage) => {
    console.error('Error:', error);
    let errorMessage = defaultMessage;

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          errorMessage = 'Unauthorized action';
          break;
        case 403:
          errorMessage = 'Only admins can perform this action';
          break;
        case 404:
          errorMessage = 'User or resource not found';
          break;
        case 409:
          errorMessage = data || 'Username or email already taken';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = data || defaultMessage;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please check your connection.';
    } else if (error.request) {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    toast.error(errorMessage, { duration: 6000, position: 'top-center' });
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
        className="max-w-4xl w-full px-6 py-8 bg-gray-50 rounded-3xl shadow-lg animate-fade-in"
      >
        {/* Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8 animate-slide-up"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4 mx-auto">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users for Swiftyy</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
          <input
            type="text"
            placeholder="Search users by username or email"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm hover:border-gray-300 hover:shadow-md bg-white"
            disabled={loading}
          />
        </motion.div>

        {/* Add User Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAddUserModalOpen(true)}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl active:bg-gray-900'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New User</span>
          </motion.button>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-x-auto"
        >
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs uppercase bg-gray-200 rounded-lg">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white border-b hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">{user.id}</td>
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">{user.admin ? 'Admin' : 'User'}</td>
                    <td className="px-6 py-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={loading}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>

        {/* Add User Modal */}
        {addUserModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gray-50 rounded-3xl p-6 max-w-md w-full shadow-lg"
            >
              <h2 className="text-2xl font-bold text-black mb-4">Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="relative">
                  <User className="absolute top-3 left-3 h-5 w-5 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm hover:border-gray-300 hover:shadow-md bg-white"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm hover:border-gray-300 hover:shadow-md bg-white"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm hover:border-gray-300 hover:shadow-md bg-white"
                    disabled={loading}
                    required
                  />
                </div>
                <label className="flex items-center text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newUser.admin}
                    onChange={(e) => setNewUser({ ...newUser, admin: e.target.checked })}
                    className="mr-2 rounded border-gray-400 text-black focus:ring-black w-4 h-4 transition-all duration-200"
                    disabled={loading}
                  />
                  <span className="hover:text-gray-800 transition-colors">Admin Role</span>
                </label>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                        : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl active:bg-gray-900'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" />
                        <span>Add User</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setAddUserModalOpen(false)}
                    disabled={loading}
                    className="flex-1 py-3 rounded-full font-medium text-sm bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

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
      </motion.div>
    </div>
  );
}