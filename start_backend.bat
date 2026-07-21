@echo off
echo ========================================
echo  VettedPay Backend Startup
echo ========================================
echo.

cd /d "%~dp0"

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting backend on http://localhost:8000
echo API docs at http://localhost:8000/docs
echo.

uvicorn app.main:app --host 127.0.0.1 --port 8000

pause
