@echo off
cls
echo =========================================
echo   DESPLIEGUE: VERSION SIN WHATSAPP AUTO
echo =========================================
echo.
echo Flujo simplificado:
echo   1. Usuario confirma pedido
echo   2. Se guarda en Firestore
echo   3. Mensaje de exito con link manual
echo.
pause
echo.
echo Compilando...
node .\node_modules\vite\bin\vite.js build
if %errorlevel% neq 0 (
    echo ERROR en compilacion
    pause
    exit /b 1
)
echo.
echo Desplegando...
npx --yes firebase-tools@latest deploy --only hosting --project fraganzia-e9b70
echo.
echo =========================================
echo   LISTO
echo =========================================
pause
