# 🚀 TradingIA - Sistema Profesional de Análisis de Velas Japonesas

## 📋 Descripción

**TradingIA** es una aplicación Next.js completa que implementa un analizador profesional de velas japonesas con inteligencia artificial. Incluye:

- ✅ **Análisis de Patrones**: Identificación de 50+ patrones de velas (reversión, continuación, indecisión)
- ✅ **Análisis de Tendencia**: Estructura de mercado, medias móviles (SMA/EMA), ADX
- ✅ **Indicadores Técnicos**: RSI, MACD, Bollinger Bands, Stochastic, ATR, volumen
- ✅ **Predicciones Probabilísticas**: Múltiples escenarios (principal, alternativo, inverso)
- ✅ **Niveles Clave**: Soportes, resistencias, zonas de alta probabilidad
- ✅ **API REST**: Endpoint para análisis programático

---

## 🎯 Características Principales

### 1. Análisis Profesional de Velas
- Análisis de estructura OHLCV completo
- Identificación automática de patrones
- Análisis multi-indicador
- Predicciones con nivel de confianza

### 2. API REST Completa
```
POST /api/ai/analyze
GET /api/ai/analyze (info del endpoint)
```

### 3. Componente React Reutilizable
```typescript
<CandleAnalysisComponent
  symbol="BTCUSDT"
  timeframe="1h"
  candles={candleData}
/>
```

### 4. Indicadores Técnicos
- SMA (Simple Moving Average)
- EMA (Exponential Moving Average)
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Stochastic Oscillator
- ATR (Average True Range)
- ADX (Average Directional Index)

---

## 🛠️ Instalación

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd TradingIA

# 2. Instalar dependencias
npm install

# 3. Ejecutar en desarrollo
npm run dev

# 4. Compilar para producción
npm run build
npm start
```

Luego accede a `http://localhost:3000`

---

## 📊 Estructura de Carpetas

```
TradingIA/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── route.ts           # Endpoint principal /api/ai
│   │       └── analyze/
│   │           └── route.ts       # Endpoint nuevo /api/ai/analyze
│   ├── page.tsx                   # Página principal
│   └── layout.tsx                 # Layout global
├── components/
│   ├── CandleAnalysisPanel.tsx    # ✨ Componente nuevo para análisis
│   ├── AIChat.tsx
│   ├── Charts.tsx
│   └── ...
├── lib/
│   ├── services/
│   │   ├── candleAnalysisService.ts  # ✨ Analizador profesional (912 líneas)
│   │   └── ...
│   ├── indicators.ts              # Indicadores técnicos
│   ├── types.ts                   # Tipos TypeScript
│   └── ...
├── ANALISIS_VELAS_GUIA.md         # 📖 Guía completa de uso
└── README.md                      # Este archivo
```

---

## 🚀 Quick Start

### 1. Usar en Frontend

```typescript
import { CandleAnalysisComponent } from '@/components/CandleAnalysisPanel';

export function MyPage() {
  const candles = [
    {
      time: 1704067200000,
      open: 42150.50,
      high: 42300.00,
      low: 42050.25,
      close: 42280.75,
      volume: 1250.5
    }
    // ... más velas
  ];

  return (
    <CandleAnalysisComponent
      symbol="BTCUSDT"
      timeframe="1h"
      candles={candles}
      onAnalysisComplete={(analysis) => {
        console.log('Análisis:', analysis);
      }}
    />
  );
}
```

### 2. Usar API REST

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

### 3. Usar en TypeScript

```typescript
import { analyzeCandles, CandleAnalysisInput } from '@/lib/services/candleAnalysisService';

const analysis = analyzeCandles({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  candles: [...], // tu data
  analysisDepth: 'comprehensive'
});

console.log(analysis.mainPrediction); // Predicción principal
console.log(analysis.patterns);       // Patrones identificados
console.log(analysis.indicatorStatus); // Estado de indicadores
```

---

## 📝 Formato de Datos

### Request

