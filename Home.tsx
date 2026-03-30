import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/const';
import { useLocation } from 'wouter';

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto mb-4" />
          <p className="text-black text-sm">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">integrations</h1>
              <p className="text-sm text-gray-600 mt-1">connect your accounts</p>
            </div>
            {user && (
              <Button
                onClick={() => setLocation('/integrations')}
                className="bg-black text-white hover:bg-gray-900 text-sm font-medium"
              >
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {!user ? (
          <div className="max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-black mb-4">Welcome</h2>
              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                Connect all your favorite services in one place. Manage integrations securely with encrypted credentials.
              </p>
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-black text-white hover:bg-gray-900 w-full font-medium"
              >
                Sign In
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-black mb-6">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="border-l-2 border-black pl-4">
                  <h3 className="font-black text-sm mb-2">Quick Connect</h3>
                  <p className="text-sm text-gray-600">OAuth-powered integrations with all major platforms</p>
                </div>
                <div className="border-l-2 border-black pl-4">
                  <h3 className="font-black text-sm mb-2">Encrypted</h3>
                  <p className="text-sm text-gray-600">AES-256 encryption for all credentials and tokens</p>
                </div>
                <div className="border-l-2 border-black pl-4">
                  <h3 className="font-black text-sm mb-2">AI-Powered</h3>
                  <p className="text-sm text-gray-600">Gemini chatbox to interact with your accounts</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
