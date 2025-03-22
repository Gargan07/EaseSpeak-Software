import torch
import torchaudio
import re
import os
from pydub import AudioSegment
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

# Load pre-trained Wav2Vec2 model
model_name = "facebook/wav2vec2-base-960h"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

# Convert any audio file to WAV format using pydub
def convert_to_wav(input_path, output_path="converted_audio.wav"):
    """Convert an audio file to a WAV format with 16kHz sample rate"""
    try:
        audio = AudioSegment.from_file(input_path)  # Load audio using pydub
        print(f"Audio loaded from {input_path}")

        # Convert to 16kHz
        audio = audio.set_frame_rate(16000)

        # Export as WAV
        audio.export(output_path, format="wav")
        print(f"Converted audio saved to {output_path}")
        return output_path  # Return new WAV file path
    
    except Exception as e:
        print(f"Error converting audio: {e}")
        return None

# Function to preprocess audio
def load_audio(file_path):
    """Load and resample audio to 16kHz using torchaudio"""
    try:
        waveform, sample_rate = torchaudio.load(file_path)  # Load audio as tensor
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
            waveform = resampler(waveform)
        return waveform.squeeze(0), 16000  # Convert to 1D tensor
    except Exception as e:
        print(f"Error loading audio: {e}")
        return None, None

# Function to transcribe speech
def transcribe(audio_path):
    """Convert speech to text using Wav2Vec2"""
    audio, sample_rate = load_audio(audio_path)
    if audio is None:
        return ""

    # Tokenize input
    input_values = processor(audio, return_tensors="pt", sampling_rate=sample_rate).input_values

    # Perform inference
    with torch.no_grad():
        logits = model(input_values).logits

    # Decode logits to text
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.batch_decode(predicted_ids)[0]

    return transcription

# Function to clean disfluencies
def clean_disfluencies(text):
    """Remove common stuttering and prolongation patterns from text"""
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)  # Remove repeated words
    text = re.sub(r'\b(\w+)-+\1\b', r'\1', text)   # Remove artificial prolongation
    text = re.sub(r'uh+|um+', '', text)            # Remove filler words
    return text.strip()

# Run speech recognition with disfluency cleaning
def process_speech(audio_path):
    # Convert to WAV first if necessary
    wav_path = convert_to_wav(audio_path)
    if not wav_path:
        print("Error: Conversion failed. Exiting.")
        return

    # Transcribe and clean the text
    raw_text = transcribe(wav_path)
    cleaned_text = clean_disfluencies(raw_text)

    print(f"Raw Transcription: {raw_text}")
    print(f"Cleaned Transcription: {cleaned_text}")

    return cleaned_text

# Example usage
if __name__ == "__main__":
    # Update the path to your specific audio file location
    audio_file = "F:/SoftwareDevelopment/SpeechRecognition/Audio/audio.wav"  # Ensure this path is correct
    process_speech(audio_file)
