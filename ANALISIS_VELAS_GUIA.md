# Guía de Uso - Sistema Profesional de Análisis de Velas Japonesas

## 📌 Descripción General

El nuevo sistema de análisis de velas implementa un analizador técnico profesional basado en el sistema COMPLETO de análisis de velas japonesas. Soporta:

- ✅ Análisis de 50+ patrones de velas
- ✅ Cálculo de tendencias (estructura, medias móviles, ADX)
- ✅ Indicadores técnicos complementarios (RSI, MACD, Bollinger Bands, Stochastic, ATR)
- ✅ Predicciones probabilísticas con múltiples escenarios
- ✅ Niveles clave (soportes, resistencias, zonas de alta probabilidad)

---

## 🚀 Quick Start

### 1. Usar en el Frontend

```typescript
import { CandleAnalysisComponent } from '@/components/CandleAnalysisPanel';
import { CandleData, TimeFrame } from '@/lib/types';

// En tu componente React
export function MyTradingPage() {
  const symbol = 'BTCUSDT';
  const timeframe: TimeFrame = '1h';
  
  // Tus datos de velas
  const candles: CandleData[] = [
    {
      time: 1704067200000,
      open: 42150.50,
      high: 42300.00,
      low: 42050.25,
      close: 42280.75,
      volume: 1250.5
    },
    // ... más velas
  ];

  return (
    <CandleAnalysisComponent
      symbol={symbol}
      timeframe={timeframe}
      candles={candles}
      onAnalysisComplete={(analysis) => {
        console.log('Análisis completado:', analysis);
      }}
    />
  );
}
```

### 2. Usar la API REST

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "timeframe": "1h",
    "analysisDepth": "comprehensive",
    "tradingStyle": "swing",
    "candles": [
      {
        "time": 1704067200000,
        "open": 42150.50,
        "high": 42300.00,
        "low": 42050.25,
        "close": 42280.75,
        "volume": 1250.5
      }
    ]
  }'
```

---

## 📊 Estructura de Datos

### Entrada (Request)

```typescript
interface CandleAnalysisInput {
  symbol: string;                    // "BTCUSDT", "EURUSD", etc.
  timeframe: TimeFrame;              // "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w"
  candles: CandleData[];            // Array de velas OHLCV
  analysisDepth?: string;            // "basic" | "standard" | "comprehensive"
  tradingStyle?: string;             // "scalping" | "day_trading" | "swing" | "position"
}

interface CandleData {
  time: number;                      // Timestamp en milisegundos
  open: number;                      // Precio de apertura
  high: number;                      // Precio máximo
  low: number;                       // Precio mínimo
  close: number;                     // Precio de cierre
  volume: number;                    // Volumen
}
```

### Salida (Response)

```typescript
interface CandleAnalysisResponse {
  symbol: string;
  timeframe: TimeFrame;
  timestamp: number;
  
  // Resumen ejecutivo
  summary: {
    trend: 'alcista' | 'bajista' | 'lateral';
    bias: string;                     // Ej: "bullish (75% probabilidad)"
    overallSentiment: string;
  };
  
  // Análisis de tendencia
  trendAnalysis: {
    direction: 'bullish' | 'bearish' | 'neutral';
    structure: string;                // Descripción de HH/HL o LL/LH
    strength: number;                 // 0-100
    adx: number;                      // Average Directional Index
    sma: Array<{ period: number; price: number; direction: string }>;
    ema: Array<{ period: number; price: number; direction: string }>;
  };
  
  // Patrones identificados
  patterns: Array<{
    name: string;                     // "Hammer", "Bullish Engulfing", etc.
    type: 'bullish_reversal' | 'bearish_reversal' | 'continuation' | 'indecision';
    positions: number[];              // Índices de las velas
    reliability: number;              // 0-100
    description: string;
  }>;
  
