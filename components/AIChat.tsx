'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, TimeFrame } from '@/lib/types';
import { useMarketStore } from '@/lib/store';
import { Send, MessageCircle, Trash2, Bot, User } from 'lucide-react';

interface ChatPanelProps {
  symbol: string;
  timeframe: TimeFrame;
}

export function ChatPanel({ symbol, timeframe }: ChatPanelProps) {
  const { chatMessages, addChatMessage, clearChatMessages } = useMarketStore();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;

      const message = inputValue.trim();
      setInputValue('');

      addChatMessage({
        id: Math.random().toString(36).substr(2, 9),
        role: 'user',
        content: message,
        timestamp: Date.now(),
        context: { symbol, timeframe },
      });

      setIsLoading(true);

      try {
        const response = await fetch(`/api/ai?message=${encodeURIComponent(message)}&symbol=${symbol}`);
        const data = await response.json();

        addChatMessage({
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: data.response || 'No se recibió respuesta',
          timestamp: Date.now(),
        });
      } catch {
        addChatMessage({
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: 'Error al procesar la solicitud.',
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, symbol, timeframe, addChatMessage]
  );

  return (
    <div className="flex flex-col h-[350px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Asistente IA</h3>
        </div>
        {chatMessages.length > 0 && (
          <button onClick={() => clearChatMessages()} className="p-1.5 hover:bg-muted rounded-lg">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Pregúntame sobre {symbol}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted px-4 py-2 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2 p-4 border-t border-border">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pregunta sobre el mercado..."
          disabled={isLoading}
          className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

