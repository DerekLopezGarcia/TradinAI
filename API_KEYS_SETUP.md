# API KEYS - SOLUCIONES PARA OBTENER DATOS DE TODAS LAS CATEGORÍAS

## 📋 Descripción General

Este proyecto requiere varias API keys para acceder a datos de diferentes tipos de activos:

### 🔑 API Keys Requeridas

#### 1. **Twelve Data** (Acciones, Índices, Forex)
   - **URL:** https://twelvedata.com/
   - **Planes:** Gratuito (hasta 500 llamadas/día), Premium ($9.99/mes)
   - **Lo que obtienes:** Datos de acciones, índices, ETFs
   - **Configuración:**
     ```bash
     TWELVE_DATA_API_KEY=tu_clave_aqui
     ```

#### 2. **Alpha Vantage** (Acciones alternativo)
   - **URL:** https://www.alphavantage.co/
   - **Planes:** Gratuito (5 llamadas/min)
   - **Lo que obtienes:** Datos de acciones estadounidenses
   - **Configuración:**
     ```bash
     ALPHA_VANTAGE_API_KEY=tu_clave_aqui
     ```

#### 3. **Finnhub** (Acciones)
   - **URL:** https://finnhub.io/
   - **Planes:** Gratuito (60 llamadas/min)
   - **Lo que obtienes:** Datos de acciones, noticias
   - **Configuración:**
     ```bash
     FINNHUB_API_KEY=tu_clave_aqui
     ```

#### 4. **Quandl** (Commodities)
   - **URL:** https://www.quandl.com/
   - **Planes:** Gratuito (20 llamadas/10min)
   - **Lo que obtienes:** Datos de commodities, petróleo, oro
   - **Configuración:**
     ```bash
     QUANDL_API_KEY=tu_clave_aqui
     ```

#### 5. **OANDA** (Forex)
   - **URL:** https://developer.oanda.com/
   - **Planes:** Cuenta de práctica gratuita
   - **Lo que obtienes:** Datos de Forex en tiempo real
   - **Configuración:**
     ```bash
     OANDA_API_KEY=tu_clave_aqui
     OANDA_ACCOUNT_ID=tu_cuenta
     ```

#### 6. **IEX Cloud** (Acciones alternativo)
   - **URL:** https://iexcloud.io/
   - **Planes:** Gratuito (100 mensajes/mes)
   - **Lo que obtienes:** Datos de acciones, datos de mercado
   - **Configuración:**
     ```bash
     IEX_CLOUD_API_KEY=tu_clave_aqui
     ```

## 🚀 Pasos de Configuración Rápida

### Paso 1: Crear archivo `.env.local`
```bash
cp .env.example .env.local
```

### Paso 2: Obtener las API keys

**Para Twelve Data (RECOMENDADO para acciones/índices):**
1. Ir a https://twelvedata.com/
2. Registrarse gratis
3. Copiar tu API key
4. Pegar en `.env.local`:
   ```
   TWELVE_DATA_API_KEY=pk_xxxxxxxxxxxxx
   ```

**Para Quandl (Commodities):**
1. Ir a https://www.quandl.com/
2. Registrarse
3. Copiar API key desde Account Settings
4. Pegar en `.env.local`:
   ```
   QUANDL_API_KEY=xxxxxxxxxxxxx
   ```

**Para Finnhub (Acciones alternativo):**
1. Ir a https://finnhub.io/
2. Registrarse gratis
3. Copiar API key
4. Pegar en `.env.local`:
   ```
   FINNHUB_API_KEY=xxxxxxxxxxxxx
   ```

### Paso 3: Reiniciar el servidor
```bash
npm run dev
```

## 📊 Cobertura de Datos por API

| Tipo | API Recomendada | Alternativas |
|------|-----------------|--------------|
| **Criptomonedas** | Binance (sin API) | CoinGecko, Kraken |
| **Acciones** | Twelve Data | Alpha Vantage, Finnhub, IEX |
| **Índices** | Twelve Data | Alpha Vantage |
| **Forex** | OANDA, OpenExchangeRates | FXCM, Interactive Brokers |
| **Commodities** | Quandl | EODATA, Intrinio |
| **Todos** | Yahoo Finance (sin API) | - |

## 💡 Soluciones Implementadas

El sistema está configurado para usar **fallbacks automáticos**:

1. **Crypto:** Binance → CoinGecko (ambos sin API key)
2. **Acciones:** Twelve Data → Finnhub → Alpha Vantage
3. **Forex:** OANDA → Open Exchange Rates
4. **Commodities:** Quandl → Yahoo Finance
5. **Índices:** Twelve Data → Yahoo Finance

## ✅ Verificar que todo funciona

Ejecutar el test de APIs:
```bash
node test-all-apis.js
```

Si algunos valores fallan:
1. Revisar `.env.local` y asegurar que las claves están correctas
2. Verificar que las APIs están activas (sin account suspended)
3. Revisar los límites de llamadas/día
4. El sistema intentará usar fallbacks automáticos

## 📝 Notas Importantes

- **Sin API keys:** Criptomonedas y Forex funcionan sin keys (Binance, Open Exchange Rates)
- **Límites gratuitos:** Pueden retrasar el escaneo de 250+ activos, pero funcionará
- **Recomendación:** Obtener al menos Twelve Data para acciones e índices
- **Escalabilidad:** Para produción, considerar un plan de pago o usar múltiples keys rotadas


