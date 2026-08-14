@echo off
echo ========================================
echo DESPLEGANDO FIX DE WHATSAPP CON LOGGING
echo ========================================
echo.

echo 1. Probando generacion de link...
node scripts/test-whatsapp-link.mjs
echo.

pause
echo.

echo 2. Compilando...
node .\node_modules\vite\bin\vite.js build
if %errorlevel% neq 0 (
    echo ERROR EN BUILD
    pause
    exit /b %errorlevel%
)
echo.

echo 3. Desplegando...
npx --yes firebase-tools@latest deploy --only hosting --project fraganzia-e9b70
echo.

echo ========================================
echo DESPLIEGUE COMPLETO
echo ========================================
pause
