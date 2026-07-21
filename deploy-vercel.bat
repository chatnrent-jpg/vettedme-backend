@echo off
REM ============================================================================
REM VETTED Frontend Deployment Script (Vercel) - Windows
REM ============================================================================
REM This script deploys the Next.js 15 frontend to Vercel production
REM ============================================================================

echo.
echo ========================================
echo VETTED Frontend Deployment to Vercel
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Navigate to frontend directory
cd frontend

echo [INFO] Installing dependencies...
call npm install

echo [INFO] Running production build...
call npm run build

echo [INFO] Running linter...
call npm run lint

echo [INFO] Deploying to Vercel production...
call vercel --prod --yes

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Your frontend is now live at:
echo   https://vettedme.app
echo   https://vettedforce.com
echo.
echo Next steps:
echo 1. Configure custom domains in Vercel dashboard
echo 2. Set up DNS records at your domain registrar
echo 3. Test all endpoints
echo.

cd ..
pause
