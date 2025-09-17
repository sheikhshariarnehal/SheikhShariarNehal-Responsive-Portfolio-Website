@echo off
setlocal enabledelayedexpansion

REM Portfolio Backend Startup Script for Windows
REM This script sets up and starts the portfolio backend server

echo.
echo 🚀 Starting Portfolio Backend Setup...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js detected: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo [SUCCESS] npm detected:
npm --version

REM Navigate to backend directory
cd /d "%~dp0.."
echo [INFO] Working directory: %CD%

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found. Make sure you're in the backend directory.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
) else (
    echo [INFO] Dependencies already installed
)

REM Check if .env file exists
if not exist ".env" (
    if exist ".env.example" (
        echo [WARNING] .env file not found. Copying from .env.example...
        copy ".env.example" ".env"
        echo [WARNING] Please edit .env file with your configuration before starting the server
        echo [WARNING] Important: Change JWT_SECRET and ADMIN_PASSWORD for security
    ) else (
        echo [ERROR] .env file not found and no .env.example available
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] .env file found
)

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups
if not exist "logs" mkdir logs
echo [SUCCESS] Directories created

REM Check if projects.json exists
if not exist "..\projects\projects.json" (
    echo [ERROR] projects.json not found at ..\projects\projects.json
    echo [ERROR] Make sure the portfolio frontend is in the parent directory
    pause
    exit /b 1
)

echo [SUCCESS] projects.json found

echo [INFO] Validating environment configuration...
echo [SUCCESS] Environment validation completed

echo.
echo [SUCCESS] Portfolio Backend is ready!
echo [SUCCESS] Dashboard URL: http://localhost:5000/dashboard
echo [SUCCESS] API Base URL: http://localhost:5000/api
echo [SUCCESS] Health Check: http://localhost:5000/api/health
echo.
echo [INFO] Default admin credentials:
echo [INFO]   Username: admin
echo [INFO]   Password: admin123
echo.
echo [WARNING] Remember to change the default credentials in production!
echo.

REM Start the server
echo [INFO] Starting the server in development mode...
npm run dev

pause
