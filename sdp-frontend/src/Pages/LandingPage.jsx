
import React from 'react';
import { Upload, Shield, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SwiftyyLanding() {
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
        @keyframes fade-in-delay-2 {
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
        .animate-fade-in-delay-2 {
          animation: fade-in-delay-2 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
      `}</style>

      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">Swiftyy</div>
            <div className="flex space-x-3">
              <Link to="/signin">
                <button className="border-2 border-black text-black hover:bg-black hover:text-white hover:scale-110 hover:shadow-lg transition-all duration-300 ease-out rounded-full px-6 py-2 font-medium">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="bg-black text-white hover:bg-gray-800 hover:scale-110 hover:shadow-xl transition-all duration-300 ease-out rounded-full px-6 py-2 font-medium">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight animate-fade-in">
            Share Files
            <br />
            <span className="text-gray-600">Lightning Fast</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in-delay">
            The simplest way to share files securely. No registration required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-delay-2">
            <Link to="/register">
              <button className="bg-black text-white hover:bg-gray-800 hover:scale-110 hover:shadow-2xl hover:rotate-1 transition-all duration-300 ease-out px-8 py-4 rounded-full text-lg font-medium flex items-center justify-center">
                <Upload className="mr-2 h-5 w-5 animate-pulse" />
                Start Sharing
              </button>
            </Link>
            <button className="border-2 border-black text-black hover:bg-black hover:text-white hover:scale-110 hover:shadow-xl hover:-rotate-1 transition-all duration-300 ease-out px-8 py-4 rounded-full text-lg font-medium">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Swiftyy?</h2>
            <p className="text-lg text-gray-600">Built for speed, designed for simplicity</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:rotate-1 rounded-3xl">
              <div className="p-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-3 text-black hover:scale-125 hover:rotate-12 transition-all duration-300 cursor-pointer" />
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-gray-600 text-sm">Upload and share in seconds</p>
              </div>
            </div>
            <div className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:-rotate-1 rounded-3xl">
              <div className="p-6 text-center">
                <Shield className="h-8 w-8 mx-auto mb-3 text-black hover:scale-125 hover:rotate-12 transition-all duration-300 cursor-pointer" />
                <h3 className="font-semibold mb-2">Secure</h3>
                <p className="text-gray-600 text-sm">End-to-end encrypted</p>
              </div>
            </div>
            <div className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:rotate-1 rounded-3xl">
              <div className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-black hover:scale-125 hover:rotate-12 transition-all duration-300 cursor-pointer" />
                <h3 className="font-semibold mb-2">No Signup</h3>
                <p className="text-gray-600 text-sm">Start sharing instantly</p>
              </div>
            </div>
            <div className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:-rotate-1 rounded-3xl">
              <div className="p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-3 text-black hover:scale-125 hover:rotate-12 transition-all duration-300 cursor-pointer" />
                <h3 className="font-semibold mb-2">Any File</h3>
                <p className="text-gray-600 text-sm">No size or type limits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold hover:scale-125 hover:rotate-12 hover:shadow-lg transition-all duration-300 ease-out cursor-pointer">1</div>
              <h3 className="font-semibold mb-2">Upload</h3>
              <p className="text-gray-600 text-sm">Drop your files</p>
            </div>
            <div className="animate-fade-in-delay">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold hover:scale-125 hover:rotate-12 hover:shadow-lg transition-all duration-300 ease-out cursor-pointer">2</div>
              <h3 className="font-semibold mb-2">Share</h3>
              <p className="text-gray-600 text-sm">Get instant link</p>
            </div>
            <div className="animate-fade-in-delay-2">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold hover:scale-125 hover:rotate-12 hover:shadow-lg transition-all duration-300 ease-out cursor-pointer">3</div>
              <h3 className="font-semibold mb-2">Done</h3>
              <p className="text-gray-600 text-sm">Recipients download</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-300 mb-6">Join thousands sharing with Swiftyy</p>
          <Link to="/register">
            <button className="bg-white text-black hover:bg-gray-100 hover:scale-110 hover:shadow-2xl hover:rotate-2 transition-all duration-300 ease-out px-8 py-4 rounded-full text-lg font-medium flex items-center justify-center mx-auto">
              <Upload className="mr-2 h-5 w-5 animate-bounce" />
              Start Now
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xl font-bold mb-4 md:mb-0">Swiftyy</div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
              <a href="#" className="hover:text-black transition-colors">Terms</a>
              <a href="#" className="hover:text-black transition-colors">Support</a>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm mt-4">
            © 2025 Swiftyy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
