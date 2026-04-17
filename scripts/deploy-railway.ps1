# Script de deployment a Railway para Windows
# Usa Railway CLI para hacer deploy automático
#
# Proyecto: gleaming-serenity
# Uso: .\scripts\deploy-railway.ps1

Write-Host "🚀 Iniciando deployment a Railway (gleaming-serenity)..." -ForegroundColor Green
Write-Host ""

# Verificar que Railway CLI está instalado
$railwayCheck = railway --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala con: npm install -g @railway/cli"
    exit 1
}

Write-Host "✅ Railway CLI encontrado: $railwayCheck" -ForegroundColor Green
Write-Host ""

# Verificar que el proyecto está linkeado
if (-not (Test-Path ".railway/config.json")) {
    Write-Host "⚠️  Proyecto no linkeado a Railway" -ForegroundColor Yellow
    Write-Host "Ejecuta: railway link"
    Write-Host "Luego selecciona tu proyecto TradingIA"
    exit 1
}

Write-Host "✅ Proyecto linkeado a Railway" -ForegroundColor Green
Write-Host ""

# Build check
Write-Host "📋 Ejecutando build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build exitoso" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "📤 Enviando a Railway..." -ForegroundColor Cyan
railway up --detach

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment iniciado" -ForegroundColor Green
    Write-Host "Monitor en: railway status" -ForegroundColor Yellow
    Write-Host "Logs: railway logs --follow" -ForegroundColor Yellow
} else {
    Write-Host "❌ Error en deployment" -ForegroundColor Red
    exit 1
}

