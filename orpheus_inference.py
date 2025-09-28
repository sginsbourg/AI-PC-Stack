from transformers import VitsModel, VitsTokenizer
import torch
import soundfile as sf
import sys

def main():
    text = sys.argv[1] if len(sys.argv) > 1 else "Hello, this is Orpheus TTS."
    output_path = sys.argv[2] if len(sys.argv) > 2 else "output.wav"

    print(f"[+] Loading Orpheus-TTS model...")
    model = VitsModel.from_pretrained("yl4579/Orpheus-TTS")
    tokenizer = VitsTokenizer.from_pretrained("yl4579/Orpheus-TTS")

    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        output = model(**inputs).waveform

    audio = output.squeeze().cpu().numpy()
    sf.write(output_path, audio, model.config.sampling_rate)
    print(f"[+] Audio saved to {output_path}")

if __name__ == "__main__":
    main()