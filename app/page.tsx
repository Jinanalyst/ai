'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center space-y-8 pt-20">
          {/* Logo and Title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src="/logo.svg" alt="Chatai Logo" className="w-20 h-20" />
            <h1 className="text-6xl font-bold text-gray-900">Chatai</h1>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 max-w-3xl mx-auto">
            Chat with AI and Earn CHAT Tokens
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Experience the future of AI conversation with blockchain rewards.
            Every message you send earns you CHAT tokens on the Solana network.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Powered</h3>
              <p className="text-gray-600">
                Advanced AI models provide intelligent, context-aware responses
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Earn Rewards</h3>
              <p className="text-gray-600">
                Get CHAT tokens for every conversation on Solana blockchain
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Fast & Secure</h3>
              <p className="text-gray-600">
                Lightning-fast responses with blockchain-level security
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-12">
            <Link href="/checkout">
              <button className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xl font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl">
                Start Now
              </button>
            </Link>
          </div>

          {/* Subtext */}
          <p className="text-sm text-gray-500 pt-4">
            Powered by Solana blockchain • No credit card required
          </p>
        </div>
      </div>
    </main>
  );
}
