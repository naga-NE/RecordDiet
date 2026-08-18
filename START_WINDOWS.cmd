@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (
  echo [ERROR] Node.js 22 is required. Install Node.js LTS 22 and run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies for the first run...
  call npm install --no-audit --no-fund || goto :error
)
echo.
echo Starting Diet Log...
echo PC: http://localhost:5173
echo Smartphone: use the Network URL printed by Vite while on the same Wi-Fi.
echo.
call npm run dev -- --host
exit /b 0
:error
echo.
echo Setup failed. Check your internet connection and npm output above.
pause
exit /b 1
