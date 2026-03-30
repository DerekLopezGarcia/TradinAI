# ✅ CHECKLIST PRE-PUSH - VERIFICA ESTO ANTES DE SUBIR A GITHUB

## 🚀 ANTES DE HACER `git push`

Ejecuta esta checklist en orden:

### 1️⃣ Validación de Seguridad (CRÍTICO)

```bash
npm run security-check
```

✅ **Debe mostrar:**
```
✅ ¡TODAS LAS VALIDACIONES PASARON! Tu proyecto es seguro.
```

❌ **Si falla:** No hagas push. Lee `SECURITY_API_KEYS.md`

---

### 2️⃣ Verifica Git Status

```bash
git status
```

✅ **Checklist:**
- [ ] `.env.local` **NO aparece** en la lista
- [ ] `.env.local.example` aparece como `new file` (OK)
- [ ] `.env.example` aparece como `modified` (OK)
- [ ] No hay archivos con "claves" o "keys" en el nombre

---

### 3️⃣ Verifica Que No Hay Claves en el Código

```bash
git diff --cached
```

✅ **Checklist:**
- [ ] No ves strings que parecen API keys (ej: `sk_live_`, `pk_live_`)
- [ ] No ves `apiKey=` con valores reales
- [ ] Solo ves `apiKey=tu_api_key_aqui` (placeholders)

---

### 4️⃣ Lint/Format (Buenas Prácticas)

```bash
npm run lint
```

✅ **Debe mostrar:**
```
✓ No ESLint warnings or errors
```

---

### 5️⃣ Verificación Final

```bash
npm run pre-push
```

✅ **Debe ejecutar y pasar:**
- `npm run security-check` ✅
- `npm run lint` ✅

---

## 🎯 Si TODO Pasó ✅

```bash
git push origin main
```

---

## 🚨 Si Algo Falló ❌

**Paso 1:** Lee el error

**Paso 2:** Ejecuta el comando relevante:
- Seguridad: `npm run security-check` → Lee `SECURITY_API_KEYS.md`
- Lint: `npm run lint` → Arregla los errores de código

**Paso 3:** Intenta de nuevo

---

## 🔒 Casos Comunes

### ❌ Problema: `.env.local` aparece en git status

```bash
git status | findstr ".env"
```

**Solución:**
```bash
# Verifica que .gitignore contiene .env.local
cat .gitignore | findstr ".env"

# Si no está, agrégalo:
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# Actualiza Git
git rm --cached .env.local 2>nul
git add .gitignore
git commit -m "chore: protect .env.local"
```

---

### ❌ Problema: `npm run security-check` falla

**Lectura obligatoria:** `SECURITY_API_KEYS.md`

**Comprobaciones rápidas:**
```bash
# ¿Tiene .gitignore?
test -f .gitignore && echo "✅ Existe" || echo "❌ Falta"

# ¿Protege .env.local?
grep ".env.local" .gitignore && echo "✅ Protegido" || echo "❌ No está"

# ¿Hay claves en el código?
grep -r "TWELVE_DATA_API_KEY\s*=" app lib 2>/dev/null || echo "✅ No encontradas"
```

---

### ❌ Problema: Lint falla

```bash
npm run lint -- --fix
```

Arreglará automáticamente problemas de formato.

---

## 📋 Antes y Después

### ❌ ANTES (Inseguro)
```
.env.local              ← ¡NUNCA!
  TWELVE_DATA_API_KEY=480ca08024ad42...
  QUANDL_API_KEY=C4mdyPGWhzCRZDsZGU...

app/api/route.ts        ← Nunca hardcodees
  const key = "480ca08024ad42...";
```

### ✅ DESPUÉS (Seguro)
```
.env.local              ← Existe localmente, no en Git
  TWELVE_DATA_API_KEY=tu_clave_aqui
  QUANDL_API_KEY=tu_clave_aqui

.env.example            ← En GitHub como reference
  TWELVE_DATA_API_KEY=tu_api_key_aqui
  QUANDL_API_KEY=tu_api_key_aqui

app/api/route.ts        ← Usa variables de entorno
  const key = process.env.TWELVE_DATA_API_KEY;
```

---

## ✅ Checklist Final

Antes de hacer push:

- [ ] Ejecuté `npm run security-check` → ✅ Pasó
- [ ] `.env.local` NO aparece en `git status`
- [ ] `.env.example` tiene solo placeholders (`tu_api_key_aqui`)
- [ ] Ejecuté `npm run lint` → ✅ Sin errores
- [ ] Ejecuté `npm run pre-push` → ✅ Todo pasó
- [ ] Revisé `git diff --cached` → ✅ Sin claves visibles

---

## 🎉 ¡SEGURO PARA PUSH!

Si todos los checks pasaron:

```bash
git push origin main
```

---

**Documento actualizado**: 2026-03-30  
**Estado**: ✅ Listo para Producción

