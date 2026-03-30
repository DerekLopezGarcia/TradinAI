# 🔐 SETUP DE SEGURIDAD - ANTES DE EMPEZAR

> ⚠️ **ANTES DE HACER CUALQUIER COSA**, sigue estos pasos para configurar las API keys de forma segura.

## ⚡ Quick Start (5 minutos)

```bash
# 1. Copia el archivo de ejemplo
cp .env.example .env.local

# 2. Edita .env.local con tus API keys
# En Windows: notepad .env.local
# En Mac/Linux: nano .env.local

# 3. Guarda el archivo (Ctrl+S)

# 4. Reinicia el servidor
npm run dev
```

---

## ✅ Verificación de Seguridad

Ejecuta este comando para verificar que todo está seguro:

```bash
npm run security-check
```

**Debe mostrar:**
```
✅ ¡TODAS LAS VALIDACIONES PASARON! Tu proyecto es seguro.
```

---

## 📋 Archivos Importantes de Seguridad

| Archivo | Propósito | Subir a GitHub |
|---------|-----------|---|
| `.env.example` | Template de ejemplo (sin claves) | ✅ SÍ |
| `.env.local` | Tu configuración privada | ❌ NO |
| `.gitignore` | Protege .env.local | ✅ SÍ |
| `SECURITY_API_KEYS.md` | Guía completa de seguridad | ✅ SÍ |

---

## 🚨 NUNCA HAGAS ESTO:

```bash
# ❌ NO: Hardcodear claves en el código
const apiKey = "480ca08024ad42489747c8c571f9d2ac";

# ❌ NO: Commitear .env.local
git add .env.local
git commit -m "Add my API keys"

# ❌ NO: Usar claves de ejemplo en producción
TWELVE_DATA_API_KEY=tu_api_key_aqui  # Esto es un placeholder
```

---

## ✅ SIEMPRE HACES ESTO:

```bash
# ✅ SÍ: Usa variables de entorno
const apiKey = process.env.TWELVE_DATA_API_KEY;

# ✅ SÍ: .env.local solo local (nunca a Git)
cp .env.example .env.local
# ... edita con tus claves ...
# .env.local está en .gitignore ✅

# ✅ SÍ: Verifica antes de hacer push
npm run security-check
git push
```

---

## 📚 Documentación Completa

Ver **`SECURITY_API_KEYS.md`** para:
- ✅ Configuración detallada
- ✅ Mejores prácticas
- ✅ Qué hacer si expusiste una clave
- ✅ Validación de seguridad

---

## 🆘 Si Tuviste un Problema

1. **Lee**: `SECURITY_API_KEYS.md`
2. **Ejecuta**: `npm run security-check`
3. **Verifica**: `git status | grep .env`

---

**Estado**: ✅ Protegido y Configurado  
**Última actualización**: 2026-03-30

