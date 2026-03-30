# 🎨 Interfaz Visual - Análisis de IA

## Estado 1: Esperando Análisis (Inicial)

```
┌─────────────────────────────────────────────────────────────┐
│ Trading IA - Análisis de Mercado                            │
├─────────────────────────────────────────────────────────────┤
│ BTCUSD · $43,250.00 +2.35%                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    GRÁFICO DE VELAS                         │
│         (TradingView Chart con datos de 1h)                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  📊 ANÁLISIS DE VELAS                                       │
│                                                              │
│  Haz clic en el botón para analizar automáticamente las    │
│  velas y obtener recomendaciones                           │
│                                                              │
│                                                              │
│                  [⚡ Ejecutar Análisis]                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Estado 2: Analizando (Cargando)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    GRÁFICO DE VELAS                         │
│         (TradingView Chart con datos de 1h)                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  📊 ANÁLISIS DE VELAS                                       │
│                                                              │
│  ⟳ Analizando velas para BTCUSD (1h)...                    │
│  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁ (animación de carga)                      │
│                                                              │
│  [⚡ Analizando...] (botón deshabilitado)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Estado 3: Análisis Completado (Resultado)

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 ANÁLISIS DE VELAS                                            │
│                                                  [⚡ Ejecutar...] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  RESUMEN RÁPIDO                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐        │
│  │ Tendencia│Sentimiento│ Predicción│ Confianza│ Patrones │      │
│  │   📈    │  Bullish │  Bullish  │  75%   │    3     │      │
│  │ ALCISTA │          │           │        │  Pattern │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘        │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│  ANÁLISIS DETALLADO                                              │
│                                                                   │
│  ▼ 📊 TENDENCIA (Expandido)                                     │
│  ├─ Estructura: Mercado en Uptrend claro                       │
│  ├─ Fuerza: 78/100 (Muy Sólida)                                │
│  ├─ ADX: 28.5 (Tendencia Fuerte Confirmada)                    │
│  └─ Medias Móviles:                                            │
│     • SMA(20): Precio 📈 por encima (43,200)                   │
│     • EMA(20): Precio 📈 por encima (43,150)                   │
│                                                                   │
│  ▼ 📍 PATRONES (Expandido)                                      │
│  ├─ 1. MORNING STAR (Bullish Reversal)                         │
│  │   └─ Confiabilidad: 82% ⭐                                   │
│  ├─ 2. ENGULFING (Bullish)                                     │
│  │   └─ Confiabilidad: 75% ⭐                                   │
│  └─ 3. HIGHER HIGHS (Continuation)                             │
│      └─ Confiabilidad: 88% ⭐                                   │
│                                                                   │
│  ▼ 📊 INDICADORES (Expandido)                                   │
│  ├─ RSI(14): 58.3 (Neutral)                                    │
│  ├─ MACD: +0.0045 (Bullish) 🟢                                │
│  ├─ Bollinger: Dentro de bandas (Normal)                       │
│  ├─ Stochastic: %K=65, %D=62 (Neutral)                        │
│  └─ ATR: 245.50 (Volatilidad Moderada)                        │
│                                                                   │
│  ▼ 🎯 PREDICCIÓN (Expandido)                                    │
│  ├─ Dirección: BULLISH 🟢                                       │
│  ├─ Probabilidad: 75%                                          │
│  ├─ Confianza: HIGH                                            │
│  ├─ Objetivos:                                                 │
│  │  1. TP1: 44,100 (+2.0%)                                     │
│  │  2. TP2: 44,800 (+3.6%)                                     │
│  │  3. TP3: 45,500 (+5.2%)                                     │
│  ├─ Stop Loss: 42,800 (-1.0%)                                  │
│  └─ Risk/Reward: 2.8:1 (Excelente) 🚀                         │
│                                                                   │
│  ▼ ⚠️ RIESGO (Colapsado)                                        │
│                                                                   │
│  ▼ 📋 RESUMEN (Expandido)                                       │
│  └─ El mercado muestra una tendencia ALCISTA sólida con       │
│     múltiples patrones alcistas confirmadores e indicadores   │
│     que sugieren un movimiento alcista. La predicción tiene   │
│     una confianza de HIGH basada en el análisis técnico       │
│     completo. Relación riesgo/beneficio excelente para       │
│     operaciones alcistas.                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Estado 4: Error (Validación)

```
┌──────────────────────────────────────────────────────────────┐
│  📊 ANÁLISIS DE VELAS                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ⚠️ ADVERTENCIA                                              │
│  Se requieren al menos 20 velas para análisis                │
│                                                               │
│  💡 Consejo: Cambia a un timeframe mayor o espera a que      │
│     carguen más datos.                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Flujo Completo de Uso

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Usuario Abre Aplicación                                        │
│           ↓                                                      │
│  Selecciona Asset (BTCUSD)                                      │
│           ↓                                                      │
│  Selecciona Timeframe (1h)                                      │
│           ↓                                                      │
│  Se carga el gráfico                                            │
│           ↓                                                      │
│  Aparece panel con botón "Ejecutar Análisis" ← [AQUÍ ESTÁ]    │
│           ↓                                                      │
│  Usuario hace clic el botón ← [ACCIÓN DEL USUARIO]            │
│           ↓                                                      │
│  Sistema ejecuta analyzeCandles() con:                          │
│  - symbol (BTCUSD)                                              │
│  - timeframe (1h)                                               │
│  - candleData (últimos datos del gráfico)                      │
│  - analysisDepth ('comprehensive')                              │
│           ↓                                                      │
│  Muestra "Analizando..." durante 1-2 segundos                  │
│           ↓                                                      │
│  Aparecen resultados con:                                       │
│  - Resumen rápido                                               │
│  - 6 secciones expandibles                                      │
│  - Explicaciones detalladas                                     │
│           ↓                                                      │
│  Usuario puede hacer clic nuevamente para actualizar ← [LOOP]  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Elementos de Interfaz

