# insert_audio_to_slides.py
import win32com.client as win32
import os
import glob
import re
import sys
from config_loader import config

def insert_audio_to_slides():
    """
    Insert MP3 audio files into the corresponding slides of the PowerPoint file.
    """
    pptx_file_path = config.get('PPTX_FILE')
    output_pptx_path = config.get('OUTPUT_PPTX_WITH_AUDIO')
    mp3_folder = config.get('MP3_FOLDER')
    
    if not os.path.exists(pptx_file_path):
        print(f"Error: PowerPoint file '{pptx_file_path}' not found.")
        return
    
    if not os.path.exists(mp3_folder):
        print(f"Error: MP3 folder '{mp3_folder}' not found.")
        return
    
    ppt = win32.Dispatch('PowerPoint.Application')
    ppt.Visible = True
    
    pres = ppt.Presentations.Open(os.path.abspath(pptx_file_path))
    print(f"Loaded PowerPoint with {pres.Slides.Count} slides.")
    
    mp3_pattern = os.path.join(mp3_folder, '*.mp3')
    mp3_files = glob.glob(mp3_pattern)
    print(f"Found {len(mp3_files)} MP3 files in '{mp3_folder}'.")
    
    mp3_dict = {}
    for mp3_path in mp3_files:
        filename = os.path.basename(mp3_path)
        match = re.match(r'slide_(\d{3})\.mp3', filename)
        if match:
            slide_num = int(match.group(1))
            if 1 <= slide_num <= pres.Slides.Count:
                mp3_dict[slide_num] = os.path.abspath(mp3_path)
                print(f"Mapped slide {slide_num} to '{mp3_path}'")
        else:
            print(f"Warning: Skipping '{filename}' - does not match 'slide_###.mp3' format.")
    
    sorted_slide_nums = sorted(mp3_dict.keys())
    print(f"Valid slide mappings: {sorted_slide_nums}")
    
    inserted_count = 0
    for slide_num in sorted_slide_nums:
        oSlide = pres.Slides(slide_num)
        audio_path = mp3_dict[slide_num]
        
        try:
            oShp = oSlide.Shapes.AddMediaObject2(audio_path, False, True, 10, 10, 1, 1)
            
            oEffect = oSlide.TimeLine.MainSequence.AddEffect(oShp, 83, 0, 2)
            oEffect.MoveTo(1)
            
            oEffect.EffectInformation.PlaySettings.HideWhileNotPlaying = True
            
            print(f"Successfully inserted and configured audio from '{audio_path}' into slide {slide_num}")
            inserted_count += 1
        except Exception as e:
            print(f"Error inserting audio for slide {slide_num}: {e}")
    
    pres.SaveAs(os.path.abspath(output_pptx_path))
    pres.Close()
    ppt.Quit()
    
    print(f"Updated presentation saved to '{output_pptx_path}'. Inserted {inserted_count} audio files.")

if __name__ == "__main__":
    insert_audio_to_slides()