@echo off
cd /d "%~dp0" & cls & color 0A & title merge_slides
setlocal enabledelayedexpansion

REM Load configuration values
set "FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe"
set "VIDEO_OUTPUT=Presentation.mp4"
set "JPG_FOLDER=jpg"
set "MP3_FOLDER=mp3"
set "TOTAL_SLIDES=40"

echo Building %TOTAL_SLIDES% individual clips (JPG + MP3) …
set "CONCAT_LIST="
for /l %%i in (1,1,%TOTAL_SLIDES%) do (
   rem zero-pad indices  1 → 001 , %TOTAL_SLIDES% → 040
   set "I=00%%i"
   set "I=!I:~-3!"
   echo clip !I!
   "%FFMPEG_PATH%" -loop 1 -i "%JPG_FOLDER%/Slide%%i.JPG" -i "%MP3_FOLDER%/slide_!I!.mp3" ^
          -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25" ^
          -c:v libx264 -preset fast -tune stillimage -c:a copy -shortest -y "temp_!I!.ts"
   set "CONCAT_LIST=!CONCAT_LIST!temp_!I!.ts|"
)

rem remove trailing |
set "CONCAT_LIST=%CONCAT_LIST:~0,-1%"

echo Concatenating clips …
"%FFMPEG_PATH%" -y -i "concat:%CONCAT_LIST%" -c copy "%VIDEO_OUTPUT%"

echo Cleaning up …
del temp_*.ts

echo Done!  Video saved as %VIDEO_OUTPUT%
pause