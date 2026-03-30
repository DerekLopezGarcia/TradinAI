@echo off
REM Script para instalar Node.js y ejecutar Trading IA

echo.
echo ===============================================
echo   INSTALADOR DE TRADING IA
echo ===============================================
echo.

REM Verificar si Node.js ya está instalado
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js ya está instalado
    call node --version
    goto install_deps
) else (
    echo [ERROR] Node.js no encontrado
    echo.
    echo Por favor, descarga e instala Node.js desde:
    echo https://nodejs.org/
    echo.
    echo Descarga la versión LTS (Long Term Support)
    echo Asegúrate de agregar Node.js al PATH durante la instalación
    echo.
    pause
    exit /b 1
)

:install_deps
echo.
echo [1/3] Instalando dependencias del proyecto...
call "C:\Program Files\nodejs\npm.cmd" install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Falló la instalación de dependencias
    pause
    exit /b 1
)

echo.
echo [2/3] Compilando el proyecto...
call "C:\Program Files\nodejs\npm.cmd" run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ADVERTENCIA] La compilación tuvo problemas (puede ser normal en desarrollo)
)

echo.
echo [3/3] Iniciando servidor de desarrollo...
echo.
echo ===============================================
echo   Trading IA está iniciándose...
echo ===============================================
echo.
echo Abre tu navegador en: http://localhost:3000
echo Presiona Ctrl+C para detener el servidor
echo.

call "C:\Program Files\nodejs\npm.cmd" run dev

pause

