@echo off
TITLE Stop O3L Localhost Services
echo ===================================================
echo   Stopping One Ocean One Life Services
echo ===================================================
echo.

set PG_BIN=D:\oneoceanonelife\pgsql\pgsql\bin
set PG_DATA=D:\oneoceanonelife\pgsql\data

echo Stopping PostgreSQL...
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" stop -m fast >nul 2>&1

echo Stopping Django API / Python runserver processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq O3L Backend API*" >nul 2>&1

echo Stopping Next.js / Node dev servers...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq O3L Frontend Web*" >nul 2>&1

echo.
echo Services stopped.
pause
