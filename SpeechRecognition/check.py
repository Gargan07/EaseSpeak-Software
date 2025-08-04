import numpy as np
import librosa
import onnxruntime
import soundfile as sf

# === CONFIG ===
AUDIO_PATH = r"F:/EaseSpeak-Software-woody/SpeechRecognition/DataSet/Recording (5).wav"
MODEL_FP32_PATH = r"F:/EaseSpeak-Software-woody/SpeechRecognition/model/OG/wav2vec2_model.onnx"
MODEL_QUANT_PATH = r"F:/EaseSpeak-Software-woody/SpeechRecognition/model/wav2vec2-quant-simplified.onnx"
SAMPLE_RATE = 16000


def load_audio(path, max_len_sec=2.0):
    audio, sr = librosa.load(path, sr=SAMPLE_RATE)
    max_len = int(max_len_sec * SAMPLE_RATE)
    if len(audio) > max_len:
        audio = audio[:max_len]
    audio = audio.reshape(1, -1).astype(np.float32)
    return audio


def run_inference(session, input_name, audio_input):
    outputs = session.run(None, {input_name: audio_input})
    return outputs[0]  # Usually the logits


def print_summary(name, output):
    print(f"--- {name} ---")
    print(f"Shape: {output.shape}")
    print(f"Mean: {np.mean(output):.5f}, Std: {np.std(output):.5f}")
    print(f"First 5 values: {output.flatten()[:5]}")


if __name__ == "__main__":
    # === Load audio ===
    audio_input = load_audio(AUDIO_PATH)
    print(f"Loaded audio: shape={audio_input.shape}")

    # === Load models ===
    sess_fp32 = onnxruntime.InferenceSession(MODEL_FP32_PATH)
    sess_quant = onnxruntime.InferenceSession(MODEL_QUANT_PATH)

    input_name = sess_fp32.get_inputs()[0].name

    # === Run inference ===
    output_fp32 = run_inference(sess_fp32, input_name, audio_input)
    output_quant = run_inference(sess_quant, input_name, audio_input)

    # === Compare ===
    print_summary("Original Model", output_fp32)
    print_summary("Quantized Model", output_quant)

    # === Optional: difference metrics ===
    diff = np.abs(output_fp32 - output_quant)
    print(f"\nMax abs difference: {np.max(diff):.5f}")
    print(f"Mean abs difference: {np.mean(diff):.5f}")

# import os

# quant_model_path = r"F:/EaseSpeak-Software-woody/SpeechRecognition/model/wav2vec2-quant-dynamic.onnx"

# size_bytes = os.path.getsize(quant_model_path)
# size_mb = size_bytes / (1024 * 1024)

# print(f"Quantized model size: {size_mb:.2f} MB")