  // Estado de indicadores
  indicatorStatus: {
    rsi: { value: number; status: 'overbought' | 'oversold' | 'neutral' };
    macd: { value: number; signal: number; histogram: number; status: string };
    bollingerBands: { upper: number; middle: number; lower: number; position: string };
    stochastic: { k: number; d: number; status: string };
    atr: number;
    volume: { current: number; average: number; status: string };
  };
  
  // Niveles clave
  keyLevels: {
    supports: number[];
    resistances: number[];
    highProbabilityZones: Array<{ level: number; description: string }>;
    swingPoints: Array<{ type: 'high' | 'low'; price: number; index: number }>;
  };
  
  // Predicciones
  mainPrediction: Prediction;         // Escenario principal
  alternativePrediction: Prediction;  // Escenario alternativo
  inversePrediction: Prediction;      // Escenario inverso
  
  // Información adicional
  riskFactors: string[];              // Factores de riesgo identificados
  shortAnalysis: string;              // Resumen de 2-3 oraciones
  detailedAnalysis: string;           // Análisis completo
  warnings: string[];                 // Advertencias importantes
}

interface Prediction {
  direction: 'bullish' | 'bajista' | 'lateral';
  probability: number;               // 0-100
  targetPrice: number[];             // Array de objetivos
  stopLoss: number;
  riskReward: number;                // Relación riesgo/beneficio
  timeHorizon: string;               // Ej: "4-8 horas"
  confidenceLevel: 'low' | 'medium' | 'high';
  justification: string;
}
```

---

## 🎯 Patrones Soportados

### Patrones de Reversión Alcista
- **Hammer** - Martillo
- **Inverted Hammer** - Martillo Invertido
- **Bullish Engulfing** - Envolvente Alcista
- **Morning Doji Star** - Estrella Doji Matutina
- **Three White Soldiers** - Tres Soldados Blancos
- **Piercing Line** - Línea Penetrante
- **Tasuki Gap Bullish** - Gap Tasuki Alcista

### Patrones de Reversión Bajista
- **Hanging Man** - Hombre Colgado
- **Shooting Star** - Estrella Fugaz
- **Bearish Engulfing** - Envolvente Bajista
- **Evening Doji Star** - Estrella Doji Vespertina
- **Three Black Crows** - Tres Cuervos Negros
- **Dark Cloud Cover** - Nube Oscura
- **Tasuki Gap Bearish** - Gap Tasuki Bajista

### Patrones de Continuación
- **Doji** - Indecisión
- **Spinning Top** - Trompo
- **Marubozu** - Vela Fuerte
- **Gaps** - Ventanas
- **Rising Three Methods** - Tres Métodos Ascendentes
- **Falling Three Methods** - Tres Métodos Descendentes

---

## 📈 Indicadores Técnicos Implementados

| Indicador | Rango | Interpretación |
|-----------|-------|-----------------|
| RSI (14) | 0-100 | >70 = Sobrecompra, <30 = Sobreventa |
| MACD | - | Histogram > 0 = Bullish, < 0 = Bearish |
| Bollinger Bands | - | Volatilidad y niveles de reversión |
| Stochastic %K/%D | 0-100 | >80 = Sobrecompra, <20 = Sobreventa |
| ATR (14) | - | Volatilidad promedio del período |
| ADX (14) | 0-100 | >25 = Tendencia fuerte, <20 = Sin tendencia |
| Volumen | - | Alto/Normal/Bajo vs promedio |

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Análisis Básico de Bitcoin Horario

```typescript
const response = await fetch('/api/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    analysisDepth: 'standard',
    candles: [
      { time: 1704067200000, open: 42150, high: 42300, low: 42050, close: 42280, volume: 1250 },
      { time: 1704070800000, open: 42280, high: 42450, low: 42200, close: 42400, volume: 1580 },
      { time: 1704074400000, open: 42400, high: 42450, low: 42150, close: 42200, volume: 2100 },
      // ... más velas
    ]
  })
});

