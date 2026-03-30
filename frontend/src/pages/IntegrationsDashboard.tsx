import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/card'
import { GitHubReposBrowser } from '@/components/GitHubReposBrowser'
import { useLocation } from 'wouter'

interface Integration {
  id: string
  provider: string
  status: 'connected' | 'disconnected'
  accessToken?: string
  connectedAt?: string
}

const PROVIDERS = [
  { id: 'github', name: 'GitHub', emoji: '🐙' },
  { id: 'gmail', name: 'Gmail', emoji: '📧' },
  { id: 'outlook', name: 'Outlook', emoji: '📬' },
  { id: 'google-drive', name: 'Google Drive', emoji: '📁' },
  { id: 'whatsapp', name: 'WhatsApp', emoji: '💬' },
  { id: 'cloudflare', name: 'Cloudflare', emoji: '☁️' },
]

export default function IntegrationsDashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const [, setLocation] = useLocation()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 dark:border-gray-700 border-t-black dark:border-t-white"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to manage your integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} variant="primary" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleConnect = async (provider: string) => {
    setLoading(true)
    setTimeout(() => {
      const newIntegration: Integration = {
        id: `${provider}-${Date.now()}`,
        provider,
        status: 'connected',
        connectedAt: new Date().toISOString(),
      }
      setIntegrations([...integrations, newIntegration])
      setLoading(false)
    }, 500)
  }

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(integrations.filter((i) => i.id !== integrationId))
  }

  const connectedProviders = integrations.map((i) => i.provider)
  const githubIntegration = integrations.find((i) => i.provider === 'github')

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Integrations</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your connected services</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-sm">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
            <Button onClick={logout} variant="secondary" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connected">Connected ({connectedProviders.length})</TabsTrigger>
            <TabsTrigger value="browser">Repository Browser</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROVIDERS.map((provider) => {
                const isConnected = connectedProviders.includes(provider.id)

                return (
                  <Card key={provider.id} variant="default">
                    <CardContent>
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{provider.emoji}</div>
                        {isConnected && (
                          <span className="text-xs font-semibold px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded-full">
                            Connected
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{provider.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {isConnected ? 'Manage your connection' : 'Connect your account'}
                      </p>
                      {isConnected ? (
                        <Button
                          onClick={() => handleDisconnect(integrations.find((i) => i.provider === provider.id)?.id || '')}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnect(provider.id)}
                          disabled={loading}
                          isLoading={loading}
                          variant="primary"
                          size="sm"
                          className="w-full"
                        >
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Connected Tab */}
          <TabsContent value="connected" className="space-y-6">
            {integrations.length === 0 ? (
              <Card variant="flat">
                <CardContent className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No integrations connected yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => {
                  const provider = PROVIDERS.find((p) => p.id === integration.provider)
                  if (!provider) return null

                  return (
                    <Card key={integration.id} variant="default">
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{provider.emoji}</div>
                            <div>
                              <h4 className="font-semibold">{provider.name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Connected {new Date(integration.connectedAt || '').toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded-full">
                            Active
                          </span>
                        </div>
                        <Button
                          onClick={() => handleDisconnect(integration.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Disconnect
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Repository Browser Tab */}
          <TabsContent value="browser">
            {githubIntegration ? (
              <GitHubReposBrowser accessToken={githubIntegration.accessToken || ''} />
            ) : (
              <Card variant="flat">
                <CardContent className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Connect GitHub to browse your repositories</p>
                  <Button
                    onClick={() => handleConnect('github')}
                    variant="primary"
                  >
                    Connect GitHub
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
