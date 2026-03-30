# 🧪 Testing Guide: Verificar que el Fix de CORS Funciona

## ✅ Pre-requisitos
- Node.js instalado
- npm funcional
- Navegador moderno (Chrome, Firefox, Edge)

## 🚀 Pasos para Probar

### 1. Iniciar el Servidor de Desarrollo

```bash
cd C:\Users\Derek López\WebstormProjects\TradingIA
npm run dev
```

**Esperar a que aparezca:**
```
▓ Next.js 16.1.7
✓ Local:        http://localhost:3000
```

### 2. Abrir la Aplicación

- Abre en tu navegador: `http://localhost:3000`
- Deberías ver el dashboard de TradingIA

### 3. Navegar a Recomendaciones

1. Haz clic en el botón **"✨ Recomendaciones"** (esquina superior derecha)
2. Se abrirá la página de recomendaciones

### 4. Iniciar el Escaneo

1. Verás un botón **"Obtener Recomendaciones"** (azul)
2. **Haz clic en él**
3. **IMPORTANTE**: Observa:
   - La barra de progreso comienza a llenar
   - Ves el símbolo siendo analizado (BTCUSDT, ETHUSDT, etc.)
   - El contador muestra progreso (45/256 por ejemplo)
   - El porcentaje se actualiza en tiempo real

### 5. Verificar en la Consola

1. Abre la Consola del Navegador: **F12** → Pestaña **Console**
2. **Busca estos mensajes:**

**✅ ÉXITO (si todo funciona):**
```
✅ Escaneo completado: 200 activos analizados, 56 sin datos
```

**❌ ERROR (No debería aparecer):**
```
Failed to fetch (CORS error)
```

### 6. Verificar Red (Network Tab)

1. En F12, ve a la pestaña **Network**
2. Filtra por `candles` (en la barra de búsqueda)
3. Deberías ver requests como:
   ```
   GET /api/market/candles?symbol=BTCUSDT&interval=1h
   ```
4. Cada request debe retornar **200 OK** o **404** (normal si no hay datos)

### 7. Verificar Resultados

Una vez que el escaneo termina:
1. Verás recomendaciones en tarjetas
2. Cada tarjeta muestra:
   - Símbolo (JPYUSD, SILVER, etc.)
   - Precio Actual (datos reales)
   - ROI Esperado (basado en análisis real)
   - Confianza
   - Objetivos
3. **Todos los precios son REALES** (sin mocks)

## 🔍 Qué Verificar

| Item | ✅ Esperado | ❌ Problema |
|------|-----------|-----------|
| Barra progresa | Sí | Estancada |
| Símbolo cambia | Sí | Congelado |
| Contador sube | Sí | No avanza |
| Consola sin errores | Sí | "Failed to fetch" |
| Network requests | 200/404 | 403/500 |
| Datos en tarjetas | Números reales | "undefined" o 0 |

## 📊 Indicadores de Éxito

### ✅ TODO FUNCIONA SI VES:

1. **Barra de Progreso Animada**
   ```
   Escaneando activos...                45%
   ████████████████░░░░░░░░░░░░░░░░░
   
   Progreso: 45/256  │  Activo: ETHUSDT  │  Analizando...
   ```

2. **Consola Limpia**
   ```
   ✅ Escaneo completado: 200 activos analizados, 56 sin datos
   ```

3. **Network Tab**
   - Múltiples requests a `/api/market/candles`
   - Todos retornando 200 OK o 404

4. **Resultados**
   - Tarjetas con datos reales
   - Precios que coinciden con Binance
   - ROI calculados correctamente

### ❌ PROBLEMAS SI VES:

| Problema | Causa | Solución |
|----------|-------|----------|
| "Failed to fetch" | CORS | El fix debería evitar esto |
| Barra no progresa | Servidor no responde | Reinicia `npm run dev` |
| Red error 500 | API error | Verifica logs del servidor |
| Precios = 0 | Datos no se procesaron | Revisa Network tab |

## 🐛 Debugging

### Si algo falla:

**1. Revisa los logs del servidor:**
```bash
# En la ventana donde está npm run dev
# Deberías ver logs como:
[API] GET /api/market/candles?symbol=BTCUSDT&interval=1h
```

**2. Abre la Consola (F12):**
```javascript
// Prueba manualmente:
fetch('/api/market/candles?symbol=BTCUSD&interval=1h')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
```

**3. Verifica Network Tab:**
- Click en una request a `/api/market/candles`
- Pestaña **Response** - debería ver JSON con velas
- Pestaña **Headers** - verificar status code

### Si el servidor no responde:

```bash
# Termina npm run dev (Ctrl+C)
# Limpia caché y reinicia:
npm run build
npm run dev
```

## 📈 Performance

**Tiempo esperado de escaneo:**
- Total activos: ~256
- Delay entre activos: 100ms
- Tiempo estimado: 25-30 segundos

**Durante el escaneo:**
- CPU: Bajo (análisis en paralelo limitado)
- Red: Múltiples requests a `/api/market/candles`
- Memoria: Normal

## ✨ Casos de Uso

### Caso 1: Escaneo rápido
- 50 activos con datos
- 200 sin datos
- Resultado: 50 recomendaciones

### Caso 2: Símbolos principales
- BTCUSD, ETHUSD, EURUSD, etc.
- Todos tienen datos
- Resultado: Recomendaciones para todos

### Caso 3: Símbolos raros
- Algunos pueden no tener datos
- Se saltan automáticamente
- No aparecen en resultados

## 🎯 Resultado Esperado Final

Después de completar el escaneo:

```
Recomendaciones de Hoy
├─ Total Escaneados: 256
├─ Recomendaciones: 50
└─ Tiempo de Escaneo: 28.5s

Top 10 ROI:
├─ JPYUSD - +4.66% - 86% confianza
├─ SILVER - +3.59% - 60% confianza
├─ SGDUSD - +3.48% - 65% confianza
└─ ... (resto de activos)

Por Categoría:
├─ Forex Mayor (10 activos)
├─ Commodities (10 activos)
├─ Índices (10 activos)
└─ ... (resto de categorías)
```

## 📝 Notas

- El escaneo es **100% en tiempo real** contra Binance
- Sin datos mock (si un activo no tiene datos, no aparece)
- La barra de progreso es **completamente funcional**
- Los precios son **verificables contra Binance**

## ✅ Checklist Final

- [ ] Servidor inicia sin errores
- [ ] Página carga correctamente
- [ ] Botón "Obtener Recomendaciones" funciona
- [ ] Barra de progreso aparece
- [ ] Símbolo actual se actualiza
- [ ] Consola sin errores CORS
- [ ] Network requests completan exitosamente
- [ ] Resultados muestran datos reales
- [ ] Escaneo termina sin errores

---

**Si TODO está marcado ✅, el fix es exitoso!**


