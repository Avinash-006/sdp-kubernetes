import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SwiftyyLanding from './LandingPage';
import SignIn from './SignIn';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import Profile from './Profile';
import Drive from './Drive';
import AdminDashboard from './AdminDashboard';
import PassShare from './PassShare';
import { Toaster } from 'react-hot-toast'; // Added Toaster import

export default function NavBar() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" /> {/* Added Toaster component */}
      <Routes>
        <Route path="/" element={<SwiftyyLanding />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/drive" element={<Drive />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pass-share" element={<PassShare />} />
      </Routes>
    </BrowserRouter>
  );
}