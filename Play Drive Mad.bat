@echo off
rem Force the game to open in a real web browser (Edge is on every Windows 10 PC).
set "GAME=%~dp0DriveMad2D.html"
start "" msedge "%GAME%"
if errorlevel 1 start "" chrome "%GAME%"
if errorlevel 1 start "" "%GAME%"
