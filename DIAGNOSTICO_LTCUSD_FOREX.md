# 🔍 DIAGNÓSTICO: LTCUSD y Forex No Muestran Datos

## Problema 1: LTCUSD Muestra en Gráfico pero No en Listado

### Posibles Causas:

1. **Carga asíncrona no sincronizada**
   - El gráfico se carga de `useMarketData()` hook
   - El listado se carga en NavBar al abrir dropdown
   - El timing puede estar desincronizado

2. **updateAssetPrice no se llama para scanner assets**
   - En NavBar.tsx, solo actualiza con `updateAssetPrice()` para "favorites"
   - Para scanner_* solo llama `addOrUpdateAssetPrice()`
   - Pero este método podría no existir o estar mal implementado

3. **Símbolo LTCUSD podría estar duplicado o no sincronizado**
   - Gráfico: carga LTCUSD de manera individual
   - Listado: carga desde `getAssetsByCategory('Criptomonedas')`
   - Podrían ser instancias diferentes en el store

### Diagrama de Flujo Actual:

```
Usuario abre dropdown "Criptomonedas"
    ↓
NavBar.fetchPricesForType('scanner_criptomonedas')
    ↓
getAssetsByCategory('Criptomonedas') → retorna [BTCUSD, ETHUSD, ..., LTCUSD]
    ↓
Para cada símbolo: fetch /api/market?symbol=LTCUSD
    ↓
Respuesta: {price: 123.45, change: ..., changePercent: ...}
    ↓
addOrUpdateAssetPrice(LTCUSD, ...) ← ¿ESTE MÉTODO EXISTE?
    ↓
¿Store actualiza? ← PROBLEMA: Puede que no se actualice en UI
```

---

## Problema 2: Forex No Muestran Datos

### Análisis Detallado:

1. **Símbolos Forex Definidos:**
   - EURUSD, GBPUSD, JPYUSD, CHFUSD, etc.
   - 31 símbolos en `scannerAssets.ts`

2. **Cómo se Cargan en getPriceData():**
   ```typescript
   const assetType = getAssetType('EURUSD'); // → 'forex'
   
   // Intenta Yahoo Finance
   const yp = await marketService.getYahooPrice('EURUSD');
   
   // Si falla, intenta Finnhub
   const stockQuote = await marketService.getStockQuote('EURUSD');
   ```

3. **Problemas Potenciales:**
   - Yahoo Finance podría NO soportar símbolos como `EURUSD`
   - Esperaría formato diferente: `EUR=X` o similar
   - Finnhub también podría tener problemas con formato
   - Error silencioso en catch, pero userData nunca ve el precio

4. **Síntomas:**
   - Forex carga pero muestra 0 o "--"
   - O muestra "No cargó" en rojo
   - Timeout de 5 segundos llena los logs

---

## Soluciones Recomendadas

### Para LTCUSD:

**Opción A: Verificar addOrUpdateAssetPrice**
- Buscar si método existe en store
- Si no existe, reemplazar con updateAssetPrice
- Asegurarse que se actualiza en tiempo real

**Opción B: Sincronizar carga de dropdown**
- Al seleccionar dropdown, esperar a que terminen las cargas
- Mostrar mensaje "Cargando precios..."
- Actualizar automáticamente cuando lleguen datos

### Para Forex:

**Opción A: Mapear símbolos a formato correcto**
```typescript
// En app/api/market/route.ts, agregar:
const FOREX_SYMBOL_MAP: Record<string, string> = {
  'EURUSD': 'EUR=X',    // Yahoo Finance usa EUR=X
  'GBPUSD': 'GBP=X',
  'JPYUSD': 'JPY=X',
  // ... etc
};

// Antes de llamar a getYahooPrice:
const yahooSymbol = FOREX_SYMBOL_MAP[symbol] || symbol;
const yp = await marketService.getYahooPrice(yahooSymbol);
```

**Opción B: Agregar proveedor especializado para Forex**
- Crear `ForexProvider` que use API especializado (ej: exchangerate-api)
- O agregar fallback a proveedor de datos más confiable

---

## Investigación Necesaria

1. **¿Existe método addOrUpdateAssetPrice()?**
   - Buscar en lib/store.ts
   - Si no existe, es el problema de LTCUSD

2. **¿Qué error retorna getYahooPrice('EURUSD')?**
   - Revisar logs en navegador
   - Probablemente: "invalid symbol" o "404"

3. **¿Finnhub soporta Forex?**
   - Revisar documentación
   - Probablemente NO en plan gratuito

---

## Acciones Inmediatas

1. Buscar addOrUpdateAssetPrice en store.ts
2. Revisar si getYahooPrice necesita normalización de símbolos Forex
3. Agregar fallback específico para Forex (usar API diferente)
4. Testear LTCUSD y EURUSD después de fixes

