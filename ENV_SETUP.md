# Configuración de Variables de Entorno - TradingIA

## 📋 Resumen

Este documento explica cómo configurar las variables de entorno necesarias para que TradingIA funcione correctamente con todas las APIs de mercado e IA.

## 🚀 Inicio Rápido

1. Copia el archivo `.env.local` en la raíz del proyecto
2. Reemplaza `tu_api_key_de_*` con tus claves API reales
3. Reinicia el servidor de desarrollo

```bash
npm run dev
```

## 🔑 Variables de Entorno Requeridas

### Finnhub API (Acciones)

```
NEXT_PUBLIC_FINNHUB_KEY=tu_api_key_de_finnhub
```

**Descripción:** API para obtener datos de acciones, cotizaciones en tiempo real y WebSocket.

**Obtener API Key:**
1. Ve a https://finnhub.io
2. Regístrate (gratis)
3. Copia tu API key en el dashboard
4. Rate limit gratuito: 60 calls/min

**Usado en:**
- `lib/services/marketService.ts` - FinnhubService
- `app/api/market/route.ts` - Datos de acciones
- `app/api/ai/route.ts` - Análisis de acciones

### Alpha Vantage API (Datos Históricos)

```
NEXT_PUBLIC_ALPHAVANTAGE_KEY=tu_api_key_de_alphavantage
```

**Descripción:** API para obtener datos históricos de acciones e indicadores técnicos (SMA, EMA, RSI, MACD).

**Obtener API Key:**
1. Ve a https://www.alphavantage.co
2. Regístrate (gratis)
3. Copia tu API key en el email de confirmación
4. Rate limit gratuito: 5 calls/min

**Usado en:**
- `lib/services/marketService.ts` - AlphaVantageService
- `app/api/market/route.ts` - Datos históricos

### NewsAPI (Noticias)

```
NEXT_PUBLIC_NEWS_API_KEY=tu_api_key_de_newsapi
```

**Descripción:** API para obtener noticias financieras, análisis de sentimiento y búsqueda de noticias.

**Obtener API Key:**
1. Ve a https://newsapi.org
2. Regístrate (gratis)
3. Copia tu API key en el dashboard
4. Rate limit gratuito: 100 calls/día

**Usado en:**
- `lib/services/newsService.ts` - NewsAPIService
- `app/api/market/route.ts` - Noticias
- `app/api/ai/route.ts` - Contexto de noticias

### CoinGecko API (Criptomonedas)

```
# Opcional - CoinGecko funciona sin API key
# NEXT_PUBLIC_COINGECKO_API_KEY=tu_api_key_de_coingecko
```

**Descripción:** API para obtener datos de criptomonedas, precios y tendencias.

**Características:**
- ✅ **Plan Gratuito:** Sin API key necesaria
- Rate limit gratuito: 10-50 calls/min
- Perfecto para desarrollo

**Obtener API Key (Opcional):**
1. Ve a https://www.coingecko.com/api
2. Regístrate (gratis)
3. Copia tu API key para mayor rate limit
4. Rate limit premium: Sin límites

**Usado en:**
- `lib/services/marketService.ts` - CoinGeckoService
- `app/api/market/route.ts` - Datos de criptomonedas

### z-ai-Web-Dev-SDK (Inteligencia Artificial)

**No requiere configuración adicional.** El SDK se inicializa automáticamente.

**Características:**
- ✅ Web search integrado
- ✅ Análisis técnico con IA
- ✅ Chat de mercado
- ✅ Sin API keys requeridas

**Usado en:**
- `app/api/ai/route.ts` - Análisis técnico y chat

## 🔐 Variables de Entorno Opcionales

