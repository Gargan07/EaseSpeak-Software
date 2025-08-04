import torch
import torchaudio
import re
import os
import numpy as np
import librosa
import noisereduce as nr
from pydub import AudioSegment
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

# Load pre-trained Wav2Vec2 model
#model_name = "./wav2vec2-disfluency-model-v3"
model_name = "wav2vec2-disfluency-model-v4-6"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

# def preprocess_audio(waveform, sample_rate):
#     """Apply noise reduction, normalization, and silence trimming"""

#     # Convert torch tensor to numpy
#     audio_np = waveform.numpy()

#     # Normalize audio (peak normalization)
#     audio_np = audio_np / np.max(np.abs(audio_np))

#     # Optional: Denoise audio
#     audio_np = nr.reduce_noise(y=audio_np, sr=sample_rate)

#     # Optional: Trim leading/trailing silence
#     audio_np, _ = librosa.effects.trim(audio_np, top_db=20)

#     # Convert back to torch tensor
#     processed_waveform = torch.tensor(audio_np)

#     return processed_waveform

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

    # audio = preprocess_audio(audio, sample_rate)

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

    text = re.sub(r'\b(UM+|UH+|ER+|AH+|MM+|EH+)\b', '', text)
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)  # Remove repeated words
    text = re.sub(r'\b(\w+)-+\1\b', r'\1', text)   # Remove artificial prolongation
    text = re.sub(r'uh+|um+', '', text)            # Remove filler words
    text = re.sub(r'^A (?=(I|YOU|HE|SHE|WE|THEY|THINK|THOUGHT|WENT|WAS|HAVE|HAD|AM|ARE|IS|CAN|COULD|MAY|MIGHT|WILL|WOULD|SHOULD|DO|DID|GO|GET|SEE|SAY|TELL|IT)\b)', '', text)
    text = re.sub(r'\s+', ' ', text)

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
    audio_file = "F:/EaseSpeak-Software-woody/SpeechRecognition/DataSet/Recording (90).wav"  # Ensure this path is correct
    process_speech(audio_file)