```typescript
{
  "symbol": "BTCUSDT",              // Requerido
  "timeframe": "1h",                // Requerido: 1m|5m|15m|1h|4h|1d|1w
  "candles": [                      // Requerido: mín. 20 velas
    {
      "time": number,               // Timestamp en ms
      "open": number,
      "high": number,
      "low": number,
      "close": number,
      "volume": number
    }
  ],
  "analysisDepth": "comprehensive", // Opcional: basic|standard|comprehensive
  "tradingStyle": "swing"           // Opcional: scalping|day_trading|swing|position
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "timeframe": "1h",
    "timestamp": 1234567890,
    
    "summary": {
      "trend": "alcista" | "bajista" | "lateral",
      "bias": "bullish (75% probabilidad)",
      "overallSentiment": "Fuertemente alcista"
    },
    
    "trendAnalysis": {
      "direction": "bullish" | "bearish" | "neutral",
      "structure": "Higher Highs y Higher Lows - Tendencia alcista clara",
      "strength": 75,
      "adx": 28,
      "sma": [...],
      "ema": [...]
    },
    
    "patterns": [
      {
        "name": "Bullish Engulfing",
        "type": "bullish_reversal",
        "reliability": 75,
        "description": "..."
      }
    ],
    
    "indicatorStatus": {
      "rsi": { "value": 65, "status": "neutral" },
      "macd": { "value": 0.5, "signal": 0.3, "histogram": 0.2, "status": "bullish" },
      "bollingerBands": { "upper": 45000, "middle": 42500, "lower": 40000, "position": "inside" },
      "stochastic": { "k": 75, "d": 70, "status": "overbought" },
      "atr": 250,
      "volume": { "current": 1000, "average": 800, "status": "high" }
    },
    
    "keyLevels": {
      "supports": [41800, 41500],
      "resistances": [43200, 43500],
      "highProbabilityZones": [...]
    },
    
    "mainPrediction": {
      "direction": "bullish",
      "probability": 75,
      "targetPrice": [43200, 43500],
      "stopLoss": 41800,
      "riskReward": 2.4,
      "timeHorizon": "4-8 horas",
      "confidenceLevel": "high"
    },
    
    "alternativePrediction": {...},
    "inversePrediction": {...},
    
    "riskFactors": [...],
    "shortAnalysis": "El mercado muestra...",
    "detailedAnalysis": "Análisis completo...",
    "warnings": [...]
  },
  "processingTime": 145
}
```

---

## 🎓 Patrones Soportados

### Reversión Alcista
- Hammer (Martillo)
- Bullish Engulfing (Envolvente Alcista)
- Morning Doji Star
- Three White Soldiers
- + 4 más

### Reversión Bajista
- Hanging Man
- Bearish Engulfing
- Evening Doji Star
- Three Black Crows
- + 4 más

### Continuación
- Doji
- Spinning Top
- Marubozu
- Gaps
- + 4 más

---

## 📈 Indicadores Disponibles

| Indicador | Período | Rango | Interpretación |
|-----------|---------|-------|-----------------|
| SMA | 9, 21, 50, 200 | - | Media móvil simple |
| EMA | 9, 12, 26 | - | Media móvil exponencial |
| RSI | 14 | 0-100 | >70: Sobrecompra, <30: Sobreventa |
| MACD | 12, 26, 9 | - | Momentum y cambios de tendencia |
| Bollinger Bands | 20, 2σ | - | Volatilidad y reversión |
| Stochastic | 14, 3 | 0-100 | >80: Sobrecompra, <20: Sobreventa |
| ATR | 14 | - | Volatilidad promedio |
| ADX | 14 | 0-100 | >25: Tendencia fuerte |

---

## ⚠️ Advertencias Importantes

1. **Análisis Probabilístico**: Las predicciones son probabilidades, NO certezas
2. **Rendimiento Pasado**: No garantiza resultados futuros
3. **Gestión de Riesgo**: Siempre usar stops adecuados
4. **Eventos Externos**: El análisis no considera noticias o macros
5. **Apalancamiento**: Amplifica ganancias Y pérdidas

---

## 📚 Documentación Adicional

- **ANALISIS_VELAS_GUIA.md** - Guía completa de uso con ejemplos
- **system-prompt-analisis-velas.md** - Prompt del sistema completo

---

## 🔧 Troubleshooting

### Error: "Velas insuficientes"
Asegúrate de enviar al menos 20 velas para un análisis confiable.

### Error: "Estructura inválida"
Verifica que cada vela tenga: `time`, `open`, `high`, `low`, `close`, `volume`

### Análisis lento
Reduce el número de velas o usa `analysisDepth: "basic"` para mayor velocidad.

---

## 🤝 Contribuir

Los aportes son bienvenidos. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT.

---

## 📞 Soporte

Para soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.

---

## ✨ Roadmap

- [ ] Integración con Binance WebSocket
- [ ] Almacenamiento de análisis históricos
- [ ] Alertas en tiempo real
- [ ] Backtesting
- [ ] API con autenticación
- [ ] Dashboard avanzado

---

## 🏆 Features Destacadas

✨ **Analizador Profesional**: Sistema completo basado en metodología de análisis técnico profesional

✨ **Múltiples Escenarios**: Predicción principal + alternativa + inversa

✨ **Indicadores Avanzados**: 8+ indicadores técnicos implementados

✨ **API REST**: Fácil integración con otros sistemas

✨ **Componente React**: Listo para usar en tu aplicación

---

**¡Disfruta analizando velas japonesas con TradingIA! 🚀📊**