```
# Entorno (por defecto: development)
NODE_ENV=development

# URL Base de la API (para llamadas desde el servidor)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📝 Notas Importantes

### Prefijo NEXT_PUBLIC_

Las variables que comienzan con `NEXT_PUBLIC_` están disponibles en el cliente (navegador).

✅ **Seguro publicar en GitHub:**
```
NEXT_PUBLIC_FINNHUB_KEY
NEXT_PUBLIC_ALPHAVANTAGE_KEY
NEXT_PUBLIC_NEWS_API_KEY
NEXT_PUBLIC_COINGECKO_API_KEY
```

❌ **Nunca publicar en GitHub:**
```
Variables que comiencen con nombres sin NEXT_PUBLIC_
Información sensible del servidor
```

### Rate Limits

| API | Plan Gratuito | Rate Limit |
|-----|---------------|-----------|
| Finnhub | ✅ | 60 calls/min |
| Alpha Vantage | ✅ | 5 calls/min |
| NewsAPI | ✅ | 100 calls/día |
| CoinGecko | ✅ | 10-50 calls/min |
| z-ai SDK | ✅ | Sin límite |

## 🧪 Probar Configuración

### 1. Verificar Finnhub

```bash
curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY"
```

### 2. Verificar Alpha Vantage

```bash
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_API_KEY"
```

### 3. Verificar NewsAPI

```bash
curl "https://newsapi.org/v2/everything?q=bitcoin&apikey=YOUR_API_KEY"
```

### 4. Verificar CoinGecko (Sin API Key)

```bash
curl "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
```

## 🚨 Solución de Problemas

### "API key is invalid"
- Verifica que copiastes la API key correctamente
- Algunos servicios requieren activación por email

### "Rate limit exceeded"
- Espera unos minutos antes de reintentar
- Considera upgradear a plan premium

### "API not responding"
- Verifica tu conexión a internet
- Comprueba el estado de las APIs en:
  - Finnhub: https://status.finnhub.io
  - Alpha Vantage: https://www.alphavantage.co
  - NewsAPI: https://newsapi.org

### Errores en la aplicación
- Abre la consola del navegador (F12)
- Verifica los logs de la terminal del servidor
- Asegúrate que las variables están en `.env.local`

## 📦 Estructura de Archivos

```
TradingIA/
├── .env.local           # ← Tus variables de entorno (NO subir a Git)
├── .env.example         # ← Plantilla (puede ir a Git)
├── .gitignore
├── lib/
│   └── services/
│       ├── marketService.ts
│       └── newsService.ts
├── app/
│   └── api/
│       ├── ai/
│       │   └── route.ts
│       └── market/
│           └── route.ts
└── components/
    └── AIChat.tsx
```

## ✅ Checklist

- [ ] Creé cuenta en Finnhub
- [ ] Obtuve API key de Finnhub
- [ ] Creé cuenta en Alpha Vantage
- [ ] Obtuve API key de Alpha Vantage
- [ ] Creé cuenta en NewsAPI
- [ ] Obtuve API key de NewsAPI
- [ ] Actualicé `.env.local` con mis keys
- [ ] Reinicié servidor de desarrollo
- [ ] Probé endpoints en navegador
- [ ] Verifico consola para errores

## 🎯 Próximos Pasos

1. Configura todas las variables de entorno
2. Reinicia el servidor: `npm run dev`
3. Abre http://localhost:3000
4. Prueba las funciones:
   - Obtener precios de acciones
   - Obtener datos de criptomonedas
   - Enviar mensajes al chat de IA
   - Solicitar análisis técnico

## 📚 Enlaces Útiles

- [Finnhub API Documentation](https://finnhub.io/docs/api)
- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [NewsAPI Documentation](https://newsapi.org/docs)
- [CoinGecko API Documentation](https://www.coingecko.com/api/documentations)
- [z-ai SDK Documentation](https://z-ai.dev)

## 💬 Soporte

Si encuentras problemas:
1. Revisa los logs en la terminal
2. Verifica el estado de las APIs externas
3. Comprueba que las variables de entorno están correctas
4. Consulta la documentación de cada API

---

**Última actualización:** Febrero 2026
**Versión de TradingIA:** 1.0.0

