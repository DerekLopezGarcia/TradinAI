#!/usr/bin/env pwsh
# Script para iniciar la aplicación Trading IA

Write-Host "🚀 Iniciando Trading IA..." -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor Red
    Write-Host "Por favor, ejecuta este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Limpiar cache de Next.js y node_modules
Write-Host "🧹 Limpiando caché..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".turbo" -Recurse -Force -ErrorAction SilentlyContinue

# Instalar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
npm install

# Compilar
Write-Host "🔨 Compilando..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ La compilación falló" -ForegroundColor Red
    exit 1
}

# Iniciar servidor dev
Write-Host "✅ Compilación exitosa" -ForegroundColor Green
Write-Host "🌐 Iniciando servidor de desarrollo..." -ForegroundColor Cyan
Write-Host "Abre http://localhost:3000 en tu navegador" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow

npm run dev


