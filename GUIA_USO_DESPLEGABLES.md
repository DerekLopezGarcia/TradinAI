# 🎬 GUÍA DE USO - Desplegables Mejorados

## Descripción General

Los desplegables (dropdowns) de la aplicación ahora cuentan con un sistema mejorado de carga de datos que proporciona feedback visual claro y manejo automático de errores.

---

## 🎯 Características Principales

### 1. Indicador de Carga
Cuando abres un desplegable, aparece un spinner con el mensaje:
```
⏳ Cargando precios...
```

Esto indica que la aplicación está obteniendo los precios en tiempo real de tus activos.

### 2. Timeout Automático
- **Duración**: 18 segundos
- **Función**: Evita que el spinner se quede eternamente cargando
- **Comportamiento**: Después de 18 seg, muestra lo que se pudo cargar

### 3. Indicador de Errores
Para los activos que no pudieron cargar sus precios, verás:
```
❌ No cargó
```
En color rojo para identificarlos fácilmente.

### 4. Deshabilitación de Fallos
- Los activos que muestran "No cargó" **no se pueden seleccionar**
- Están visualmente deshabilitados (opacidad reducida)
- Solo puedes seleccionar activos que cargaron exitosamente

---

## 📍 Desplegables Mejorados

### Header - Dropdown de Activos

**Ubicación**: Parte superior izquierda de la aplicación
**Símbolo**: Muestra el activo seleccionado

**Flujo:**
```
1. Click en botón de activo
   ↓
2. Aparece spinner "Cargando precios..."
   ↓
3. Se obtienen precios de todos los activos (máx 18 seg)
   ↓
4. Se muestran los activos con sus precios
   - Los que cargaron: precio + cambio %
   - Los que fallaron: "No cargó" (rojo)
   ↓
5. Puedes seleccionar solo los que cargaron
```

### NavBar - Dropdowns por Categoría

**Ubicación**: Barra de navegación (debajo del header)
**Categorías**: Favoritos, Criptomonedas, Acciones, etc.

**Flujo:**
```
1. Click en botón de categoría (ej: "Criptomonedas")
   ↓
2. Aparece spinner "Cargando precios..." para esa categoría
   ↓
3. Se cargan los precios de los 20 activos de esa categoría (máx 18 seg)
   ↓
4. Se muestran los activos con sus precios
   - Los que cargaron: precio + cambio % + corazón
   - Los que fallaron: "No cargó" (rojo)
   ↓
5. Puedes seleccionar solo los que cargaron
```

---

## 🔄 Escenarios Comunes

### Escenario 1: Todo Carga Correctamente ✅

```
User abre dropdown
    ↓
[Spinner 5 segundos...]
    ↓
Se muestran todos los precios:
├─ BTCUSD: $45,234.50 (+2.34%)
├─ ETHUSD: $2,456.78 (-1.23%)
├─ BNBUSD: $612.34 (+0.45%)
└─ ... más activos ...
    ↓
Usuario selecciona el que prefiera
```

### Escenario 2: Algunos Fallan ⚠️

```
User abre dropdown
    ↓
[Spinner 10 segundos...]
    ↓
Se muestran resultados:
├─ BTCUSD: $45,234.50 (+2.34%)        ✅ Éxito
├─ ETHUSD: No cargó                   ❌ Error
├─ BNBUSD: $612.34 (+0.45%)           ✅ Éxito
├─ XRPUSD: No cargó                   ❌ Error
└─ ... más activos ...
    ↓
Usuario puede seleccionar BTCUSD o BNBUSD
(ETHUSD y XRPUSD están deshabilitados)
```

### Escenario 3: Timeout (>18 segundos) ⏱️

```
User abre dropdown
    ↓
[Spinner 18 segundos...]
    ↓
Se detiene automáticamente
    ↓
Se muestran:
├─ Activos que cargaron: precio + cambio %
└─ Activos que no: "No cargó"
    ↓
Misma experiencia que Escenario 2
```

---

## 🎨 Indicadores Visuales

