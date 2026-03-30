import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Streamdown } from 'streamdown';

interface ChatBoxProps {
  sessionId: number;
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: Date;
}

export function ChatBox({ sessionId }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages on mount
  const { data: fetchedMessages = [], isLoading: isFetching } = trpc.chat.getMessages.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  useEffect(() => {
    if (fetchedMessages.length > 0) {
      setMessages(
        fetchedMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        }))
      );
    }
  }, [fetchedMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (response) => {
      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'user',
          content: input,
          createdAt: new Date(),
        },
      ]);

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.message,
          createdAt: new Date(),
        },
      ]);

      setInput('');
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    },
  });

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    sendMessage.mutate({
      sessionId,
      message: input,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-black">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4 border-b border-black">
        <div className="space-y-4">
          {isFetching && messages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>Start a conversation</p>
              <p className="text-xs mt-2">Ask me to check your emails, files, or repositories</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black border border-black'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-black border border-black px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-black">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 bg-white border-black text-black placeholder-gray-500"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-black text-white hover:bg-gray-900 px-4"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
