import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { MessageCircle, Sparkles, Zap } from 'lucide-react'
import { useLocation } from 'wouter'

export default function Home() {
  const { user, login } = useAuth()
  const [, setLocation] = useLocation()

  const openWorkspace = () => {
    if (!user) {
      login({
        id: 'demo-user',
        name: 'Atom User',
        email: 'demo@atom.app',
        provider: 'demo',
      })
    }

    setLocation('/chat')
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-800 dark:text-gray-300">
            <Sparkles className="h-3.5 w-3.5" />
            Atom messaging workspace
          </p>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Calm, fast, AI-powered conversations.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-500 dark:text-gray-400">
            Persistent threads, graceful states, and focused replies for mobile and desktop.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" size="lg" onClick={openWorkspace}>
              {user ? 'Continue to chat' : 'Start with demo access'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setLocation('/integrations')}>
              Integrations
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950">
            <MessageCircle className="mb-4 h-5 w-5" />
            <h2 className="text-lg font-semibold">Readable threads</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Conversation list, delivery states, retries, and a focused reading surface.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950">
            <Zap className="mb-4 h-5 w-5" />
            <h2 className="text-lg font-semibold">Useful AI</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Latency-aware responses tuned for clarity instead of noise.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950">
            <Sparkles className="mb-4 h-5 w-5" />
            <h2 className="text-lg font-semibold">Connected context</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Integrations travel with the thread so context stays useful.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
