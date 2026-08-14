@echo off
echo Desplegando version SIMPLE de WhatsApp (boton manual visible)...
node .\node_modules\vite\bin\vite.js build
if %errorlevel% neq 0 (
    echo Error en build
    pause
    exit /b %errorlevel%
)
npx --yes firebase-tools@latest deploy --only hosting --project fraganzia-e9b70
pause
