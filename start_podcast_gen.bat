@echo off
title Podcast Generator
cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\podcast-generator"
if not exist podcast_server.js pause
echo npm start podcast_server.js
pause debug
npm start podcast_server.js
pause