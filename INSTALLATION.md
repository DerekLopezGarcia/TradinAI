# 📦 GUÍA DE INSTALACIÓN - Trading IA

## Solución Rápida para: "npm no se reconoce"

Si recibiste el error:
```
npm : El término 'npm' no se reconoce como nombre de un cmdlet, función, archivo de script o programa ejecutable
```

Significa que **Node.js/npm NO está instalado**. Sigue estos pasos:

---

## 🚀 Instalación Rápida (3 minutos)

### OPCIÓN A: Script Automático (RECOMENDADO)

#### Para PowerShell:
1. **Abre PowerShell** (Click derecho en la carpeta TradingIA → "Abrir PowerShell aquí")
2. **Ejecuta estos comandos**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
.\run.ps1
```

#### Para Command Prompt:
1. **Abre Command Prompt** (Click derecho en la carpeta TradingIA → "Abrir en Command Prompt")
2. **Ejecuta**:
```cmd
run.bat
```

**Esto hará todo automáticamente:**
- ✅ Instala Node.js si no lo tienes
- ✅ Instala las dependencias
- ✅ Abre tu navegador en http://localhost:3000

---

## 🔧 Instalación Manual Paso a Paso

### Paso 1: Descargar Node.js

1. **Ve a**: https://nodejs.org/
2. **Descarga**: La versión **LTS** (Large Term Support)
   - Recomendado: v20.11.1 o superior
3. **Guarda** el archivo descargado

### Paso 2: Instalar Node.js

1. **Abre** el instalador descargado (`node-v20.11.1-x64.msi`)
2. **Sigue el asistente**:
   - Click "Next" en cada pantalla
   - **IMPORTANTE**: En la pantalla de características, marca **"Add to PATH"**
   - Click "Install"
3. **Espera** a que termine (2-3 minutos)
4. **Reinicia** tu computadora (IMPORTANTE)

### Paso 3: Verificar Instalación

1. **Abre PowerShell** o **Command Prompt**
2. **Ejecuta estos comandos**:

```powershell
node --version
npm --version
```

Deberías ver:
```
v20.11.1 (o superior)
10.5.0 (o superior)
```

Si ves números, ¡todo está bien! ✅

### Paso 4: Instalar Dependencias del Proyecto

1. **Abre PowerShell o Command Prompt**
2. **Navega a la carpeta del proyecto**:
```powershell
cd "C:\Users\Derek López\WebstormProjects\TradingIA"
```

3. **Instala las dependencias**:
```powershell
npm install
```

Esto descargará ~200MB de dependencias (tarda 2-5 minutos)

### Paso 5: Ejecutar el Proyecto

**Opción A - Ejecución de desarrollo**:
```powershell
npm run dev
```

Luego abre tu navegador en: **http://localhost:3000**

**Opción B - Compilar primero**:
```powershell
npm run build
npm run start
```

---

## 🐛 Troubleshooting

### ❌ Problema: "npm no se reconoce" después de reinstalar Node.js

**Solución:**
1. **Reinicia PowerShell completamente** (cierra y abre una nueva ventana)
2. Si sigue sin funcionar, **reinicia tu computadora**
3. Las variables de entorno se actualizan al reiniciar

### ❌ Problema: "Port 3000 already in use"

El puerto 3000 está siendo usado por otro programa.

**Solución:**
```powershell
# Matar el proceso que usa el puerto 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

O ejecuta en otro puerto:
```powershell
$env:PORT=3001
npm run dev
```

### ❌ Problema: "Cannot find module 'react'"

**Solución:**
```powershell
npm install
npm cache clean --force
npm ci  # Clean install
```

### ❌ Problema: "node_modules corrupted"

**Solución:**
```powershell
# Eliminar node_modules
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json

# Reinstalar
npm install
```

---

## 📋 Checklist de Instalación

- [ ] Node.js v20+ instalado
- [ ] npm 10+ instalado
- [ ] Node está en el PATH (`node --version` funciona)
- [ ] Dependencias instaladas (`npm install` completado)
- [ ] Servidor inicia correctamente (`npm run dev`)
- [ ] Navegador abre en http://localhost:3000

---

## 💡 Tips Útiles

### Verificar todas las versiones
```powershell
node --version
npm --version
npm list
```

### Limpiar cache
```powershell
npm cache clean --force
```

### Reinstalar todo desde cero
```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### Ver qué portos están en uso
```powershell
netstat -ano | findstr LISTENING
```

### Matar proceso por nombre
```powershell
taskkill /IM node.exe /F  # Mata todos los procesos de Node
```

---

## 🆘 ¿Sigue sin funcionar?

Si después de todo esto sigue sin funcionar:

1. **Verifica que Node.js esté en PATH**:
```powershell
$env:PATH -split ';' | Where-Object {$_ -like '*nodejs*'}
```

Deberías ver una ruta como: `C:\Program Files\nodejs`

2. **Prueba usar la ruta completa**:
```powershell
"C:\Program Files\nodejs\npm.cmd" --version
```

3. **Reinstala Node.js completamente**:
   - Desinstala desde: Panel de Control → Programas → Desinstalar
   - Descarga e instala la última versión LTS desde nodejs.org
   - **Asegúrate de marcar "Add to PATH"**
   - Reinicia tu computadora

---

## 📞 Soporte

Si tienes problemas:

1. **Lee los logs de error completo**
2. **Verifica tu versión de Node.js**: `node --version`
3. **Intenta reinstalar**: `npm install` nuevamente
4. **Busca el error en Google**

---

**¡Listo! Tu Trading IA está funcionando** 🚀

Para más información, consulta: `README.md`

