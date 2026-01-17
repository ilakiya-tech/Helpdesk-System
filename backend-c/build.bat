@echo off
echo 🔨 Compiling C Backend...
cd src
gcc -o helpdesk.exe helpdesk.c -lws2_32
if %ERRORLEVEL% EQU 0 (
    echo ✅ Compilation successful!
    echo.
    echo 🚀 Run with: helpdesk.exe -a
) else (
    echo ❌ Compilation failed!
)
pause