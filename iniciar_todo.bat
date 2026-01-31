@echo off
title GHL Assistant Launcher
color 0A

echo ========================================================
echo      INICIANDO ASISTENTE GHL (SETUP AUTOMATICO)
echo ========================================================
echo.

:: 1. Backend Setup
echo [1/5] Verificando Backend...
cd backend
if not exist "node_modules" (
    echo    - Instalando librerias del Backend (primera vez)...
    call npm install
) else (
    echo    - Backend listo.
)
echo    - Iniciando servidor Backend en puerto 3001...
start "GHL Backend API" cmd /k "npm run dev"
cd ..

echo.

:: 2. Frontend Setup
echo [2/5] Verificando Frontend...
cd frontend
if not exist "node_modules" (
    echo    - ALERTA: Faltan librerias del Frontend. Instalando ahora...
    echo    - Esto puede tardar 1-2 minutos. Por favor espera...
    call npm install
) else (
    echo    - Frontend listo.
)
echo    - Iniciando servidor Frontend en puerto 5173...
start "GHL Frontend UI" cmd /k "npm run dev"
cd ..

echo.
echo [3/5] Esperando que los servidores arranquen...
timeout /t 5 /nobreak >nul

echo.
echo [4/5] Abriendo navegador...
start http://localhost:5173

echo.
echo ========================================================
echo                 SISTEMA OPERATIVO
echo ========================================================
echo IMPORTANTE:
echo 1. Se han abierto 2 ventanas negras nuevas. NO LAS CIERRES.
echo    (Son los servidores que mantienen la app viva)
echo 2. Si quieres detener todo, simplemente cierra esas ventanas.
echo.
pause