### Botón "Ejecutar Análisis"
```
┌─────────────────────────────────┐
│  ⚡ Ejecutar Análisis           │  ← Estados:
└─────────────────────────────────┘
   - Normal (clickeable)
   - Hover (bg oscuro)
   - Disabled (opacidad 50%)
   - Loading (texto "Analizando...")
```

### Tarjeta de Resumen
```
┌────────────────┬────────────────┬────────────────┐
│ 📈 Tendencia   │ 💭 Sentimiento │ 🎯 Predicción  │
│  ALCISTA       │   BULLISH      │   BULLISH      │
├────────────────┼────────────────┼────────────────┤
│ 📊 Confianza   │ 🔢 Patrones    │                │
│   75%          │   3 Detectados │                │
└────────────────┴────────────────┴────────────────┘
```

### Secciones Expandibles
```
▼ Sección Expandida          ← Click para colapsar
├─ Contenido visible
├─ Más información
└─ Detalles

▶ Sección Colapsada          ← Click para expandir
```

---

## Responsividad

### Desktop (Largo)
```
┌────────────────────────────────┬──────────────┐
│                                │              │
│        GRÁFICO GRANDE          │  INDICADORES │
│                                │              │
├────────────────────────────────┴──────────────┤
│      ANÁLISIS COMPLETO                        │
└────────────────────────────────────────────────┘
```

### Tablet (Medio)
```
┌────────────────────────────────┐
│        GRÁFICO                 │
├────────────────────────────────┤
│      INDICADORES               │
├────────────────────────────────┤
│      ANÁLISIS                  │
└────────────────────────────────┘
```

### Mobile (Pequeño)
```
┌──────────────┐
│    GRÁFICO   │
├──────────────┤
│  INDICADORES │
├──────────────┤
│   ANÁLISIS   │
└──────────────┘
```

---

## Paleta de Colores

- 🟢 **Verde**: Alcista, Positivo, Compra
- 🔴 **Rojo**: Bajista, Negativo, Venta  
- 🟡 **Amarillo**: Neutral, Advertencia
- ⚪ **Gris**: Inactivo, Deshabilitado
- 🔵 **Azul**: Información, Links

---

## Animaciones

- ⟳ **Spinner**: Rotación durante análisis
- 📊 **Pulse**: Flash sutil en resultados
- ✨ **Fade-in**: Aparición suave de elementos
- 🎯 **Hover**: Cambio de fondo en botones

---

**Diseño**: Moderno, limpio, profesional
**Accesibilidad**: Alto contraste, texto legible
**Performance**: Rápido, sin lag


