import os
import time
from utils.audio_utils import convert_to_wav, AUDIO_DIRECTORY
from utils.text_cleaner import clean_disfluencies
from models.base_recognizer import SpeechRecognizer

def process_transcription(temp_file_path: str, recognizer: SpeechRecognizer):
    """Pipeline: convert, transcribe, clean text"""
    start_time = time.time()

    # Convert to WAV
    wav_path = os.path.join(AUDIO_DIRECTORY, "converted_audio.wav")
    wav_path = convert_to_wav(temp_file_path, wav_path)
    if not wav_path:
        return {"error": "Audio conversion failed."}, 500

    # Transcription
    raw_text = recognizer.transcribe(wav_path)
    cleaned_text = clean_disfluencies(raw_text)

    end_time = time.time()
    os.remove(temp_file_path)  # cleanup

    return {
        "raw_transcription": raw_text,
        "cleaned_transcription": cleaned_text,
        "time_taken": f"{end_time - start_time:.2f} seconds"
    }, 200
