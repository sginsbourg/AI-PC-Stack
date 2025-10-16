@echo off
echo Creating default configuration file...

(
echo parameter,value,description
echo INPUT_FILE,"Speaker Notes for 'Testing AI-Based Software Systems - From Theory to Practice'.md",Input markdown file with speaker notes
echo OUTPUT_FOLDER,mp3,Output folder for MP3 files
echo VOICE,en-US-DavisNeural,TTS voice to use
echo SILENCE_BEFORE_MS,2000,Silence duration before audio ^(ms^)
echo SILENCE_AFTER_MS,2000,Silence duration after audio ^(ms^)
echo PPTX_FILE,"Testing AI-Based Software Systems - From Theory to Practice - Shay Ginsbourg.pptx",Input PowerPoint file
echo OUTPUT_PPTX_WITH_AUDIO,presentation_with_audio.pptx,Output PowerPoint file with audio
echo OUTPUT_PPTX_NO_AUDIO,presentation_no_audio.pptx,Output PowerPoint file without audio
echo UPDATED_PPTX,updated_presentation.pptx,Updated PowerPoint file with new speaker notes
echo MP3_FOLDER,mp3,Folder containing MP3 files
echo JPG_FOLDER,jpg,Folder containing JPG slide images
echo VIDEO_OUTPUT,Presentation.mp4,Output video file name
echo TOTAL_SLIDES,40,Total number of slides
echo FFMPEG_PATH,C:\ffmpeg\bin\ffmpeg.exe,Path to FFmpeg executable
) > config.csv

echo Default config.csv created successfully!
echo You can now edit config.csv to customize your settings.
pause