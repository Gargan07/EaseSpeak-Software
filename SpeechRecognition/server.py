from fastapi import FastAPI, UploadFile, File
import torch
import torchaudio
import re
import time
import os
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from fastapi.responses import JSONResponse
from pydub import AudioSegment

app = FastAPI()

# Load the model
model_name = "facebook/wav2vec2-base-960h"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

# Ensure the /Audio directory exists
audio_directory = "./Audio"
if not os.path.exists(audio_directory):
    os.makedirs(audio_directory)

# Function to forcefully convert any audio to WAV with 16kHz sample rate
def convert_to_wav(input_path, output_path="converted_audio.wav"):
    """Convert any audio file to WAV format with 16kHz sample rate"""
    try:
        # Load audio file with pydub
        audio = AudioSegment.from_file(input_path)
        print(f"Audio loaded from {input_path}")

        # Convert to 16kHz sample rate
        audio = audio.set_frame_rate(16000)

        # Export as WAV
        audio.export(output_path, format="wav")
        print(f"Converted audio saved to {output_path}")
        return output_path  # Return the path to the converted WAV file
    
    except Exception as e:
        print(f"Error converting audio: {e}")
        return None

# Function to load and preprocess audio
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

# Clean disfluencies
def clean_disfluencies(text):
    """Remove repetitions and filler words"""
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)  # Remove repeated words
    text = re.sub(r'\b(\w+)-+\1\b', r'\1', text)  # Remove stutter-like words
    text = re.sub(r'uh+|um+', '', text)  # Remove filler words
    return text.strip()

@app.post("/transcribe/")
async def process_speech(file: UploadFile = File(...)):
    print(f"📥 Received file: {file.filename}")    
    try:
        start_time = time.time()

        # Save the uploaded file to the /Audio directory
        temp_path = os.path.join(audio_directory, f"temp_{file.filename}")
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        print(f"📥 Path file: {temp_path}")
        # Convert the uploaded file to WAV format (forcefully)
        wav_path = os.path.join(audio_directory, "converted_audio.wav")
        wav_path = convert_to_wav(temp_path, wav_path)
        if not wav_path:
            os.remove(temp_path)
            return JSONResponse(content={"error": "Audio conversion failed."}, status_code=500)

        # Transcribe the audio
        raw_text = transcribe(wav_path)
        cleaned_text = clean_disfluencies(raw_text)

        end_time = time.time()

        print(f"Raw Transcription: {raw_text}")
        print(f"Cleaned Transcription: {cleaned_text}")

        # Clean up the temporary files
        os.remove(wav_path)
        os.remove(temp_path)

        return {
            "raw_transcription": raw_text,
            "cleaned_transcription": cleaned_text,
            "time_taken": f"{end_time - start_time:.2f} seconds"
        }

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/test/") 
async def test_connection():
    return {"message": "FastAPI is working!"}
