@echo off
title RoadSafe India — Local Server
color 0A
echo.
echo  ============================================
echo    RoadSafe India - Starting Local Server
echo  ============================================
echo.
echo  Starting Python HTTP Server on port 8080...
echo.

where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  [OK] Python found!
    echo  Access at: http://localhost:8080/login.html
    echo.
    start "" "http://localhost:8080/login.html"
    python -m http.server 8080
    goto end
)

where python3 >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  [OK] Python3 found!
    start "" "http://localhost:8080/login.html"
    python3 -m http.server 8080
    goto end
)

where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  [OK] Node.js found. Using npx serve...
    npx serve -p 8080 .
    goto end
)

echo  [ERROR] Python or Node.js not found.
echo  Install Python from https://python.org and retry.
echo.
pause

:end
