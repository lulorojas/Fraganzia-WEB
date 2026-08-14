@echo off
cls
echo =======================================
echo   DESPLIEGUE: WHATSAPP AUTOMATICO
echo =======================================
echo.
echo Flujo: Confirmar -^> Guardar -^> WhatsApp abre solo
echo Numero: 5491130097370
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
echo OK
echo.
echo Desplegando a Firebase...
npx --yes firebase-tools@latest deploy --only hosting --project fraganzia-e9b70
echo.
echo =======================================
echo   LISTO - Proba en el celular
echo =======================================
pause
