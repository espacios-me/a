import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { INTEGRATION_METADATA, IntegrationProvider } from '@shared/integrations';

interface IntegrationCardProps {
  provider: IntegrationProvider;
  status: 'connected' | 'disconnected' | 'error';
  onConnect: () => void;
  onDisconnect: () => void;
  metadata?: Record<string, any>;
  errorMessage?: string;
  isLoading?: boolean;
}

export function IntegrationCard({
  provider,
  status,
  onConnect,
  onDisconnect,
  metadata,
  errorMessage,
  isLoading = false,
}: IntegrationCardProps) {
  const config = INTEGRATION_METADATA[provider];

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      label: 'Connected',
      badge: 'default',
    },
    disconnected: {
      icon: Clock,
      label: 'Disconnected',
      badge: 'secondary',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      badge: 'destructive',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <Card className="p-6 border border-black bg-white hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-black text-sm">{config.name}</h3>
          <p className="text-xs text-gray-600 mt-1">{config.description}</p>
        </div>
        <Badge variant={currentStatus.badge as any} className="ml-2 text-xs">
          {currentStatus.label}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <StatusIcon className="w-4 h-4" />
        <span className="text-xs text-gray-600">
          {status === 'connected' && metadata?.email && `Connected as ${metadata.email}`}
          {status === 'connected' && !metadata?.email && 'Connected'}
          {status === 'disconnected' && 'Ready to connect'}
          {status === 'error' && (errorMessage || 'Connection failed')}
        </span>
      </div>

      <div className="flex gap-2">
        {status === 'disconnected' ? (
          <Button
            onClick={onConnect}
            disabled={isLoading}
            className="flex-1 bg-black text-white hover:bg-gray-900 text-xs font-medium"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        ) : (
          <Button
            onClick={onDisconnect}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-black text-black hover:bg-black hover:text-white text-xs font-medium"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        )}
      </div>
    </Card>
  );
}
