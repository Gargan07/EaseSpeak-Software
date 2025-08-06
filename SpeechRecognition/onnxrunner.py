import onnxruntime as ort
import numpy as np
from transformers import Wav2Vec2Processor
import torch
import soundfile as sf

# Load model and processor
processor = Wav2Vec2Processor.from_pretrained("Gargan07/wav2vec2-disfluency-model")
session = ort.InferenceSession("model/wav2vec2-quant-dynamic.onnx")

# Load audio
audio, rate = sf.read("F:/EaseSpeak-Software-woody/SpeechRecognition/DataSet/AugmentData/aug_Recording (5).wav")
inputs = processor(audio, sampling_rate=rate, return_tensors="pt")
input_values = inputs["input_values"].numpy()

# Run ONNX inference
logits = session.run(None, {"input_values": input_values})[0]

# Decode
predicted_ids = np.argmax(logits, axis=-1)
transcription = processor.batch_decode(predicted_ids)

print("🗣️ Transcribed Text:", transcription[0])
