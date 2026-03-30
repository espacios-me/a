import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'wouter'
import { Zap, Shield, Cpu, ArrowRight } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">Integrations Hub</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-slate-400">Welcome, {user.name}</span>
                <Button
                  onClick={() => setLocation('/integrations')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setLocation('/integrations')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Connect Everything
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Manage all your integrations in one place. Connect GitHub, Gmail, Google Drive, WhatsApp, Cloudflare, and more with our AI-powered dashboard.
          </p>
          <Button
            onClick={() => setLocation('/integrations')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition inline-flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-lg p-8 backdrop-blur-sm hover:border-blue-500/50 transition">
            <Zap className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
            <p className="text-slate-400">
              Powered by Cloudflare Workers for instant, globally distributed performance.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-lg p-8 backdrop-blur-sm hover:border-purple-500/50 transition">
            <Shield className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
            <p className="text-slate-400">
              End-to-end encryption for all your credentials. Your data stays yours.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-lg p-8 backdrop-blur-sm hover:border-pink-500/50 transition">
            <Cpu className="w-12 h-12 text-pink-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3">AI-Powered</h3>
            <p className="text-slate-400">
              Interact with all your services through a single Gemini-powered chatbox.
            </p>
          </div>
        </div>

        {/* Supported Integrations */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-12">Supported Integrations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['GitHub', 'Gmail', 'Outlook', 'Google Drive', 'WhatsApp', 'Cloudflare'].map((service) => (
              <div
                key={service}
                className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm hover:border-blue-500/50 transition text-center"
              >
                <p className="font-semibold text-slate-300">{service}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-400">
          <p>&copy; 2026 Integrations Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
