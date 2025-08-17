import os
import torchaudio
from pydub import AudioSegment

# Ensure audio directory exists
AUDIO_DIRECTORY = "./TestAudio"
os.makedirs(AUDIO_DIRECTORY, exist_ok=True)

def convert_to_wav(input_path, output_path="converted_audio.wav"):
    """Convert input audio file to 16kHz mono WAV."""
    try:
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_path, format="wav", parameters=["-ar", "16000", "-ac", "1", "-sample_fmt", "s16"])
        return output_path
    except Exception as e:
        print(f"Error converting audio: {e}")
        return None

def load_audio(file_path):
    """Load audio into numpy array with correct sample rate."""
    try:
        waveform, sample_rate = torchaudio.load(file_path)
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
            waveform = resampler(waveform)
        return waveform.squeeze(0).numpy(), 16000
    except Exception as e:
        print(f"Error loading audio: {e}")
        return None, None