const analysis = await response.json();
console.log(analysis.data.mainPrediction); // Ver predicción principal
```

### Ejemplo 2: Análisis Completo para Day Trading

```typescript
const response = await fetch('/api/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'EURUSD',
    timeframe: '15m',
    analysisDepth: 'comprehensive',
    tradingStyle: 'day_trading',
    candles: [...] // 100+ velas de 15 minutos
  })
});

const { data } = await response.json();

// Acceder a diferentes partes del análisis
console.log('Tendencia:', data.trendAnalysis.direction);
console.log('Patrones:', data.patterns.map(p => p.name));
console.log('RSI:', data.indicatorStatus.rsi.value);
console.log('Predicción:', data.mainPrediction.direction);
console.log('Probabilidad:', data.mainPrediction.probability + '%');
```

---

## ⚙️ Configuración

### Temporalidades Soportadas
- `1m` - 1 minuto
- `5m` - 5 minutos
- `15m` - 15 minutos
- `1h` - 1 hora
- `4h` - 4 horas
- `1d` - 1 día
- `1w` - 1 semana

### Profundidad del Análisis
- **basic** - Rápido, patrones y tendencia
- **standard** - Equilibrado (recomendado)
- **comprehensive** - Completo, todos los indicadores

### Estilos de Trading
- **scalping** - Períodos muy cortos
- **day_trading** - Transacciones intradía
- **swing** - Posiciones de 2-5 días (default)
- **position** - Posiciones de largo plazo

---

## ⚠️ Advertencias Importantes

1. **Análisis de Probabilidad**: Los análisis NO son certezas, sino probabilidades basadas en patrones históricos.

2. **Rendimiento Pasado**: El rendimiento pasado de los patrones no garantiza resultados futuros.

3. **Gestión de Riesgo**: Siempre usar stops y gestión de riesgo apropiada.

4. **Eventos Externos**: El análisis técnico no considera noticias o eventos macroeconómicos.

5. **Apalancamiento**: El apalancamiento amplifica ganancias y pérdidas.

---

## 🔧 Troubleshooting

### Error: "Se requieren: symbol, timeframe y candles"
- Verifica que incluyas los 3 campos requeridos en el request

### Error: "Las velas deben tener: time, open, high, low, close, volume"
- Verifica que cada vela tenga TODOS estos campos con valores numéricos

### Análisis lento o timeout
- Reduce el número de velas si envías más de 500
- Considera usar analysisDepth "basic" para análisis más rápidos

### Patrones no identificados
- Es normal si hay pocas velas o sin patrones claros
- Asegúrate de tener al menos 20 velas para análisis confiable

---

## 📚 Referencias

- Prompt de sistema: Basado en metodología profesional de análisis técnico
- Parámetros de indicadores: Estándares internacionales (RSI-14, ADX-14, BB-20, etc.)
- Patrones: Basados en análisis de velas japonesas clásico

---

## 🎓 Integrando en tu Aplicación

```typescript
// Importar el componente en tu página
import { CandleAnalysisComponent } from '@/components/CandleAnalysisPanel';

// En tu página principal o dashboard
export default function TradingPage() {
  const [candles, setCandles] = useState<CandleData[]>([]);

  // Cargar datos de velas (desde Binance, TradingView, etc.)
  useEffect(() => {
    // Tu lógica para obtener velas
    fetchCandles().then(setCandles);
  }, []);

  return (
    <main className="container mx-auto p-4">
      <h1>Trading IA - Análisis Profesional de Velas</h1>
      
      <CandleAnalysisComponent
        symbol="BTCUSDT"
        timeframe="1h"
        candles={candles}
        onAnalysisComplete={(analysis) => {
          // Hacer algo con el análisis
          console.log('Análisis completado:', analysis);
        }}
      />
    </main>
  );
}
```

---

¡Listo! Tu sistema está completamente integrado y funcional. 🚀

