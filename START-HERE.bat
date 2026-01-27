@echo off
REM ============================================================================
REM Jira Structure Learning Tool - Windows Launcher
REM 
REM Double-click this file to start the application.
REM It will open automatically in your default web browser.
REM ============================================================================

title Jira Structure Learning Tool

REM Change to script directory
cd /d "%~dp0"

echo.
echo ==============================================================
echo         Jira Structure Learning Tool - Launcher
echo ==============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo.
    echo Please install Node.js 18 or later from:
    echo https://nodejs.org/
    echo.
    echo After installing Node.js, double-click this file again.
    echo.
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=1 delims=v." %%v in ('node -v') do set NODE_VERSION=%%v
for /f "tokens=1 delims=." %%v in ('node -v ^| findstr /r "v[0-9]*\.[0-9]*\.[0-9]*" ^| findstr /r "[0-9]*\.[0-9]*\.[0-9]*"') do (
    for /f "tokens=1 delims=v" %%a in ("%%v") do set NODE_MAJOR=%%a
)

for /f "tokens=1" %%v in ('node -v') do set NODE_FULL=%%v
echo [OK] Node.js %NODE_FULL% detected

REM Check if node_modules exists
if not exist "node_modules\" (
    echo.
    echo [INFO] Installing dependencies... ^(this may take a minute^)
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

REM Check if dist folder exists (production build)
if not exist "dist\" (
    echo.
    echo [INFO] Building the application... ^(this may take a moment^)
    call npm run build
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to build the application.
        pause
        exit /b 1
    )
    echo [OK] Application built
)

REM Check if dist-server folder exists (server build)
if not exist "dist-server\" (
    echo.
    echo [INFO] Building the server...
    call npm run build:server
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to build the server.
        pause
        exit /b 1
    )
    echo [OK] Server built
)

echo.
echo [INFO] Starting Jira Structure Learning Tool...
echo.
echo The application will open in your browser automatically.
echo Press Ctrl+C to stop the server when done.
echo.
echo ==============================================================
echo   TIP: Connect Claude Desktop for AI-powered workflows!
echo   See docs\MCP-SETUP.md for configuration instructions.
echo ==============================================================
echo.

REM Start the server (it will auto-open browser)
call npm start

REM Keep window open if there's an error
pause
