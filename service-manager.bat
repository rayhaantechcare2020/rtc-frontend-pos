@echo off
echo ========================================
echo   POS System Service Manager
echo ========================================
echo.
echo 1. Start All Services
echo 2. Stop All Services
echo 3. Restart All Services
echo 4. Check Status
echo 5. View Logs
echo 6. Install Auto-Start
echo 7. Uninstall Auto-Start
echo 8. Exit
echo.
set /p choice="Select option: "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto install
if "%choice%"=="7" goto uninstall
if "%choice%"=="8" goto exit

:start
echo Starting services...
nssm start POSBackend 2>nul
nssm start POSFrontend 2>nul
schtasks /run /tn "POS Backend" 2>nul
schtasks /run /tn "POS Frontend" 2>nul
echo Services started
pause
goto menu

:stop
echo Stopping services...
nssm stop POSBackend 2>nul
nssm stop POSFrontend 2>nul
schtasks /end /tn "POS Backend" 2>nul
schtasks /end /tn "POS Frontend" 2>nul
echo Services stopped
pause
goto menu

:restart
call :stop
timeout /t 3
call :start
goto menu

:status
sc query POSBackend
sc query POSFrontend
pause
goto menu

:logs
if not exist "C:\pos-system\logs" mkdir C:\pos-system\logs
start notepad C:\pos-system\logs\backend.log
start notepad C:\pos-system\logs\frontend.log
goto menu

:install
call install-auto-start.bat
goto menu

:uninstall
echo Removing services...
nssm remove POSBackend confirm 2>nul
nssm remove POSFrontend confirm 2>nul
schtasks /delete /tn "POS Backend" /f 2>nul
schtasks /delete /tn "POS Frontend" /f 2>nul
echo Services removed
pause
goto menu

:exit
exit