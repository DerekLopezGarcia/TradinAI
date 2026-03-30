# 🔍 DIAGNÓSTICO: Problemas de Carga de Datos - Investigación Completa

## 📊 Problemas Identificados

### 1. **SÍMBOLOS CON SOPORTE LIMITADO EN APIs**

Algunos símbolos en las categorías NO tienen datos disponibles en los proveedores:

#### Bancos (Símbolos no soportados):
- `HSBC` - Listado en Londres (LSE), no en US
- `BARCLAYS` - Listado en Londres, no fácilmente disponible
- `DBKR` - Listado en Frankfurt, no en APIs comunes
- `BBVA` - Listado en Madrid, no en APIs US
- `SAB` - Listado en Madrid (Sabadell), no fácilmente disponible

#### Energía (Símbolos problemáticos):
- `ICLN` - Es un ETF de energía limpia, a veces sin datos en tiempo real

#### Telecomunicaciones (Símbolos problemáticos):
- `CMCSA` - Usa 5 caracteres (vs máximo permitido 20, pero APIs esperan 4)

### 2. **PROBLEMA EN LA VALIDACIÓN**

En `validationService.ts`:
```typescript
return /^[A-Z0-9]{1,20}$/.test(symbol.trim());
```

✅ Esto permite hasta 20 caracteres, pero algunos símbolos históricos podrían ser rechazados.

### 3. **PROBLEMA EN EL MAPEO DE SÍMBOLOS**

En `app/api/market/route.ts`:
```typescript
const COINGECKO_IDS: Record<string, string> = {
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  // ... SOLO tiene 8 criptos mapeadas
}
```

❌ **Problema crítico**: Hay 30 criptos en scannerAssets pero solo 8 tienen mapeo a CoinGecko

Criptos SIN mapeo a CoinGecko (22 de 30):
- BNBUSD, XRPUSD, DOGEUSD, ADAUSD, POLYUSD, AVAXUSD, LINKUSD, MATICUSD
- LTCUSD, DOTUSD, ETCUSD, XMRUSD, DASHUSD, ZECUSD, XLMUSD, XTZUSD
- FILUSD, WAVESUSD, NEARUSD, ATOMUSD, ALGOUSD, VETUSD, IOTAUSD
- HBARUSD, CHZUSD, SANDUSD, SUIUSD, ARBUSD

### 4. **PROBLEMA EN EL FLUJO DE FALLBACK**

En `getPriceData()`:
```typescript
if (isCrypto(symbol)) {
  // Intenta Binance
  const price = await binanceService.getCurrentPrice(symbol);
  // Si falla, intenta CoinGecko
  const coinPrice = await marketService.getCoinPrice(coinId);
}
```

**Problema**: Si el símbolo no está en `COINGECKO_IDS`, usa `'bitcoin'` como default:
```typescript
const coinId = COINGECKO_IDS[symbol] || 'bitcoin'; // ❌ SIEMPRE devuelve bitcoin!
```

Esto significa que **TODAS las criptos sin mapeo devuelven precio de Bitcoin**, no su precio real.

### 5. **PROBLEMA EN LA NORMALIZACIÓN DE SÍMBOLOS**

Algunos símbolos necesitan normalización:
- `BTCUSD` → `BTC/USDT` (para Binance)
- Pero el código puede no estar normalizando correctamente

En `binanceService.ts`, probablemente hay código que convierte:
```typescript
// Ejemplo (buscar en binanceService.ts)
const pair = symbol.replace('USD', 'USDT'); // BTCUSD → BTCUSDT ✅
```

**Pero algunas criptos usan sufijo diferente:**
- POLKAUSD → DOTUSDT (error! símbolo incorrecto)
- AVAXUSD → AVAXUSDT ✅

### 6. **PROBLEMA EN SÍMBOLOS CON CARACTERES ESPECIALES**

En `scannerAssets.ts` hay:
- `HSBC` - Símbolo válido pero puede tener ticker diferente (HSBA en LSE)
- `NKE` - Nike (correcto)
- Pero algunos descritos con `&` en nombres no en símbolos

---

## 🎯 Solución Propuesta

