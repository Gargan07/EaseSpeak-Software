import os
import time
import numpy as np
import torchaudio
from utils.audio_utils import convert_to_wav, AUDIO_DIRECTORY
from utils.text_cleaner import clean_disfluencies
from models.base_recognizer import SpeechRecognizer


def has_voice(file_path: str, threshold: float = 0.02) -> bool:
    """
    Detect if the WAV file contains voice or is mostly silent.
    Uses RMS (root mean square) amplitude thresholding.
    """
    try:
        waveform, sr = torchaudio.load(file_path)
        waveform = waveform.mean(dim=0).numpy()  # Convert to mono if stereo

        rms = np.sqrt(np.mean(np.square(waveform)))
        # print(f" RMS Energy: {rms:.6f}")

        # Adjust threshold for your environment:
        #   - 0.001 = very sensitive (detects soft voices)
        #   - 0.005 = balanced
        #   - 0.01+ = strict (ignores background noises)
        return rms > threshold

    except Exception as e:
        print(f"Error detecting voice: {e}")
        return False


def process_transcription(temp_file_path: str, recognizer: SpeechRecognizer):
    """Pipeline: convert, detect voice, transcribe, clean text"""
    start_time = time.time()

    # Step 1: Convert input audio to 16kHz mono WAV
    wav_path = os.path.join(AUDIO_DIRECTORY, "converted_audio.wav")
    wav_path = convert_to_wav(temp_file_path, wav_path)
    if not wav_path:
        return {"error": "Audio conversion failed."}, 500

    # Step 2: Detect if there's actual speech
    print("🔍 Checking for voice activity...")
    if not has_voice(wav_path):
        os.remove(temp_file_path)  # cleanup
        # os.remove(wav_path)
        print("No voice detected — skipping transcription.")
        return {
            "raw_transcription": "",
            "cleaned_transcription": "No voice detected.",
            "time_taken": f"{time.time() - start_time:.2f} seconds"
        }, 200

    # Step 3: Transcribe
    raw_text = recognizer.transcribe(wav_path)
    cleaned_text = clean_disfluencies(raw_text)

    # Step 4: Cleanup and return results
    end_time = time.time()
    os.remove(temp_file_path)
    os.remove(wav_path)

    return {
        "raw_transcription": raw_text,
        "cleaned_transcription": cleaned_text,
        "time_taken": f"{end_time - start_time:.2f} seconds"
    }, 200
