import os
import re
import joblib
import librosa
import numpy as np
import onnxruntime as ort
import speech_recognition as sr
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

class HmmRecognizer(SpeechRecognizer):
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

class GmmRecognizer(SpeechRecognizer):
    """GMM-based speech recognizer for phoneme/unit decoding."""

    def __init__(self, gmm_model_path: str):
        if not os.path.exists(gmm_model_path):
            raise FileNotFoundError(f"GMM model not found: {gmm_model_path}")

        try:
            gmm_data = joblib.load(gmm_model_path)
            self.gmm_models = gmm_data["gmm_models"]
            self.label_encoder = gmm_data["label_encoder"]
            # Create mapping from index → label for decoding
            self.label_map = {
                i: label for i, label in enumerate(self.label_encoder.classes_)
            }
            print("✅ GMM Recognizer loaded successfully.")
        except Exception as e:
            raise RuntimeError(f"Failed to load GMM model: {e}")

    def extract_features(self, audio_path: str):
        """Extract MFCC features from the given audio file."""
        try:
            y, sr = librosa.load(audio_path, sr=16000)
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            return mfcc.T  # (frames, features)
        except Exception as e:
            print(f"Error extracting features: {e}")
            return np.empty((0, 13))

    def gmm_predict_all_models(self, features: np.ndarray):
        """Run each GMM model on frames and pick the best scoring one."""
        if features.size == 0:
            return np.array([])

        scores = []
        for label, gmm in self.gmm_models.items():
            try:
                score = gmm.score_samples(features)  # log-likelihood per frame
            except Exception:
                score = np.full(features.shape[0], -np.inf)
            scores.append(score)

        scores = np.array(scores)  # (num_models, num_frames)
        best_labels = np.argmax(scores, axis=0)
        return best_labels

    def decode_predictions(self, predictions: np.ndarray) -> str:
        """Convert predicted label indices into a text sequence."""
        if predictions.size == 0:
            return ""
        chars = [self.label_map.get(p, "") for p in predictions]
        text = "".join(chars)
        text = re.sub(r"(.)\1+", r"\1", text)  # collapse repeats
        return text.strip()

    def transcribe(self, audio_path: str) -> str:
        """Main GMM transcription pipeline."""
        try:
            features = self.extract_features(audio_path)
            predictions = self.gmm_predict_all_models(features)
            raw_text = self.decode_predictions(predictions)
            return raw_text
        except Exception as e:
            print(f"GMM Transcription error: {e}")
            return ""