### Paso 1: Crear Mapeo Completo de Criptomonedas

```typescript
// En app/api/market/route.ts, reemplazar COINGECKO_IDS con:
const COINGECKO_IDS: Record<string, string> = {
  // Existentes (8)
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  'SOLUSD': 'solana',
  'XRPUSD': 'ripple',
  'ADAUSD': 'cardano',
  'DOGEUSD': 'dogecoin',
  'POLKAUSD': 'polkadot',
  'LITEUSD': 'litecoin',
  
  // Nuevas (22 faltantes)
  'BNBUSD': 'binancecoin',
  'POLYUSD': 'polygon',
  'AVAXUSD': 'avalanche-2',
  'LINKUSD': 'chainlink',
  'MATICUSD': 'matic-network', // Alias de polygon
  'LTCUSD': 'litecoin',
  'DOTUSD': 'polkadot',
  'ETCUSD': 'ethereum-classic',
  'XMRUSD': 'monero',
  'DASHUSD': 'dash',
  'ZECUSD': 'zcash',
  'XLMUSD': 'stellar',
  'XTZUSD': 'tezos',
  'FILUSD': 'filecoin',
  'WAVESUSD': 'waves',
  'NEARUSD': 'near',
  'ATOMUSD': 'cosmos',
  'ALGOUSD': 'algorand',
  'VETUSD': 'vechain',
  'IOTAUSD': 'iota',
  'HBARUSD': 'hedera-hashgraph',
  'CHZUSD': 'chiliz',
  'SANDUSD': 'the-sandbox',
  'SUIUSD': 'sui',
  'ARBUSD': 'arbitrum',
};
```

### Paso 2: Remover Símbolos Sin Soporte

Remover de `scannerAssets.ts`:
- `HSBC` (no fácilmente disponible en APIs)
- `BARCLAYS` (bolsa de Londres)
- `DBKR` (bolsa de Frankfurt)
- `BBVA` (bolsa de Madrid)
- `SAB` (bolsa de Madrid)

O crear categoría separada: "Bancos Internacionales" con nota de limitaciones.

### Paso 3: Mejorar Manejo de Errores

En `NavBar.tsx`, cuando falla la carga:
```typescript
if (!res.ok) {
  console.warn(`❌ No hay datos para ${symbol} (HTTP ${res.status})`);
  currentFailed.add(symbol);
  return;
}
```

Mostrar más información:
```typescript
// T1.3+: Mostrar por qué falló
console.warn(`❌ ${symbol}: ${res.status} - ${res.statusText}`);
if (res.status === 404) {
  console.warn(`   Símbolo no encontrado en proveedores`);
} else if (res.status === 429) {
  console.warn(`   Rate limit - demasiadas solicitudes`);
} else if (res.status === 500) {
  console.warn(`   Error del servidor de datos`);
}
```

---

## 📋 Resumen de Raíces de Problemas

| Problema | Causa Raíz | Símbolos Afectados | Solución |
|----------|-----------|-------------------|----------|
| No hay datos | Criptos sin mapeo CoinGecko | 22/30 criptos | Agregar mapeo completo |
| Precio incorrecto | Default a Bitcoin para criptos sin mapeo | BNBUSD, POLYUSD, etc | Mapeo CoinGecko correcto |
| Símbolos sin soporte en APIs | Bolsas internacionales | HSBC, BARCLAYS, BBVA | Remover o separar categoría |
| Errores silenciosos | Promise.allSettled() oculta errores | Todos | Logging mejor |
| Rate limiting | Demasiadas requests simultáneas | Todas | Ya implementado en T1.3 |
| Timeout | Espera demasiado | Todas | Reducido a 5s en T1.3 |

---

## 🔧 Prioridad de Fixes

1. **CRÍTICA**: Agregar mapeo completo de criptos a CoinGecko (22 símbolos)
2. **ALTA**: Remover símbolos de bolsas no soportadas
3. **MEDIA**: Mejorar logging de errores
4. **BAJA**: Agregar categoría "Bancos Internacionales" si se quieren mantener

---

Documento generado para investigación técnica.

