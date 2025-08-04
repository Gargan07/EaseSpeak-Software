from fastapi import FastAPI, UploadFile, File
import os
import time
import re
import torch
import torchaudio
import numpy as np
import onnxruntime as ort
from transformers import Wav2Vec2Processor
from fastapi.responses import JSONResponse
from pydub import AudioSegment

app = FastAPI()

# === Model setup ===
onnx_model_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\model\wav2vec2-quant-simplified.onnx"
processor_name = "./wav2vec2-disfluency-model-v4-7"  # Still use HuggingFace processor
processor = Wav2Vec2Processor.from_pretrained(processor_name)
ort_session = ort.InferenceSession(onnx_model_path)

# === Ensure audio directory exists ===
audio_directory = "./TestAudio"
os.makedirs(audio_directory, exist_ok=True)

# === Audio conversion ===
def convert_to_wav(input_path, output_path="converted_audio.wav"):
    try:
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_path, format="wav", parameters=["-ar", "16000", "-ac", "1", "-sample_fmt", "s16"])
        return output_path
    except Exception as e:
        print(f"Error converting audio: {e}")
        return None

# === Load and preprocess audio ===
def load_audio(file_path):
    try:
        waveform, sample_rate = torchaudio.load(file_path)
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
            waveform = resampler(waveform)
        return waveform.squeeze(0).numpy(), 16000
    except Exception as e:
        print(f"Error loading audio: {e}")
        return None, None

# === Transcribe using ONNX model ===
def transcribe(audio_path):
    audio, sample_rate = load_audio(audio_path)
    if audio is None:
        return ""

    # Tokenize input
    inputs = processor(audio, sampling_rate=16000, return_tensors="np")
    input_values = inputs["input_values"]

    # Inference
    ort_inputs = {ort_session.get_inputs()[0].name: input_values}
    ort_outs = ort_session.run(None, ort_inputs)
    logits = ort_outs[0]

    # Decode logits
    predicted_ids = np.argmax(logits, axis=-1)
    transcription = processor.batch_decode(predicted_ids)[0]

    return transcription

# === Clean up disfluencies ===
def clean_disfluencies(text):
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)  # repeated words
    text = re.sub(r'\b(\w+)-+\1\b', r'\1', text)    # stutter
    text = re.sub(r'uh+|um+', '', text)             # filler
    return text.strip()

# === Endpoint ===
@app.post("/transcribe/")
async def process_speech(file: UploadFile = File(...)):
    print(f"📥 Received file: {file.filename}")
    try:
        start_time = time.time()

        temp_path = os.path.join(audio_directory, f"temp_{file.filename}")
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Convert to WAV
        wav_path = os.path.join(audio_directory, "converted_audio.wav")
        wav_path = convert_to_wav(temp_path, wav_path)
        if not wav_path:
            os.remove(temp_path)
            return JSONResponse(content={"error": "Audio conversion failed."}, status_code=500)

        # Transcription
        raw_text = transcribe(wav_path)
        cleaned_text = clean_disfluencies(raw_text)
        end_time = time.time()

        print(f"Raw: {raw_text}")
        print(f"Clean: {cleaned_text}")

        # Clean up
        # os.remove(wav_path)
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
