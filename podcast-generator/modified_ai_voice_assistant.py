import sys
import subprocess
import os
from melo.api import TTS

if len(sys.argv) < 4:
    print("Usage: python ai_voice_assistant.py <text> <voice> <output_file>")
    sys.exit(1)

text = sys.argv[1]
voice = sys.argv[2]  # e.g., 'EN-BR' for UK male
output_file = sys.argv[3]

# TTS Setup
language = 'EN'
tts = TTS(language=language, device='auto')
speaker_id = tts.hps.data.spk2id[voice]
tts.tts_to_file(text, speaker_id, output_file)
print(f"Generated {output_file}")