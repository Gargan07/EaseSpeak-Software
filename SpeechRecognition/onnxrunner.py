# import onnxruntime as ort
# import numpy as np
# from transformers import Wav2Vec2Processor
# import torch
# import soundfile as sf

# # Load model and processor
# processor = Wav2Vec2Processor.from_pretrained("Gargan07/wav2vec2-disfluency-model")
# session = ort.InferenceSession("model/wav2vec2-quant-simplified.onnx")

# # Load audio
# audio, rate = sf.read("F:/EaseSpeak-Software-woody/SpeechRecognition/speech_app/DataSet/Recording (33).wav")
# inputs = processor(audio, sampling_rate=rate, return_tensors="pt")
# input_values = inputs["input_values"].numpy()

# # Run ONNX inference
# logits = session.run(None, {"input_values": input_values})[0]

# # Decode
# predicted_ids = np.argmax(logits, axis=-1)
# transcription = processor.batch_decode(predicted_ids)

# print("🗣️ Transcribed Text:", transcription[0])

import speech_recognition as sr

# Define your HmmRecognizer class
class HmmRecognizer:
    def __init__(self):
        self.recognizer = sr.Recognizer()

    def transcribe(self, audio_path: str) -> str:
        try:
            with sr.AudioFile(audio_path) as source:
                audio = self.recognizer.record(source)
            raw_text = self.recognizer.recognize_sphinx(audio)
        except sr.UnknownValueError:
            raw_text = ""
        except sr.RequestError as e:
            raw_text = f"Recognizer error: {e}"

        return raw_text

# Usage
if __name__ == "__main__":
    audio_path = "F:/EaseSpeak-Software-woody/SpeechRecognition/DataSet/Recording (116).wav"

    recognizer = HmmRecognizer()
    transcription = recognizer.transcribe(audio_path)

    print("🗣️ Transcribed Text:", transcription)
