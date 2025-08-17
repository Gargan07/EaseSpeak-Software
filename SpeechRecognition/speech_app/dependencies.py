from models.recognizers import Wav2Vec2OnnxRecognizer
from models.base_recognizer import SpeechRecognizer

def get_speech_recognizer() -> SpeechRecognizer:
    """Factory for recognizer (currently Wav2Vec2)."""
    onnx_model_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\model\wav2vec2-quant-simplified.onnx"
    processor_name = "Gargan07/wav2vec2-disfluency-model"
    return Wav2Vec2OnnxRecognizer(onnx_model_path, processor_name)
