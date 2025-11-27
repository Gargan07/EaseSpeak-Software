import json
from typing import List, Dict
from jiwer import wer

from models.recognizers import Wav2Vec2OnnxRecognizer
from models.recognizers import HmmRecognizer


def evaluate_model(recognizer, audio_files: List[str], references: Dict[str, str]):
    # Evaluate a speech recognizer on a batch of audio files.
    predictions = []
    ground_truths = []

    for audio_path in audio_files:
        pred = recognizer.transcribe(audio_path)
        predictions.append(pred)
        ground_truths.append(references[audio_path])

    return wer(ground_truths, predictions)


if __name__ == "__main__":
    # Load audio paths and references from JSON file
    json_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\speech_app\test_data3.json"
    with open(json_path, "r") as f:
        data = json.load(f)

    references = {item["path"]: item["transcription"] for item in data}
    audio_files = list(references.keys())

    # Initialize models
    wav2vec2_model_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\model\wav2vec2-quant-simplified.onnx"
    wav2vec2_recognizer = Wav2Vec2OnnxRecognizer(wav2vec2_model_path, "Gargan07/wav2vec2-disfluency-model")
    hmm_recognizer = HmmRecognizer()

    # Evaluate each model
    wav2vec2_wer = evaluate_model(wav2vec2_recognizer, audio_files, references)
    hmm_wer = evaluate_model(hmm_recognizer, audio_files, references)

    print("WER Comparison:")
    print(f"Wav2Vec2 (ONNX): {wav2vec2_wer:.3f}")
    print(f"HMM (Sphinx): {hmm_wer:.3f}")
