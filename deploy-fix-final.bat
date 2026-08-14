@echo off
cls
echo ====================================
echo DESPLEGANDO FIX DE WHATSAPP
echo ====================================
echo.
echo Numero WhatsApp: 5491130097370
echo.
echo 1. Compilando...
node .\node_modules\vite\bin\vite.js build
if %errorlevel% neq 0 (
    echo ERROR en build
    pause
    exit /b 1
)
echo.
echo 2. Desplegando...
npx --yes firebase-tools@latest deploy --only hosting --project fraganzia-e9b70
echo.
echo ====================================
echo LISTO! Proba en el celular
echo ====================================
pause
