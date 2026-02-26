# TradingIA - Plataforma de Análisis de Mercado Financiero con IA

Una aplicación web completa y profesional para análisis de mercado financiero con inteligencia artificial integrada. Soporta análisis técnico, chat conversacional con IA, noticias financieras en tiempo real y alertas automáticas.

## 🚀 Características Principales

### 1. Dashboard Interactivo
- **Gráficos en Tiempo Real**: Velas japonesas (candlestick) con actualización cada 5-10 segundos
- **Selector de Activos**: Acciones, criptomonedas, pares forex
- **Múltiples Timeframes**: 1m, 5m, 15m, 1h, 4h, 1d, 1w
- **Indicadores Técnicos**:
  - SMA (Simple Moving Average)
  - EMA (Exponential Moving Average)
  - RSI (Relative Strength Index)
  - Bandas de Bollinger
  - MACD

### 2. Panel de Análisis con IA
- **Chat Conversacional**: Haz preguntas sobre el mercado y recibe análisis inteligentes
- **Análisis Automático**: Botón para analizar el gráfico actual con IA
- **Tendencia y Confianza**: Identifica tendencias alcistas/bajistas con porcentaje de confianza
- **Recomendaciones**: Recibe sugerencias automáticas basadas en análisis técnico
- **Niveles Técnicos**: Soportes y resistencias detectados automáticamente

### 3. Feed de Noticias Financieras
- **Noticias Relevantes**: Filtradas por activo seleccionado
- **Análisis de Sentimiento**: Clasifica noticias como positivas, negativas o neutrales
- **Integración con IA**: Correlaciona noticias con movimientos del mercado
- **Activos Relacionados**: Muestra qué activos son mencionados en cada noticia

### 4. Sistema de Alertas
- **Alertas Personalizables**:
  - Precio mayor/menor que un valor
  - Cruce de medias móviles (SMA/EMA)
- **Notificaciones Visuales**: Alertas en tiempo real cuando se activan
- **Historial**: Registro de todas las alertas disparadas
- **Persistencia**: Se guardan en localStorage

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 15 con App Router
- **UI**: React 19 con TypeScript
- **Estilos**: Tailwind CSS 3.4
- **Gráficos**: Recharts 2.10 (visualización reactiva)
- **Estado Global**: Zustand 4.4 con persistencia en localStorage
- **Iconos**: Lucide React 0.294
- **Notificaciones**: React Hot Toast 2.4

### Backend
- **Rutas API**: Next.js API Routes
- **Datos Mock**: Generación dinámica de datos OHLC realistas
- **Procesamiento**: Cálculo de indicadores técnicos en tiempo real

### Características Técnicas
- TypeScript estricto para type-safety completo
- CSS personalizado con variables CSS
- Responsive design (mobile-first)
- Modo oscuro/claro (implementado)
- Animaciones suaves con Tailwind
- localStorage para persistencia de datos

## 📦 Instalación

### Requisitos
- Node.js 18+ 
- npm o yarn

### Pasos

```bash
# Clonar el repositorio
git clone <repository-url>
cd TradingIA

# Instalar dependencias
npm install --legacy-peer-deps

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
TradingIA/
├── app/
│   ├── api/
│   │   ├── market/route.ts        # Endpoint para datos de mercado
│   │   └── ai/route.ts            # Endpoint para análisis de IA
│   ├── hooks/
│   │   └── useMarketData.ts       # Custom hooks para datos
│   ├── globals.css                # Estilos globales
│   ├── layout.tsx                 # Layout raíz
│   └── page.tsx                   # Página principal
├── components/
│   ├── Header.tsx                 # Encabezado con navegación
│   ├── Charts.tsx                 # Gráficos de precios y RSI
│   ├── AIChat.tsx                 # Chat y análisis de IA
│   ├── NewsFeed.tsx               # Feed de noticias
│   └── AlertManager.tsx           # Gestor de alertas
├── lib/
│   ├── types.ts                   # Tipos TypeScript
│   ├── store.ts                   # Estado global (Zustand)
│   └── mockData.ts                # Datos simulados e indicadores
├── public/                        # Archivos estáticos
├── package.json                   # Dependencias
├── tsconfig.json                  # Configuración TypeScript
├── next.config.js                 # Configuración Next.js
├── tailwind.config.js             # Configuración Tailwind
└── README.md                      # Este archivo
```

## 🎯 Funcionalidades Detalladas

### Dashboard Principal
- Selector de activos con 7 instrumentos precargados (BTC, ETH, AAPL, GOOGL, TSLA, EUR/USD, GBP/USD)
- Vista en tiempo real con actualización de precios cada 5 segundos
- Sidebar colapsable en móvil para mejor UX
- Header sticky con información de precio actual

