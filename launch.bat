@echo off
setlocal
cd /d "%~dp0"
python scripts\launch_server.py --open
endlocal
