import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntegrationCard } from '@/components/IntegrationCard';
import { INTEGRATION_PROVIDERS } from '@shared/integrations';
import { LogOut } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export default function IntegrationsDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: integrations = [], isLoading: integrationsLoading } = trpc.integrations.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const connectIntegration = trpc.integrations.connect.useMutation();
  const disconnectIntegration = trpc.integrations.disconnect.useMutation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto mb-4" />
          <p className="text-black text-sm">Loading</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-black mb-4">Integrations</h1>
          <p className="text-gray-600 text-sm mb-6">Sign in to manage your integrations</p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-black text-white hover:bg-gray-900 w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
