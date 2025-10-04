@echo off
cd /d "%~dp0" & cls & color 0A
set PATH=%PATH%;C:\Windows\System32;

REM Create the new seed file
cd nutch_data\urls
start "" seed.txt
REM Copy and paste the content above, then save