@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   POS System Auto-Start Installation
echo ========================================
echo.

:: Create directories
mkdir C:\pos-system 2>nul
mkdir C:\pos-system\logs 2>nul

:: Create startup scripts
echo Creating startup scripts...

:: Backend startup script
(
echo @echo off
echo cd /d "C:\deployment-package\server"
echo echo Starting POS Backend at %%date%% %%time%% ^>^> C:\pos-system\logs\backend.log
echo php artisan serve --host=0.0.0.0 --port=8000 ^>^> C:\pos-system\logs\backend.log 2^>^&1
) > C:\pos-system\start-backend.bat

:: Frontend startup script
(
echo @echo off
echo cd /d "C:\Users\rayha\rtc-frontend - Gold\rtlstore-frontend"
echo echo Starting POS Frontend at %%date%% %%time%% ^>^> C:\pos-system\logs\frontend.log
echo npx serve -s dist -l 3000 --listen 0.0.0.0 ^>^> C:\pos-system\logs\frontend.log 2^>^&1
) > C:\pos-system\start-frontend.bat

:: Check NSSM availability
if exist "C:\nssm\win64\nssm.exe" (
    echo Installing services with NSSM...
    cd C:\nssm\win64
    
    nssm install POSBackend "C:\php\php.exe" "artisan serve --host=0.0.0.0 --port=8000"
    nssm set POSBackend AppDirectory "C:\deployment-package\server"
    nssm set POSBackend Start SERVICE_AUTO_START
    nssm set POSBackend AppStdout "C:\pos-system\logs\backend.log"
    nssm set POSBackend AppStderr "C:\pos-system\logs\backend-error.log"
    
    nssm install POSFrontend "C:\Users\rayha\AppData\Roaming\npm\serve.cmd" "-s dist -l 3000 --listen 0.0.0.0"
    nssm set POSFrontend AppDirectory "C:\Users\rayha\rtc-frontend - Gold\rtlstore-frontend"
    nssm set POSFrontend Start SERVICE_AUTO_START
    nssm set POSFrontend AppStdout "C:\pos-system\logs\frontend.log"
    nssm set POSFrontend AppStderr "C:\pos-system\logs\frontend-error.log"
    
    nssm start POSBackend
    nssm start POSFrontend
    echo Services installed and started!
) else (
    echo NSSM not found. Using Task Scheduler...
    
    :: Create tasks with Task Scheduler
    schtasks /create /tn "POS Backend" /tr "C:\pos-system\start-backend.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f
    schtasks /create /tn "POS Frontend" /tr "C:\pos-system\start-frontend.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f
    schtasks /change /tn "POS Frontend" /delay 0000:30
    
    :: Run tasks now
    schtasks /run /tn "POS Backend"
    timeout /t 5
    schtasks /run /tn "POS Frontend"
    
    echo Tasks created and started!
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Services/Tasks will auto-start on boot
echo Logs are stored in: C:\pos-system\logs
echo.
echo To check status:
echo   nssm status POSBackend  (if using NSSM)
echo   sc query POSBackend     (if using Windows Service)
echo   schtasks /query /tn "POS Backend"  (if using Task Scheduler)
echo.
pause