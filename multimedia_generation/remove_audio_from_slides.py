# remove_audio_from_slides.py
import win32com.client as win32
import os
import sys
from config_loader import config

def remove_audio_from_slides():
    """
    Remove all audio objects from all slides in the PowerPoint file.
    """
    pptx_file_path = config.get('PPTX_FILE')
    output_pptx_path = config.get('OUTPUT_PPTX_NO_AUDIO')
    
    if not os.path.exists(pptx_file_path):
        print(f"Error: PowerPoint file '{pptx_file_path}' not found.")
        return
    
    ppt = win32.Dispatch('PowerPoint.Application')
    ppt.Visible = True
    
    pres = ppt.Presentations.Open(os.path.abspath(pptx_file_path))
    print(f"Loaded PowerPoint with {pres.Slides.Count} slides.")
    
    removed_count = 0
    for slide_num in range(1, pres.Slides.Count + 1):
        oSlide = pres.Slides(slide_num)
        shapes_to_remove = []
        
        for i in range(oSlide.Shapes.Count, 0, -1):
            oShp = oSlide.Shapes(i)
            is_audio = False
            
            try:
                if hasattr(oShp, 'MediaFormat'):
                    media_type = oShp.MediaFormat.MediaType
                    if media_type == 3:
                        is_audio = True
            except:
                pass
            
            if not is_audio:
                try:
                    if hasattr(oShp, 'Name'):
                        name_lower = oShp.Name.lower()
                        if '.mp3' in name_lower or '.wav' in name_lower or '.m4a' in name_lower or 'audio' in name_lower:
                            is_audio = True
                except:
                    pass
            
            if not is_audio:
                try:
                    for timeline_idx in range(1, oSlide.TimeLine.MainSequence.Count + 1):
                        effect = oSlide.TimeLine.MainSequence(timeline_idx)
                        if (hasattr(effect, 'Shape') and effect.Shape == oShp):
                            if hasattr(effect, 'EffectType'):
                                if effect.EffectType == 83:
                                    is_audio = True
                                    break
                except:
                    pass
            
            if is_audio:
                shapes_to_remove.append(oShp)
        
        for audio_shape in shapes_to_remove:
            try:
                for timeline_idx in range(oSlide.TimeLine.MainSequence.Count, 0, -1):
                    effect = oSlide.TimeLine.MainSequence(timeline_idx)
                    if (hasattr(effect, 'Shape') and effect.Shape == audio_shape):
                        effect.Delete()
                
                audio_shape.Delete()
                removed_count += 1
                print(f"Removed audio from slide {slide_num}")
            except Exception as e:
                print(f"Error removing audio from slide {slide_num}: {e}")
    
    try:
        pres.SaveAs(os.path.abspath(output_pptx_path))
        print(f"Cleaned presentation saved to '{output_pptx_path}'. Removed {removed_count} audio objects.")
    except Exception as e:
        print(f"Error saving presentation: {e}")
    
    try:
        pres.Close()
        ppt.Quit()
    except:
        pass

def remove_all_media_from_slides():
    """
    Alternative approach: Remove all media objects from all slides.
    """
    pptx_file_path = config.get('PPTX_FILE')
    output_pptx_path = config.get('OUTPUT_PPTX_NO_AUDIO')
    
    if not os.path.exists(pptx_file_path):
        print(f"Error: PowerPoint file '{pptx_file_path}' not found.")
        return
    
    ppt = win32.Dispatch('PowerPoint.Application')
    ppt.Visible = True
    
    pres = ppt.Presentations.Open(os.path.abspath(pptx_file_path))
    print(f"Loaded PowerPoint with {pres.Slides.Count} slides.")
    
    removed_count = 0
    for slide_num in range(1, pres.Slides.Count + 1):
        oSlide = pres.Slides(slide_num)
        
        for i in range(oSlide.Shapes.Count, 0, -1):
            oShp = oSlide.Shapes(i)
            try:
                media_type = oShp.MediaFormat.MediaType
                
                for timeline_idx in range(oSlide.TimeLine.MainSequence.Count, 0, -1):
                    effect = oSlide.TimeLine.MainSequence(timeline_idx)
                    if (hasattr(effect, 'Shape') and effect.Shape == oShp):
                        effect.Delete()
                
                oShp.Delete()
                removed_count += 1
                print(f"Removed media object from slide {slide_num}")
                
            except:
                continue
    
    try:
        pres.SaveAs(os.path.abspath(output_pptx_path))
        print(f"Cleaned presentation saved to '{output_pptx_path}'. Removed {removed_count} media objects.")
    except Exception as e:
        print(f"Error saving presentation: {e}")
    
    try:
        pres.Close()
        ppt.Quit()
    except:
        pass

if __name__ == "__main__":
    print("Choose removal method:")
    print("1. Smart audio removal (recommended)")
    print("2. Remove all media objects (more aggressive)")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "2":
        remove_all_media_from_slides()
    else:
        remove_audio_from_slides()