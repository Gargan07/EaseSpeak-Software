import json
from typing import List, Dict
from jiwer import wer

from models.recognizers import Wav2Vec2OnnxRecognizer, Wav2Vec2TorchRecognizer


def evaluate_model(recognizer, audio_files: List[str], references: Dict[str, str]):
    predictions = []
    ground_truths = []

    for audio_path in audio_files:
        pred = recognizer.transcribe(audio_path)

        if pred is None:
            pred = ""

        predictions.append(pred)
        ground_truths.append(references[audio_path])

    return wer(ground_truths, predictions)


if __name__ == "__main__":
    json_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\speech_app\test_data3.json"
    with open(json_path, "r") as f:
        data = json.load(f)

    references = {item["path"]: item["transcription"] for item in data}
    audio_files = list(references.keys())

    onnx_model_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\model\wav2vec2-quant-simplified.onnx"
    onnx_recognizer = Wav2Vec2OnnxRecognizer(
        onnx_model_path,
        "Gargan07/wav2vec2-disfluency-model"
    )

    hf_recognizer = Wav2Vec2TorchRecognizer("Gargan07/wav2vec2-disfluency-model")

    hf_wer = evaluate_model(hf_recognizer, audio_files, references)
    onnx_wer = evaluate_model(onnx_recognizer, audio_files, references)

    print("WER Comparison:")
    print(f"Compressed Model:     {onnx_wer:.3f}")
    print(f"Non-Compressed Model: {hf_wer:.3f}")
    
