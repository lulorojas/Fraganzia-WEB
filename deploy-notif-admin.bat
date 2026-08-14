@echo off
cls
echo ============================================
echo   WHATSAPP: NOTIFICACION AUTOMATICA ADMIN
echo ============================================
echo.
echo Como funciona:
echo  1. Cliente confirma pedido
echo  2. Se guarda en Firestore
echo  3. WhatsApp se abre con mensaje para vos
echo  4. Cliente toca "enviar" y te llega
echo.
echo Tu numero: 5491130097370
echo.
pause
echo.
echo Compilando...
node .\node_modules\vite\bin\vite.js build
if %errorlevel% neq 0 (
    echo ERROR
    pause
    exit /b 1
)
echo.
echo Desplegando...
npx --yes firebase-tools@latest deploy --only hosting --project fraganzia-e9b70
echo.
echo ============================================
echo   LISTO - Proba en el celular
echo ============================================
pause
