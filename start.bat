@echo off
cd /d "%~dp0"
echo ========================================================
echo           Odim CRM tizimi ishga tushirilmoqda...
echo ========================================================

start "Odim - FastAPI Backend (Port 8000)" cmd /k "python -m uvicorn server_py.main:app --host 127.0.0.1 --port 8000 --reload"
start "Odim - Node.js Backend (Port 3001)" cmd /k "node server/server.js"
start "Odim - Vite Frontend (Port 5173)" cmd /k "npm run dev"

echo.
echo Barcha xizmatlar alohida oynalarda ishga tushirildi:
echo  - Frontend:         http://localhost:5173
echo  - FastAPI Backend:  http://localhost:8000
echo  - Node.js Backend:  http://localhost:3001
echo.
