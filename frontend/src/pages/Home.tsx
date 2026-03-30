import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'wouter'

export default function Home() {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 dark:border-gray-700 border-t-black dark:border-t-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Integrations</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect all your services</p>
          </div>
          {user ? (
            <Button onClick={() => setLocation('/integrations')} variant="primary">
              Dashboard
            </Button>
          ) : (
            <Button onClick={() => setLocation('/integrations')} variant="primary">
              Get Started
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Connect Everything
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Manage all your integrations in one elegant, unified interface. Connect GitHub, Gmail, Google Drive, WhatsApp, Cloudflare, and more.
          </p>
          <Button
            onClick={() => setLocation('/integrations')}
            variant="primary"
            size="lg"
            className="px-8 py-3"
          >
            Explore Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <Card variant="flat">
            <CardContent>
              <div className="mb-4">
                <div className="w-12 h-12 rounded-xl bg-black dark:bg-white flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Powered by Cloudflare Workers for instant, globally distributed performance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card variant="flat">
            <CardContent>
              <div className="mb-4">
                <div className="w-12 h-12 rounded-xl bg-black dark:bg-white flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
              </div>
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                End-to-end encryption for all your credentials. Your data stays yours.
              </CardDescription>
            </CardContent>
          </Card>

          <Card variant="flat">
            <CardContent>
              <div className="mb-4">
                <div className="w-12 h-12 rounded-xl bg-black dark:bg-white flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
              </div>
              <CardTitle>AI-Powered</CardTitle>
              <CardDescription>
                Interact with all your services through a single Gemini-powered chatbox.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Supported Integrations */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-12">Supported Integrations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['GitHub', 'Gmail', 'Outlook', 'Google Drive', 'WhatsApp', 'Cloudflare'].map((service) => (
              <Card key={service} variant="flat">
                <CardContent className="text-center">
                  <p className="font-semibold text-sm">{service}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>&copy; 2026 Integrations Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
