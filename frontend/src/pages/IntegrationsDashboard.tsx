import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IntegrationCard } from '@/components/IntegrationCard'
import { GitHubReposBrowser } from '@/components/GitHubReposBrowser'
import { LogOut, Github, Mail, Globe, MessageSquare, Cloud } from 'lucide-react'
import { useLocation } from 'wouter'

interface Integration {
  id: string
  provider: string
  status: 'connected' | 'disconnected'
  accessToken?: string
  connectedAt?: string
}

const PROVIDERS = [
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    description: 'Connect your GitHub repositories',
    color: 'from-gray-900 to-gray-800',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    description: 'Access your Gmail inbox',
    color: 'from-red-600 to-red-700',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: Mail,
    description: 'Connect your Outlook account',
    color: 'from-blue-600 to-blue-700',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: Globe,
    description: 'Browse your Google Drive files',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageSquare,
    description: 'Send WhatsApp messages',
    color: 'from-green-600 to-green-700',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    icon: Cloud,
    description: 'Manage Cloudflare Workers & Pages',
    color: 'from-orange-500 to-orange-600',
  },
]

export default function IntegrationsDashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const [, setLocation] = useLocation()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading integrations...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center max-w-sm">
          <h1 className="text-4xl font-bold mb-4 text-white">Integrations Hub</h1>
          <p className="text-slate-400 text-lg mb-8">Sign in to manage your integrations</p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-semibold transition"
          >
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const handleConnect = async (provider: string) => {
    setLoading(true)
    try {
      // Simulate OAuth flow - in production, redirect to OAuth provider
      const newIntegration: Integration = {
        id: `${provider}-${Date.now()}`,
        provider,
        status: 'connected',
        connectedAt: new Date().toISOString(),
      }
      setIntegrations([...integrations, newIntegration])
      setSelectedProvider(provider)
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(integrations.filter((i) => i.id !== integrationId))
    setSelectedProvider(null)
  }

  const connectedProviders = integrations.map((i) => i.provider)
  const githubIntegration = integrations.find((i) => i.provider === 'github')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Integrations Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your connected services</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-medium">{user?.name || 'User'}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
            </div>
            <Button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
            <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="connected" className="text-slate-300 data-[state=active]:text-white">
              Connected ({connectedProviders.length})
            </TabsTrigger>
            <TabsTrigger value="browser" className="text-slate-300 data-[state=active]:text-white">
              Repository Browser
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROVIDERS.map((provider) => {
                const isConnected = connectedProviders.includes(provider.id)
                const Icon = provider.icon

                return (
                  <div
                    key={provider.id}
                    className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm hover:border-slate-600/50 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`bg-gradient-to-br ${provider.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {isConnected && (
                        <span className="px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-xs text-green-300 font-medium">
                          Connected
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{provider.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{provider.description}</p>
                    {isConnected ? (
                      <Button
                        onClick={() => handleDisconnect(integrations.find((i) => i.provider === provider.id)?.id || '')}
                        className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 rounded-lg py-2 transition"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleConnect(provider.id)}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 transition disabled:opacity-50"
                      >
                        {loading ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* Connected Tab */}
          <TabsContent value="connected" className="space-y-6 mt-6">
            {integrations.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-slate-400">No integrations connected yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => {
                  const provider = PROVIDERS.find((p) => p.id === integration.provider)
                  if (!provider) return null

                  const Icon = provider.icon
                  return (
                    <div
                      key={integration.id}
                      className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`bg-gradient-to-br ${provider.color} p-2 rounded-lg`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{provider.name}</h4>
                            <p className="text-slate-400 text-xs">
                              Connected {new Date(integration.connectedAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-900/30 border border-green-700/50 rounded-full text-xs text-green-300 font-medium">
                          Active
                        </span>
                      </div>
                      <Button
                        onClick={() => handleDisconnect(integration.id)}
                        className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 rounded-lg py-2 text-sm transition"
                      >
                        Disconnect
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Repository Browser Tab */}
          <TabsContent value="browser" className="mt-6">
            {githubIntegration ? (
              <GitHubReposBrowser accessToken={githubIntegration.accessToken || ''} />
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-slate-700/50">
                <Github className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">Connect GitHub to browse your repositories</p>
                <Button
                  onClick={() => handleConnect('github')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Connect GitHub
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
