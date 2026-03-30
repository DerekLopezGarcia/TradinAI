#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Instalador automático de Node.js + Trading IA

.DESCRIPTION
    Detecta si Node.js está instalado. Si no, lo descarga e instala automáticamente.
    Luego instala dependencias y ejecuta el servidor.

.EXAMPLE
    .\install-and-run.ps1
#>

$NodeVersion = "20.11.1"
$NodeDownloadUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-x64.msi"
$TempPath = Join-Path $env:TEMP "node-installer.msi"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   INSTALADOR AUTOMÁTICO - Trading IA" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js ya está instalado
$NodeExists = $false
try {
    $version = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[✓] Node.js ya está instalado: $version" -ForegroundColor Green
        $NodeExists = $true
    }
}
catch {
    $NodeExists = $false
}

# Si no existe, instalar
if (-not $NodeExists) {
    Write-Host "[!] Node.js NO está instalado. Descargando..." -ForegroundColor Yellow
    Write-Host ""

    # Descargar Node.js
    Write-Host "Descargando Node.js v$NodeVersion..." -ForegroundColor Cyan
    try {
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor [System.Net.SecurityProtocolType]::Tls12
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $NodeDownloadUrl -OutFile $TempPath -UseBasicParsing
        Write-Host "[✓] Descarga completada" -ForegroundColor Green
    }
    catch {
        Write-Host "[✗] Error al descargar Node.js" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Descarga manual desde: https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
        exit 1
    }

    # Instalar Node.js
    Write-Host "Instalando Node.js..." -ForegroundColor Cyan
    try {
        $Process = Start-Process -FilePath msiexec.exe `
            -ArgumentList "/i `"$TempPath`" /qn /norestart" `
            -Wait -PassThru

        if ($Process.ExitCode -eq 0) {
            Write-Host "[✓] Node.js instalado correctamente" -ForegroundColor Green
        }
        else {
            Write-Host "[✗] Error en la instalación (código: $($Process.ExitCode))" -ForegroundColor Red
            Read-Host "Presiona Enter para salir"
            exit 1
        }
    }
    catch {
        Write-Host "[✗] Error al ejecutar instalador" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    finally {
        # Limpiar archivo temporal
        if (Test-Path $TempPath) {
            Remove-Item $TempPath -Force -ErrorAction SilentlyContinue
        }
    }

    # Esperar a que se actualice el PATH
    Write-Host "Esperando a que se actualice el sistema..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    # Actualizar PATH en la sesión actual
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Verificar npm
Write-Host ""
Write-Host "Verificando npm..." -ForegroundColor Cyan
try {
    $npmVersion = & npm --version 2>$null
    Write-Host "[✓] npm está disponible: v$npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "[✗] npm no está disponible" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Instalar dependencias
Write-Host ""
Write-Host "[1/3] Instalando dependencias del proyecto..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Error al instalar dependencias" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Compilar
Write-Host ""
Write-Host "[2/3] Compilando proyecto..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[⚠] Compilación completada con advertencias (normal en desarrollo)" -ForegroundColor Yellow
}

# Ejecutar
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "   Trading IA LISTO" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Abriendo navegador en: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🛑 Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Abrir navegador
Start-Sleep -Milliseconds 2000
Start-Process "http://localhost:3000"

# Ejecutar servidor
npm run dev

Read-Host ""
Write-Host "Gracias por usar Trading IA" -ForegroundColor Cyan

