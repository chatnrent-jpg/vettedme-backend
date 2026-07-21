@echo off
REM ============================================================================
REM VETTED Backend Deployment Script (Railway) - Windows
REM ============================================================================
REM This script deploys the Node.js/Express backend to Railway production
REM ============================================================================

echo.
echo ========================================
echo VETTED Backend Deployment to Railway
echo ========================================
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Railway CLI not found. Installing...
    npm install -g @railway/cli
)

echo [INFO] Installing dependencies...
call npm install

echo [INFO] Running TypeScript build...
call npm run build

echo [INFO] Running linter...
call npm run lint

echo [INFO] Generating Prisma client...
call npx prisma generate

echo [INFO] Deploying to Railway production...
call railway up

echo [INFO] Running database migrations...
call railway run npx prisma migrate deploy

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Your backend is now live at:
echo   https://api.vettedforce.com
echo.
echo Next steps:
echo 1. Configure custom domain in Railway dashboard
echo 2. Set up DNS CNAME record: api.vettedforce.com -^> Railway
echo 3. Verify environment variables are set
echo 4. Test health endpoint: curl https://api.vettedforce.com/health
echo.

pause
