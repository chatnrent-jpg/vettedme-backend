@echo off
echo.
echo ========================================
echo   VettedPay Full-Stack Local Launch
echo ========================================
echo.
echo This script will start:
echo   1. FastAPI Backend (Port 8000)
echo   2. Next.js Frontend (Port 3005)
echo.
echo Press Ctrl+C in each window to stop
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking backend dependencies...
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [2/4] Installing backend dependencies...
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [WARNING] Some backend dependencies may not have installed correctly
)

echo [3/4] Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo [INFO] Running npm install (this may take a minute)...
    call npm install
) else (
    echo [INFO] node_modules found, skipping npm install
)
cd ..

echo [4/4] Starting services...
echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo.
echo [BACKEND]  http://localhost:8000
echo [FRONTEND] http://localhost:3005
echo [DOCS]     http://localhost:8000/docs
echo.
echo Windows will open for each service.
echo Keep them running to use VettedPay.
echo ========================================
echo.

REM Start FastAPI backend in new window
start "VettedPay Backend (Port 8000)" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && echo Starting FastAPI backend... && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start Next.js frontend in new window
start "VettedPay Frontend (Port 3005)" cmd /k "cd /d %~dp0\frontend && echo Starting Next.js frontend... && npm run dev"

REM Wait 5 seconds for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   VettedPay is now running!
echo ========================================
echo.
echo Backend API:  http://localhost:8000
echo Frontend UI:  http://localhost:3005
echo API Docs:     http://localhost:8000/docs
echo.
echo Two windows should have opened.
echo Keep them running to use VettedPay.
echo.
echo Opening frontend in your browser...
timeout /t 2 /nobreak >nul

REM Open frontend in default browser
start http://localhost:3005

echo.
echo [SUCCESS] VettedPay is live on your machine!
echo.
echo To test:
echo   1. Visit http://localhost:3005 (landing page)
echo   2. Visit http://localhost:3005/vettedpay/transfer (transfer dashboard)
echo   3. Visit http://localhost:8000/docs (API documentation)
echo.
echo Press any key to view logs (or close this window)
pause >nul