| Estado | Icono | Color | Interacción |
|--------|-------|-------|------------|
| Cargando | 🔄 | Gris | - |
| Éxito | ✅ | Verde | Seleccionable |
| Error | ❌ | Rojo | No seleccionable |
| Deshabilitado | 🚫 | Gris 60% | No seleccionable |

---

## ⚙️ Configuración

### Timeout Actual
- **Valor**: 18 segundos
- **Ubicación**: `components/Header.tsx` (línea 49) y `components/NavBar.tsx` (línea 107)
- **Cómo cambiar**:
  ```typescript
  // Reemplaza 18000 por tu valor (en milisegundos)
  setTimeout(() => { setIsLoadingPrices(false); }, 18000);
  ```

### Tamaño del Spinner
- **Tamaño**: `w-4 h-4` (pequeño)
- **Ubicación**: Líneas donde aparece `<Loader2 className="w-4 h-4 animate-spin" />`
- **Cómo cambiar**:
  ```typescript
  <Loader2 className="w-6 h-6 animate-spin" /> {/* Más grande */}
  ```

---

## 🚨 Solución de Problemas

### Problema: El dropdown muestra "Cargando..." pero nunca completa

**Soluciones:**
1. Espera 18 segundos (timeout automático)
2. Verifica tu conexión a internet
3. Abre las DevTools (F12) y revisa la consola para mensajes de error
4. Intenta recargar la página (Ctrl+R)

### Problema: Algunos activos muestran "No cargó"

**Posibles causas:**
- Problema de conexión de red
- API externa caída o con problemas
- Símbolo inválido o no soportado
- Timeout individual del activo

**Soluciones:**
1. Intenta abriendo el dropdown nuevamente
2. Comprueba tu conexión a internet
3. Usa otro activo que sí cargó

### Problema: El dropdown está muy lento

**Soluciones:**
1. Verifica tu conexión a internet (prueba speedtest.net)
2. Si usas VPN, intenta desactivarla
3. Abre DevTools (F12) → Network y verifica qué requests son lentos

---

## 📊 Información Técnica

### Cambios Implementados

**Header** (`components/Header.tsx`):
- ✅ Nueva función `loadAssetPrices()` que carga precios con timeout
- ✅ Estado `isLoadingPrices` para mostrar spinner
- ✅ Estado `failedAssets` para rastrear qué activos fallaron
- ✅ Función `handleToggleDropdown()` que inicia la carga

**NavBar** (`components/NavBar.tsx`):
- ✅ Ref `failedSymbolsRef` para rastrear fallos por categoría
- ✅ Estado `failedSymbols` para mantener la lista de fallos
- ✅ Función `fetchPricesForType()` mejorada con timeout
- ✅ Validación de fallos al renderizar

### APIs Utilizadas

- `/api/market?symbol=BTCUSD&type=price` - Obtiene precio actual
- Usa Promise.allSettled() para manejar múltiples requests simultáneamente
- Batching inteligente: 5 símbolos por lote en NavBar

---

## ✅ Checklist de Funcionalidad

- [ ] Abrir dropdown de Header → Ver spinner
- [ ] Esperar 5-10 seg → Ver precios cargados
- [ ] Abrir dropdown de NavBar → Ver spinner por categoría
- [ ] Verificar que algunos activos muestran "No cargó" en rojo
- [ ] Intentar seleccionar un activo que falló → No hacer nada
- [ ] Seleccionar un activo que cargó → Navegar correctamente
- [ ] Esperar >18 seg → Timeout automático detiene spinner

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa la consola** (F12 → Console)
2. **Busca mensajes de error** (busca "❌" o "Error")
3. **Verifica tu conexión** (reload de la página)
4. **Intenta en incógnito** (descarta caché problematico)

---

## 🚀 Próximas Mejoras

Características planejadas:
- [ ] Botón de retry para intentar de nuevo
- [ ] Cache persistente de precios
- [ ] Toast notificación de timeout
- [ ] Ícono de error junto a "No cargó"
- [ ] Carga incremental conforme llegan datos

---

**Última actualización**: 2026-03-30  
**Versión**: 1.0 (Stable)  
**Estado**: ✅ Producción

