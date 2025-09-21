import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SwiftyyLanding from './LandingPage';
import SignIn from './SignIn';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import Profile from './Profile';
export default function NavBar() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SwiftyyLanding />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/profile" element={<SignIn />} />
        <Route path="/register" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  )
}