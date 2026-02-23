/**
 * MENTOR CHAT
 *
 * Chat interface para AI Career Coach
 * Conecta con edge function: ai-career-coach
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MentorChatProps {
  currentRole?: string;
  fitScore?: number;
}

export function MentorChat({ currentRole, fitScore }: MentorChatProps) {
  const { user: _user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load previous session on mount
  useEffect(() => {
    loadPreviousSession();
  }, []);

  const loadPreviousSession = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_coach_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSessionId(data.id);
        // Load messages from session
        if (data.messages && Array.isArray(data.messages)) {
          const loadedMessages = data.messages.map((msg: { role: 'user' | 'assistant'; content: string }, idx: number) => ({
            id: `${data.id}-${idx}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || data.created_at),
          }));
          setMessages(loadedMessages);
        }
      }
    } catch (_error) {
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI coach edge function
      const { data, error } = await supabase.functions.invoke('ai-career-coach', {
        body: {
          message: userMessage.content,
          sessionId: sessionId,
          context: {
            currentRole,
            fitScore,
            previousMessages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          },
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save session if new
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (_error) {
      toast.error('Error al consultar al coach: ' + (error instanceof Error ? error.message : 'Error desconocido'));

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    '¿Cómo puedo mejorar mi fit score?',
    '¿Qué habilidades debería desarrollar?',
    '¿Estoy listo para un rol más senior?',
    'Dame feedback sobre mi progreso',
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl nova-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Coach AI de Carrera
                <Badge variant="secondary" className="text-xs">
                  Powered by GPT-4
                </Badge>
              </CardTitle>
              <CardDescription>
                Mentor personal que te ayuda a crecer en tu rol y desarrollar tu carrera
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Container */}
      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl nova-gradient flex items-center justify-center opacity-50">
                  <Bot className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">¡Hola! Soy tu Coach de Carrera</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Estoy aquí para ayudarte a desarrollar tus habilidades, mejorar en tu rol actual,
                    y planear tu crecimiento profesional. ¿En qué puedo ayudarte hoy?
                  </p>
                </div>

                {/* Suggested questions */}
                <div className="space-y-2 w-full max-w-md mt-6">
                  <p className="text-xs text-muted-foreground font-medium">PREGUNTAS SUGERIDAS:</p>
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(question)}
                      className="w-full text-left text-sm p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="nova-gradient text-primary-foreground">
                          <Bot size={16} />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-muted">
                          <User size={16} />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="nova-gradient text-primary-foreground">
                        <Bot size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu pregunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              El Coach AI tiene contexto de tu rol actual, fit score, y progreso reciente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