### Gráficos y Análisis Técnico
- Gráficos interactivos con Recharts
- Cálculo automático de SMA(20), EMA(12), RSI(14)
- Visualización de volumen
- Estadísticas de alto, bajo y promedio

### Chat Conversacional
- Interfaz intuitiva de chat
- Respuestas contextuales basadas en el activo seleccionado
- Historial de chat persistente
- Indicador de escritura mientras la IA "analiza"

### Análisis de IA
- Genera análisis técnico con tendencia (alcista/bajista/neutral)
- Proporciona nivel de confianza (60-100%)
- Identifica niveles de soporte y resistencia
- Cálculo automático basado en máximos y mínimos

### Panel de Alertas
- Crear alertas directamente desde el modal
- Vista flotante en esquina inferior derecha
- Lista de últimas 5 alertas
- Contador de alertas activas

### Noticias
- 6 noticias de ejemplo con sentimiento real
- Filtrado por activo
- Indicadores visuales de sentimiento
- Links a fuentes originales

## 📊 API Endpoints

### GET /api/market
Parámetros:
- `symbol` (string): Símbolo del activo (ej: BTCUSD)
- `type` (string): Tipo de datos - 'price', 'history', 'news'
- `interval` (TimeFrame): Para histórico - '1m', '5m', '15m', '1h', '4h', '1d', '1w'

Respuesta:
```json
{
  "symbol": "BTCUSD",
  "price": 42350.50,
  "change": 1250.50,
  "changePercent": 3.05,
  "timestamp": 1708959157000
}
```

### POST /api/ai
Body:
```json
{
  "symbol": "BTCUSD",
  "timeframe": "1h",
  "chartData": [{ "time": 1708959157000, "open": 42000, "high": 42500, "low": 41800, "close": 42350, "volume": 1000000 }],
  "indicators": []
}
```

Respuesta:
```json
{
  "analysis": "Bitcoin muestra señales técnicas alcistas...",
  "trend": "bullish",
  "recommendation": "Mantener posiciones largas...",
  "confidence": 78,
  "support": 41000,
  "resistance": 44000
}
```

## 🎨 Diseño y UX

### Colores
- **Fondo**: #0d1117 (oscuro profesional)
- **Verde (Subidas)**: #22c55e
- **Rojo (Bajadas)**: #ef4444
- **Acentos**: #58a6ff
- **Muted**: #60696b

### Componentes UI
- Botones con efecto hover
- Inputs con validación
- Modales responsive
- Sidebar colapsable
- Animaciones suaves
- Tooltips informativos

### Responsive
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

## 🔧 Configuración Personalizada

### Agregar nuevos activos
Editar `lib/store.ts` en el array `MOCK_ASSETS`:
```typescript
{
  id: '8',
  symbol: 'NVDA',
  name: 'NVIDIA',
  type: 'stock',
  price: 850.00,
  change: 5.50,
  changePercent: 0.65,
  isFavorite: false,
}
```

### Cambiar timeframes disponibles
Editar en `components/Header.tsx`:
```typescript
const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
```

### Personalizar colores
Editar en `tailwind.config.js` los valores en la sección `theme.extend.colors`

## 📈 Indicadores Técnicos Disponibles

### SMA (Media Móvil Simple)
- Periodo: 20 (configurable)
- Uso: Identifica tendencias
- Fórmula: Suma de últimos n períodos / n

### EMA (Media Móvil Exponencial)
- Periodo: 12 (configurable)
- Uso: Mayor peso a precios recientes
- Fórmula: EMA = (Precio × k) + (EMA_anterior × (1 - k))

### RSI (Índice de Fuerza Relativa)
- Periodo: 14 (estándar)
- Rango: 0-100
- Overbought (>70) / Oversold (<30)

## 🚀 Mejoras Futuras

- [ ] Integración con API real (Binance, Coinbase, Alpha Vantage)
- [ ] WebSocket para actualización en tiempo real genuino
- [ ] Backups de análisis históricos
- [ ] Exportación de gráficos a PDF/PNG
- [ ] Estrategias de trading predefinidas
- [ ] Backtesting de estrategias
- [ ] Notificaciones push del navegador
- [ ] Temas adicionales personalizables
- [ ] Análisis de correlación entre activos
- [ ] Heatmaps de sectores

## 📝 Licencia

Este proyecto es de código abierto. Usa libremente para propósitos educativos y comerciales.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📞 Soporte

Para preguntas o problemas, abre un issue en el repositorio o contáctanos a través del sitio web.

## 🎓 Recursos Educativos

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Análisis Técnico Básico](https://www.investopedia.com/articles/forex/09/technical-analysis-basics.asp)
- [Indicadores Técnicos](https://en.wikipedia.org/wiki/Technical_analysis)

---

**TradingIA** - Análisis de Mercado Financiero Inteligente 📈💰

