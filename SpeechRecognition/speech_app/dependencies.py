from enum import Enum
from fastapi import Query
from models.recognizers import Wav2Vec2OnnxRecognizer, HmmRecognizer
from models.base_recognizer import SpeechRecognizer

class Engine(str, Enum):
    wav2vec2 = "wav2vec2"
    hmm = "hmm"

def get_speech_recognizer(
    engine: Engine = Query(default=Engine.wav2vec2, description="Choose the recognition engine")
) -> SpeechRecognizer:
    if engine == Engine.wav2vec2:
        return Wav2Vec2OnnxRecognizer(
            onnx_model_path=r"F:\EaseSpeak-Software-woody\SpeechRecognition\model\wav2vec2-quant-simplified.onnx",
            processor_name="Gargan07/wav2vec2-disfluency-model",
        )
    else:
        return HmmRecognizer()
