import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SwiftyyLanding from './LandingPage';
import SignIn from './SignIn';
import Register from './Register';

export default function NavBar() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SwiftyyLanding />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}
