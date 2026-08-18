@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (
  echo [ERROR] Node.js 22 is required.
  pause
  exit /b 1
)
if not exist node_modules call npm install --no-audit --no-fund || goto :error
call npm run verify || goto :error
call npm run setup:e2e || goto :error
call npm run test:e2e || goto :error
echo.
echo ALL CHECKS PASSED.
pause
exit /b 0
:error
echo.
echo CHECK FAILED. Review the error above.
pause
exit /b 1
