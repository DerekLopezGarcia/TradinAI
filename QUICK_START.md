# 🚀 QUICK START - Cómo Trabajar con TradingIA v2.0

## En 5 Minutos: Entiende la Arquitectura

### Estructura en Capas (Bottom-Up)

```
LAYER 1: Core Abstraction (lib/core/)
├── architecture.ts  → Interfaces base
├── config.ts        → Configuración centralizada
└── services.ts      → Clases base (BaseService, Logger, Cache)

LAYER 2: Services (lib/services/)
├── dataProviders.ts      → 5 proveedores específicos
├── candleAnalysisService → Análisis técnico
└── ...otros servicios

LAYER 3: React Hooks (app/hooks/)
├── useAsync.ts     → Hook base para async
└── useMarketData   → (usa useAsync internamente)

LAYER 4: Components (components/)
└── Solo presentación, sin lógica

LAYER 5: API Routes (app/api/)
└── Sin lógica, delega a servicios
```

---

## 🏃 Guía Rápida: Agregar Features

### 1. Crear Nuevo Servicio (5 min)

```typescript
// lib/services/myService.ts
import { BaseService } from '@/lib/core/services';

export class MyService extends BaseService {
  constructor() {
    super('myModule');  // ✅ Logger + cache automáticos
  }

  async getData() {
    return this.getCachedOrExecute(
      'data-key',
      () => this.executeWithRetry(() => fetch(...), 'getData')
    );
  }
}
```

**Automático:**
- ✅ Logger
- ✅ Retry (3 intentos)
- ✅ Cache (TTL configurable)

### 2. Crear Nuevo Hook (3 min)

```typescript
// app/hooks/useMyFeature.ts
import { useAsync } from './useAsync';

export function useMyFeature() {
  return useAsync(() => myService.getData(), {
    retry: 3,
    onSuccess: (data) => console.log('Success')
  });
}
```

**Automático:**
- ✅ data, loading, error, isSuccess
- ✅ Retry
- ✅ Manejo de errores

### 3. Agregar Configuración (1 min)

```typescript
// lib/core/config.ts
MODULE_CONFIGS['myModule'] = {
  enabled: true,
  timeout: 10000,
  retries: 3,
  cache: { ttl: 60000, key: 'mymodule' }
};
```

**Automático:**
- ✅ Disponible en toda la app
- ✅ Sin hardcoding

### 4. Agregar Proveedor de Datos (15 min)

```typescript
// lib/services/dataProviders.ts
export class MyProvider implements IDataProvider {
  name = 'MyProvider';
  priority = 85;
  supportsTypes = ['stock'];

  async fetch(symbol: string, interval: string) {
    // Tu lógica aquí
  }
}

// Registrar automáticamente
providerManager.register(new MyProvider());
```

**Automático:**
- ✅ Se intenta si otros proveedores fallan
- ✅ Timeout automático
- ✅ Retry automático

---

## 🎯 Patrones Principales

| Patrón | Dónde | Para Qué |
|--------|-------|----------|
| **Factory** | dataProviderFactory.ts | Agregar proveedores sin refactorizar |
| **Strategy** | BaseService | Cada servicio su propia estrategia |
| **Repository** | InMemoryRepository | Acceso a datos genérico |
| **Observer** | SimpleEventBus | Comunicación entre módulos |
| **Hooks** | app/hooks/ | Lógica React reutilizable |

---

## 📚 Archivos Clave

### Para Entender (Leer en este orden)
1. `AGENTS.md` - Visión general
2. `ARQUITECTURA_COMPLETA.md` - Técnica completa
3. `lib/core/architecture.ts` - Interfaces base
4. `lib/core/services.ts` - Implementaciones base

### Para Extender
- `lib/services/` - Agregar servicios
- `app/hooks/useAsync.ts` - Crear hooks basados en esto
- `lib/core/config.ts` - Centralizar configuración

---

## ✅ Checklist Antes de Crear Algo

- [ ] ¿Es un servicio? → Extiende BaseService
- [ ] ¿Es lógica async? → Usa useAsync como base
- [ ] ¿Es configuración? → Agreg a lib/core/config.ts
- [ ] ¿Es validación? → Usa validationService
- [ ] ¿Necesita caché? → Automático en BaseService
- [ ] ¿Necesita retry? → Automático en executeWithRetry()
- [ ] ¿Necesita logging? → Automático en BaseService

---

## 🚀 Escalabilidad: Crecer sin Refactorizar

```
Agregar 10 proveedores de datos → 150 minutos
Agregar 20 servicios → 100 minutos
Agregar 50 hooks → 150 minutos
Refactorización → 0 minutos ✅

Total: 400 minutos de desarrollo
Sin refactorización
```

---

## 🔍 Debugging

### "Mi servicio no tiene logger"
→ Extiende BaseService

### "Mi hook no tiene manejo de error"
→ Usa useAsync como base

### "Mi configuración no se aplica"
→ Agrégala a MODULE_CONFIGS en config.ts

### "Mi proveedor no se intenta"
→ Registralo en registerDefaultProviders()

---

## 📞 Referencias Rápidas

```typescript
// Importar
import { BaseService } from '@/lib/core/services';
import { useAsync } from '@/app/hooks/useAsync';
import { getModuleConfig } from '@/lib/core/config';

// Usar BaseService
class MyService extends BaseService {
  constructor() { super('myModule'); }
  async fetch() {
    return this.getCachedOrExecute('key', 
      () => this.executeWithRetry(() => api.call(), 'fetch')
    );
  }
}

// Usar useAsync
const { data, loading, error, execute } = useAsync(
  () => myService.fetch(),
  { retry: 3, onSuccess: (data) => {} }
);

// Obtener configuración
const config = getModuleConfig('myModule');
```

---

## 🎓 Conclusión

Con esta arquitectura:
- ✅ Agregar features es rápido (5-15 min)
- ✅ El código es limpio (sin duplicación)
- ✅ Todo es reutilizable (BaseService, hooks base)
- ✅ Todo se testea (independientemente)
- ✅ Todo escala (sin refactorizar)

**¡Listo para crear!** 🚀

