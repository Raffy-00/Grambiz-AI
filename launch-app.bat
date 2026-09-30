@echo off
title GramBiz AI — Rural Enterprise Advisory Application
echo Starting GramBiz AI in Standalone Application Mode...

set TARGET_URL=http://localhost:8000/
netstat -ano | findstr :8000 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    netstat -ano | findstr :3000 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set TARGET_URL=http://localhost:3000/
    )
)

if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%" --window-size=440,920 --window-position=500,60
    exit /b 0
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%" --window-size=440,920 --window-position=500,60
    exit /b 0
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%" --window-size=440,920 --window-position=500,60
    exit /b 0
)

where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start chrome.exe --app="%TARGET_URL%" --window-size=440,920 --window-position=500,60
    exit /b 0
)

start %TARGET_URL%
exit /b 0
