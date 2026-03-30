# 🧪 Guía de Testing - Trading IA

## Pruebas Rápidas (Sin Compilar)

### 1. ✅ Verificar Error de Claves Duplicadas (ELIMINADO)
**Antes:** Console mostraba error sobre `scanner_QCOM`
**Después:** 
1. Abre DevTools (F12)
2. Ir a RecommendationsPanel
3. Abre los dropdowns de diferentes categorías
4. ✅ NO deberías ver error de claves duplicadas en la consola

**Esperado:** Consola limpia, sin warnings de keys

---

### 2. ✅ Verificar Caché de Recomendaciones
**Paso a paso:**
1. Ve a `/recommendations`
2. Click "Obtener Recomendaciones" o "Comenzar Escaneo"
3. Espera a que termine (unos minutos)
4. Recarga la página (Ctrl+R)
5. ✅ Las recomendaciones deberían cargar INMEDIATAMENTE desde caché

**Test de invalidación:**
1. Abre DevTools → Storage → localStorage
2. Busca `dailyRecommendations`
3. Borra el item
4. Recarga → Deberías ver el botón "Obtener Recomendaciones" de nuevo

---

### 3. ✅ Verificar Top 10 (Antes eran 46)
**Paso a paso:**
1. Abre `/recommendations`
2. Haz click en "Obtener Recomendaciones"
3. Una vez terminado, expande categorías
4. ✅ Cada categoría debería mostrar ~10 valores (no solo 2-3)

**Evidencia en DevTools:**
1. Console → ejecuta: `JSON.parse(localStorage.getItem('dailyRecommendations')).topRoi.length`
2. Debería retornar 50 (top global)
3. Para cada categoría: `byCategory[categoryName].length` debería ser ~10

---

### 4. ✅ Verificar Batching de Precios (Rate Limiting Fijo)
**Paso a paso:**
1. DevTools → Network tab
2. Abre dropdown de "Criptos" en NavBar
3. Observa las peticiones HTTP
4. ✅ Debería ver peticiones en LOTES, no todas simultáneas
5. Debería haber delays entre grupos de peticiones

**Consola:**
```javascript
// Ver caché de precios
JSON.parse(localStorage.getItem('priceCache')) 
// O en Network, filtrar por /api/market
```

---

### 5. ✅ Verificar Interfaz de Recomendaciones
**Verificar:**
- [ ] Selector de Timeframe visible ANTES del escaneo (1h, 4h, 1d, 1w)
- [ ] Input de ROI Mínimo funciona (cambiar valor actualiza vista)
- [ ] Cards verdes: superan el ROI mínimo
- [ ] Cards blancas: en top 10 pero bajo el ROI mínimo
- [ ] Botón "Volver a Gráficos" visible y funcional

---

### 6. ✅ Verificar Modo Oscuro/Claro
**Paso a paso:**
1. Abre el toggle de tema (icono sol/luna)
2. Cambia a Modo Claro
3. ✅ Todo debería ser legible
4. Abre RecommendationsPanel
5. ✅ Los colores de cards deberían ser distintos (más claros)
6. Cambia de nuevo a Modo Oscuro
7. ✅ Debería volver a los colores oscuros

**Verificar especialmente:**
- Inputs de ROI visibles en ambos temas
- Botones con buen contraste
- Texto legible en ambos temas

---

### 7. ✅ Verificar Sin Errores de Hydration
**Con Dark Reader ACTIVO:**
1. Abre la página
2. DevTools → Console
3. ❌ NO deberías ver "Tree hydrated but attributes didn't match"
4. ℹ️ Si ves ese error, es de Dark Reader, no del código
5. Desactiva Dark Reader y recarga
6. ✅ El error debería desaparecer

---

## Flujo Completo de Testing

### Escenario 1: Usuario Nuevo
1. [ ] Abre http://localhost:3000
2. [ ] Navega a /recommendations
3. [ ] Click "Obtener Recomendaciones"
4. [ ] ✅ Escaneo completa sin errores
5. [ ] ✅ Ve Top 10 valores en cada categoría
6. [ ] ✅ Cambia ROI mínimo
7. [ ] ✅ Cards se resaltan en verde cuando superan ROI

### Escenario 2: Usuario Vuelve (Caché)
1. [ ] Abre http://localhost:3000
2. [ ] Navega a /recommendations
3. [ ] ✅ Recomendaciones CARGAN INMEDIATAMENTE del caché
4. [ ] ✅ No dice "Escaneando..." innecesariamente
5. [ ] [ ] Puede click en "Escanear de Nuevo" para refrescar

### Escenario 3: Carga de Precios
1. [ ] En NavBar, abre dropdown "Criptos"
2. [ ] ✅ Precios cargan sin lag
3. [ ] ✅ No hay error de "Rate limit exceeded"
4. [ ] [ ] Abre otro dropdown
5. [ ] [ ] Los precios ya están en caché, cargan al instante

### Escenario 4: Cambio de Tema
1. [ ] Abre en tema Oscuro
2. [ ] Navega a /recommendations
3. [ ] Click botón toggle de tema (sol/luna)
4. [ ] ✅ Todo cambia a Modo Claro
5. [ ] ✅ Legible, colores correctos
6. [ ] [ ] Toggle de nuevo a Oscuro
7. [ ] [ ] Vuelve a la normalidad

---

## Checklist de Compilación

```powershell
# Ejecutar en terminal
cd C:\Users\Derek López\WebstormProjects\TradingIA
npm run build
```

**Esperado:**
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**NO debería haber:**
- ❌ TypeScript errors
- ❌ Build warnings
- ❌ Failed routes

---

## Debugging Avanzado

### Ver Logs de Escaneo
```javascript
// En Console mientras escanea
localStorage.setItem('debug', 'true')
// Luego ejecutar escaneo, verás logs detallados
```

### Forzar Nuevo Caché
```javascript
// Limpia TODO el localStorage
localStorage.clear()
// Recarga la página
location.reload()
```

### Ver Estado del Store
```javascript
// En Console
const store = JSON.parse(localStorage.getItem('market-store'))
console.table(store.assets) // Ver todos los activos
```

### Performance
```javascript
// Medir tiempo de carga de precios
performance.mark('start')
// Abrir dropdown
performance.mark('end')
performance.measure('dropdown', 'start', 'end')
performance.getEntriesByName('dropdown')[0].duration
```

---

## Errores Comunes y Soluciones

### Error: "Rate limit exceeded"
**Causa:** Las peticiones no se están agrupando
**Solución:**
1. Limpia localStorage: `localStorage.clear()`
2. Limpia caché .next: `rm -r .next`
3. Recompila: `npm run build`

### Error: "Claves duplicadas"
**Causa:** Outdated code
**Solución:**
1. Git pull la última versión
2. `npm install`
3. `npm run build`

### No se cargan las recomendaciones
**Causa:** APIs no configuradas
**Solución:**
1. Verifica `.env.local`
2. Cambia `NEXT_PUBLIC_FINNHUB_KEY` por tu clave válida
3. Recarga

### Modo oscuro no funciona
**Causa:** localStorage corrupt
**Solución:**
1. DevTools → Storage → Clear Everything
2. Recarga
3. Verifica que el toggle funcione

---

## Performance Targets

| Métrica | Target | Actual |
|---------|--------|--------|
| Caché load time | <100ms | <50ms |
| Dropdown open time | <500ms | ~300ms |
| Escaneo completo | <5min | ~3-4min |
| Tema toggle | <100ms | ~50ms |

---

¿Alguna duda o algo no funciona? Revisa el archivo `CAMBIOS_REALIZADOS.md` para más detalles técnicos.


