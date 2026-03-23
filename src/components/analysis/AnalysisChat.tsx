/**
 * AnalysisChat -- F20 Upgrade 1
 *
 * Chat conversacional post-analisis.
 * El founder puede hacer follow-up questions sobre su analisis generado.
 * Maximo 5 preguntas por sesion (ephemeral, no persistido).
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisChatProps {
  projectId: string;
  analysisResult: Record<string, unknown>;
}

const MAX_FOLLOWUPS = 5;

export function AnalysisChat({ projectId, analysisResult }: AnalysisChatProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const followupCount = messages.filter(m => m.role === 'user').length;
  const canAsk = followupCount < MAX_FOLLOWUPS && !isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || !canAsk) return;

    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await supabase.functions.invoke('analyze-project-v4', {
        body: {
          mode: 'followup',
          project_id: projectId,
          question,
          analysis_context: analysisResult,
        },
      });

      if (response.error) throw response.error;

      const answer = response.data?.answer ?? t('analysis.chatNoResponse');
      const assistantMsg: ChatMessage = { role: 'assistant', content: answer, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (_err) {
      setError(t('analysis.chatError'));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          {t('analysis.chatTitle')}
        </CardTitle>
        <p className="text-xs text-gray-500">
          {t('analysis.chatSubtitle', { remaining: MAX_FOLLOWUPS - followupCount, max: MAX_FOLLOWUPS })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 200))}
            onKeyDown={handleKeyDown}
            placeholder={
              canAsk
                ? t('analysis.chatPlaceholder')
                : t('analysis.chatLimitReached')
            }
            disabled={!canAsk}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!canAsk || !input.trim()}
            className="shrink-0 gap-1"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
