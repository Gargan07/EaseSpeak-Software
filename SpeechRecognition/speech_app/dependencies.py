from enum import Enum
from fastapi import Query
from models.recognizers import Wav2Vec2OnnxRecognizer, HmmRecognizer, GmmRecognizer
from models.base_recognizer import SpeechRecognizer

# Enum for engines
class Engine(str, Enum):
    wav2vec2 = "wav2vec2"
    hmm = "hmm"
    gmm = "gmm"

# Flag to force a server-side engine
FORCE_ENGINE: Engine | None = None  # set to Engine.gmm to force GMM

def get_speech_recognizer(
    engine: Engine = Query(default=Engine.wav2vec2, description="Choose the recognition engine")
) -> SpeechRecognizer:
    
    chosen_engine = FORCE_ENGINE if FORCE_ENGINE else engine

    if chosen_engine == Engine.wav2vec2:
        return Wav2Vec2OnnxRecognizer(
            onnx_model_path=r"F:\EaseSpeak-Software-woody\SpeechRecognition\model\wav2vec2-quant-simplified.onnx",
            processor_name="Gargan07/wav2vec2-disfluency-model",
        )
    elif chosen_engine == Engine.hmm:
        return HmmRecognizer()
    elif chosen_engine == Engine.gmm:
        return GmmRecognizer(
            gmm_model_path=r"F:\EaseSpeak-Software-woody\SpeechRecognition\speech_app\framework\gmm_model.pkl"
        )
