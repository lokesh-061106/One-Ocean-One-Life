@echo off
TITLE O3L Localhost Services
echo ===================================================
echo   One Ocean One Life (O3L) - Localhost Launcher
echo ===================================================
echo.

set PROJECT_ROOT=D:\oneoceanonelife\oneoceanonelife
set PG_BIN=D:\oneoceanonelife\pgsql\pgsql\bin
set PG_DATA=D:\oneoceanonelife\pgsql\data

:: 1. Start PostgreSQL
echo [1/3] Checking PostgreSQL Database...
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting PostgreSQL 17 + PostGIS 3.6...
    start "O3L PostgreSQL" /B "%PG_BIN%\postgres.exe" -D "%PG_DATA%"
    timeout /t 3 /nobreak >nul
) else (
    echo PostgreSQL is already running.
)

:: 2. Start Django API
echo.
echo [2/3] Starting Django API Backend on port 8000...
start "O3L Backend API (port 8000)" cmd /k "cd /d %PROJECT_ROOT%\apps\api && set PYTHONIOENCODING=utf-8 && venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

:: 3. Start Next.js Web
echo.
echo [3/3] Starting Next.js Web Frontend on port 3000...
start "O3L Frontend Web (port 3000)" cmd /k "cd /d %PROJECT_ROOT%\apps\web && npm run dev"

echo.
echo ===================================================
echo   All O3L services are running!
echo   - Web Frontend:  http://localhost:3000
echo   - API Backend:   http://localhost:8000/api/v1/
echo   - Admin Panel:   http://localhost:8000/admin/
echo     (Login: admin / admin123)
echo ===================================================
pause
