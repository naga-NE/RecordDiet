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
call npm run build || goto :error
echo.
echo Starting hardened production build...
echo PC: http://localhost:4173
call npm run preview -- --host
exit /b 0
:error
echo.
echo Build or setup failed. Check the output above.
pause
exit /b 1
