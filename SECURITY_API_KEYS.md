# 🔐 Guía de Configuración Segura de API Keys

## ⚠️ IMPORTANTE: Nunca subas API keys a GitHub

Este documento explica cómo configurar las API keys de forma segura sin riesgo de exponerlas públicamente.

---

## 📋 Paso 1: Estructura de Archivos

### Archivos que **SÍ** suben a GitHub:
```
✅ .env.example          # Template vacío (valores de ejemplo)
✅ .env.local.example    # Template para .env.local
✅ .gitignore            # Protege archivos sensibles
✅ .husky/pre-commit     # Validación de seguridad
```

### Archivos que **NUNCA** suben a GitHub:
```
❌ .env.local            # Tu configuración privada
❌ .env.production       # Producción privada
❌ Cualquier .env con claves reales
```

---

## 🚀 Paso 2: Configuración Local (Primera vez)

### En Windows (PowerShell):
```powershell
# Copia el template
Copy-Item .env.example .env.local

# Edita el archivo con tus claves
notepad .env.local

# Reinicia el servidor
npm run dev
```

### En Mac/Linux:
```bash
# Copia el template
cp .env.example .env.local

# Edita el archivo
nano .env.local

# Reinicia
npm run dev
```

---

## ✅ Paso 3: Verificar que está protegido

### Ver que .env.local está en .gitignore:
```bash
cat .gitignore | grep "\.env\.local"
# Debe mostrar: .env.local
```

### Ver que no está staged para commit:
```bash
git status
# .env.local NO debe aparecer en la lista
```

---

## 🛡️ Paso 4: Protección Automática

Este proyecto tiene un **pre-commit hook** que previene commits accidentales de claves:

```bash
# Se ejecuta automáticamente ANTES de cada commit
.husky/pre-commit

# Si intentas commitear una .env.local:
# ❌ El commit fallará
# ✅ Recibirás una advertencia de seguridad
```

Para activar los hooks (una sola vez):
```bash
npm install husky --save-dev
npx husky install
```

---

## 📝 Contenido de .env.local (Ejemplo)

Tus claves **NUNCA** deben verse así en GitHub:

```dotenv
# ❌ MALO - Esto debe estar SOLO en tu .env.local local
TWELVE_DATA_API_KEY=480ca08024ad42489747c8c571f9d2ac
QUANDL_API_KEY=C4mdyPGWhzCRZDsZGUUU
NEXT_PUBLIC_FINNHUB_KEY=d6gsv29r01qg85gvv0b
```

En GitHub **siempre** debe estar vacío:

```dotenv
# ✅ BUENO - Esto está en .env.example en GitHub
TWELVE_DATA_API_KEY=tu_api_key_aqui
QUANDL_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FINNHUB_KEY=tu_api_key_aqui
```

---

## 🔍 Verificación de Seguridad

### Antes de hacer push a GitHub:

```bash
# 1. Verificar que .env.local NO está staged
git status | grep ".env"
# ✅ Debe estar VACÍO

# 2. Verificar que .gitignore protege los archivos
cat .gitignore | grep -E "\.env|\.local"
# ✅ Debe mostrar:
#    .env
#    .env.local
#    .env.*.local

# 3. Verificar que no hay claves en commits recientes
git log -p -S "480ca08024ad42489747c8c571f9d2ac"
# ✅ Debe estar VACÍO (sin resultados)
```

---

## 🚨 Si Accidentalmente Expusiste una Clave:

### ⚡ ACCIÓN INMEDIATA:

```bash
# 1. REVOCA la clave en la plataforma (Twelve Data, Quandl, etc.)
# 2. Genera una clave NUEVA
# 3. Copia a .env.local (local)
# 4. NO la subas a GitHub

# 5. (Opcional) Elimina de histórico de Git:
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local' \
  --prune-empty --tag-name-filter cat -- --all

# 6. Force push (¡PELIGROSO! Solo si es necesario)
git push origin --force --all
```

---

## 📚 Variables de Entorno: Public vs Private

### Variables `NEXT_PUBLIC_*` (Se ven en navegador):
```
✅ NEXT_PUBLIC_FINNHUB_KEY=xxx    # OK, es seguro exponerla
✅ NEXT_PUBLIC_NEWS_API_KEY=xxx   # OK, es seguro
❌ NEXT_PUBLIC_STRIPE_SECRET=xxx  # MALO, nunca hagas esto
```

### Variables SIN `NEXT_PUBLIC_` (Solo servidor):
```
✅ TWELVE_DATA_API_KEY=xxx    # Privada (no visible en navegador)
✅ QUANDL_API_KEY=xxx         # Privada (solo servidor)
✅ OANDA_API_KEY=xxx          # Privada (solo servidor)
```

**Regla**: Si la clave es sensible (stripe, API privada), usa variable SIN `NEXT_PUBLIC_`.

---

## 🎯 Checklist Final

Antes de hacer `git push`:

- [ ] `.env.local` existe localmente
- [ ] `.env.local` NO aparece en `git status`
- [ ] `.gitignore` contiene `.env.local`
- [ ] `.env.example` tiene valores de ejemplo (sin claves reales)
- [ ] Ningún commit tiene claves reales: `git log -p | grep TWELVE_DATA`
- [ ] `.husky/pre-commit` está configurado

---

## 💡 Mejores Prácticas

1. **NUNCA** hardcodees claves en el código
2. **SIEMPRE** usa variables de entorno
3. **SIEMPRE** copia `.env.example` a `.env.local`
4. **SIEMPRE** agrega nuevas claves solo a `.env.local`
5. **SIEMPRE** verifica antes de hacer push: `git status | grep .env`

---

## 📞 Si Necesitas Ayuda

Si tuviste un problema:

1. Ejecuta: `npm install husky --save-dev && npx husky install`
2. Reinicia el servidor: `npm run dev`
3. Verifica: `git status`

---

**Last updated**: 2026-03-30  
**Status**: ✅ Secure & Configured

