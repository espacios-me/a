import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ChatBox } from '@/components/ChatBox';
import { Plus, ChevronLeft, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = trpc.chat.listSessions.useQuery(
    undefined,
    { enabled: !!user }
  );

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (session) => {
      setActiveSessionId(session.id);
      setNewSessionTitle('');
      refetchSessions();
    },
  });

  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

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
          <h1 className="text-2xl font-black mb-4">Chat</h1>
          <p className="text-gray-600 text-sm mb-6">Sign in to use the AI chatbox</p>
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

  const handleCreateSession = () => {
    if (!newSessionTitle.trim()) return;
    createSession.mutate({ title: newSessionTitle });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/integrations')}
              variant="ghost"
              size="sm"
              className="text-black hover:bg-black hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-black">chat</h1>
              <p className="text-xs text-gray-600">AI-powered assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Sidebar */}
        <div className="w-64 border-r border-black p-4 flex flex-col bg-white">
          <div className="mb-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="New chat..."
                className="flex-1 px-3 py-2 text-sm border border-black rounded"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateSession();
                }}
              />
              <Button
                onClick={handleCreateSession}
                disabled={!newSessionTitle.trim() || createSession.isPending}
                size="sm"
                className="bg-black text-white hover:bg-gray-900"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {sessionsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mx-auto" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-gray-500">No chats yet</p>
            ) : (
              sessions.map((session: any) => (
                <div
                  key={session.id}
                  className={`p-3 rounded cursor-pointer text-sm font-medium transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200 border border-black'
                  }`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{session.title}</span>
                    <Trash2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeSessionId ? (
            <ChatBox sessionId={activeSessionId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <p className="text-gray-500 text-sm">Start a new chat to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
