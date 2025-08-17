import numpy as np
import onnxruntime as ort
from transformers import Wav2Vec2Processor
from utils.audio_utils import load_audio
from models.base_recognizer import SpeechRecognizer

class Wav2Vec2OnnxRecognizer(SpeechRecognizer):
    def __init__(self, onnx_model_path, processor_name):
        self.processor = Wav2Vec2Processor.from_pretrained(processor_name)
        self.session = ort.InferenceSession(onnx_model_path)

    def transcribe(self, audio_path: str) -> str:
        audio, _ = load_audio(audio_path)
        if audio is None:
            return ""
        
        # Tokenize input
        inputs = self.processor(audio, sampling_rate=16000, return_tensors="np")
        input_values = inputs["input_values"]

        # Run inference
        ort_inputs = {self.session.get_inputs()[0].name: input_values}
        ort_outs = self.session.run(None, ort_inputs)
        logits = ort_outs[0]

        # Decode logits
        predicted_ids = np.argmax(logits, axis=-1)
        transcription = self.processor.batch_decode(predicted_ids)[0]
        return transcription
