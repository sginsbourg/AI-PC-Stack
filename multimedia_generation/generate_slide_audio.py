# generate_slide_audio.py
import os
import re
import asyncio
import edge_tts
from pydub import AudioSegment
from config_loader import config

# Load configuration
INPUT_FILE = config.get('INPUT_FILE')
OUTPUT_FOLDER = config.get('OUTPUT_FOLDER')
VOICE = config.get('VOICE')
SILENCE_BEFORE_MS = config.get('SILENCE_BEFORE_MS')
SILENCE_AFTER_MS = config.get('SILENCE_AFTER_MS')

def sanitize_text(text):
    replacements = {
        '&': ' and ',
        '–': '-', '—': '-', '…': '...',
        '“': '"', '”': '"', '‘': "'", '’': "'",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

async def generate_audio(title, text, output_path):
    if not text.strip():
        print(f"  ⚠️ Skipping empty slide for {os.path.basename(output_path)} ({title})")
        return
    
    original_text = text
    clean_text = sanitize_text(text)
    
    if not clean_text:
        print(f"  ⚠️ Text became empty after sanitization for {os.path.basename(output_path)} ({title})")
        return

    silence_before = AudioSegment.silent(duration=SILENCE_BEFORE_MS)
    silence_after = AudioSegment.silent(duration=SILENCE_AFTER_MS)
    temp_path = output_path + ".temp.mp3"
    
    try:
        communicate = edge_tts.Communicate(text=clean_text, voice=VOICE)
        await communicate.save(temp_path)
        
        if not os.path.exists(temp_path) or os.path.getsize(temp_path) < 100:
            raise Exception("No audio received or file is too small (possible TTS service failure or invalid characters).")
        
        tts_audio = AudioSegment.from_file(temp_path)
        final_audio = silence_before + tts_audio + silence_after
        final_audio.export(output_path, format="mp3")
        print(f"  ✅ {os.path.basename(output_path)}")
        
    except Exception as e:
        print(f"  ❌ FAILED for {os.path.basename(output_path)} ({title}): {e}")
        print(f"     Text that caused failure (Original):\n---\n{repr(original_text)}\n---")
        
        fail_filepath = output_path.replace('.mp3', '_failed.txt')
        try:
            with open(fail_filepath, 'w', encoding='utf-8') as f:
                f.write(f"Slide: {title}\n")
                f.write(f"Error: {e}\n\n")
                f.write("Original Text:\n")
                f.write(original_text)
                f.write("\n\nSanitized Text:\n")
                f.write(clean_text)
            print(f"     Problematic text saved to: {os.path.basename(fail_filepath)}")
        except Exception as file_e:
            print(f"     Could not save problematic text to file: {file_e}")
            
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def parse_slides(content):
    if content.startswith('\ufeff'):
        content = content[1:]
    
    slides = []
    lines = content.splitlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        slide_match = re.match(r'^##\s+Slide\s+(\d+):\s*(.*)', line, re.IGNORECASE)
        
        if slide_match:
            slide_num = slide_match.group(1)
            title = slide_match.group(2)
            full_title = f"Slide {slide_num}: {title}"
            
            i += 1
            
            notes_lines = []
            
            while i < len(lines):
                current_line = lines[i].strip()
                
                if re.match(r'^##\s+Slide\s+\d+:', current_line):
                    break
                
                if not notes_lines and not current_line:
                    i += 1
                    continue
                
                if current_line:
                    notes_lines.append(current_line)
                
                i += 1
            
            notes = ' '.join(notes_lines)
            notes = re.sub(r'\s+', ' ', notes).strip()
            
            slides.append((full_title, notes))
        else:
            i += 1
    
    return slides

async def main():
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    if not os.path.isfile(INPUT_FILE):
        print(f"❌ ERROR: File not found: {INPUT_FILE}")
        return
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ ERROR reading file: {e}")
        return

    print("🔍 Parsing slides from Markdown file...")
    slides = parse_slides(content)

    if not slides:
        print("❌ ERROR: No slides found!")
        print("\n💡 First 500 chars:")
        print(repr(content[:500]))
        return

    print(f"✅ Parsed {len(slides)} slides.")
    tasks = []
    for idx, (title, notes) in enumerate(slides, 1):
        output_file = os.path.join(OUTPUT_FOLDER, f"slide_{idx:03d}.mp3")
        tasks.append(generate_audio(title, notes, output_file))
        print(f"  📝 {title}")
        print(f"     Notes: {notes[:100]}{'...' if len(notes) > 100 else ''}")

    print("\n🔊 Generating audio...")
    await asyncio.gather(*tasks)

    mp3_count = len([f for f in os.listdir(OUTPUT_FOLDER) if f.endswith('.mp3')])
    print(f"\n🎉 Done! Generated {mp3_count} files in '{OUTPUT_FOLDER}'")

if __name__ == "__main__":
    asyncio.run(main())