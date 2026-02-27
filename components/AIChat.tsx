'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, TimeFrame } from '@/lib/types';
import { useMarketStore } from '@/lib/store';
import { Send, MessageCircle, Trash2 } from 'lucide-react';

interface ChatPanelProps {
  symbol: string;
  timeframe: TimeFrame;
}

export function ChatPanel({ symbol, timeframe }: ChatPanelProps) {
  const { chatMessages, addChatMessage, clearChatMessages } = useMarketStore();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;

      const message = inputValue.trim();
      setInputValue('');

      // Agregar mensaje del usuario
      const userMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'user',
        content: message,
        timestamp: Date.now(),
        context: { symbol, timeframe },
      };

      addChatMessage(userMessage);
      setIsLoading(true);

      try {
        // Llamada REAL a la API con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(
          `/api/ai?message=${encodeURIComponent(message)}&symbol=${symbol}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: data.response || 'No se recibió respuesta de la IA',
          timestamp: Date.now(),
        };

        addChatMessage(assistantMessage);
      } catch (error) {
        console.error('Error en chat:', error);

        const errorMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content:
            error instanceof Error && error.name === 'AbortError'
              ? 'La solicitud tardó demasiado. Intenta de nuevo.'
              : 'Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',
          timestamp: Date.now(),
        };

        addChatMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, symbol, timeframe, addChatMessage]
  );

  return (
    <div className="card-glass flex flex-col h-full max-h-[500px] rounded-xl">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-muted/20">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold">Chat con IA</h2>
        </div>
        {chatMessages.length > 0 && (
          <button
            onClick={() => clearChatMessages()}
            className="p-2 hover:bg-muted/20 rounded-lg transition-all duration-200 hover:scale-110 text-muted-foreground hover:text-foreground"
            title="Limpiar chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div ref={containerRef} className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-40">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 opacity-30 mb-4" />
            <p className="text-sm">
              Haz preguntas sobre {symbol}
              <br />
              en el timeframe {timeframe}
            </p>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-xs px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-none shadow-md'
                      : 'bg-muted/20 text-foreground rounded-bl-none border border-muted/30'
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted/20 px-4 py-3 rounded-lg rounded-bl-none border border-muted/30">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2 mt-4 pt-4 border-t border-muted/20">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pregunta sobre el mercado..."
          disabled={isLoading}
          className="flex-1 bg-muted/10 rounded-lg px-4 py-2 text-sm border border-muted/30 focus:border-primary focus:outline-none transition-all duration-200 disabled:opacity-50 placeholder-muted-foreground/50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

interface AnalysisCardProps {
  symbol: string;
  timeframe: TimeFrame;
  onAnalyze?: () => void;
}

export function AnalysisCard({ symbol, timeframe, onAnalyze }: AnalysisCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    trend: 'bullish' | 'bearish' | 'neutral';
    text: string;
    confidence: number;
    recommendation: string;
  } | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simular análisis de IA
    setTimeout(() => {
      const trends: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
      const trend = trends[Math.floor(Math.random() * trends.length)];
      const confidence = Math.floor(Math.random() * 40) + 60; // 60-100

      const analyses: Record<string, string> = {
        bullish: `${symbol} muestra señales técnicas alcistas claras. El precio está por encima de sus principales medias móviles (50 y 200), y el RSI está en zona neutral sugiriendo espacio para subidas.`,
        bearish: `${symbol} presenta debilidad técnica. El precio ha roto por debajo de soportes clave y las medias móviles están en configuración bajista.`,
        neutral: `${symbol} está consolidando en un rango definido. No hay señales claras de dirección. Se recomienda esperar una ruptura confirmada.`,
      };

      const recommendations: Record<string, string> = {
        bullish: 'Mantener posiciones largas. Buscar entrada en retrocesos a las medias móviles principales.',
        bearish: 'Evitar compras. Esperar confirmación de reversión antes de asumir posiciones largas.',
        neutral: 'Operar el rango. Comprar en soporte, vender en resistencia.',
      };

      setAnalysis({
        trend,
        text: analyses[trend],
        confidence,
        recommendation: recommendations[trend],
      });
      setIsAnalyzing(false);
      onAnalyze?.();
    }, 1200);
  };

  return (
    <div className="card-glass">
      <div className="mb-4">
        <h2 className="text-lg font-bold">{symbol} - Análisis de IA</h2>
        <p className="text-sm text-muted-foreground">Timeframe: {timeframe.toUpperCase()}</p>
      </div>

      {!analysis ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm text-muted-foreground mb-4">
            Analiza el gráfico actual con inteligencia artificial
          </p>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analizando...' : 'Analizar Gráfico'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tendencia */}
          <div className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tendencia</p>
              <p className="text-lg font-bold capitalize">
                {analysis.trend === 'bullish' && '📈 Alcista'}
                {analysis.trend === 'bearish' && '📉 Bajista'}
                {analysis.trend === 'neutral' && '➡️ Neutral'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Confianza</p>
              <p className="text-2xl font-bold text-primary">{analysis.confidence}%</p>
            </div>
          </div>

          {/* Barra de confianza */}
          <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                analysis.confidence >= 75
                  ? 'bg-primary'
                  : analysis.confidence >= 55
                  ? 'bg-accent'
                  : 'bg-secondary'
              }`}
              style={{ width: `${analysis.confidence}%` }}
            />
          </div>

          {/* Análisis */}
          <div className="p-4 bg-muted/10 rounded-lg">
            <p className="text-sm text-foreground">{analysis.text}</p>
          </div>

          {/* Recomendación */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Recomendación</p>
            <p className="text-sm font-semibold text-primary">{analysis.recommendation}</p>
          </div>

          {/* Botón para nuevo análisis */}
          <button
            onClick={handleAnalyze}
            className="w-full btn-ghost border border-muted"
          >
            Nuevo Análisis
          </button>
        </div>
      )}
    </div>
  );
}

