import json
import time
from typing import List, Dict

from models.recognizers import Wav2Vec2OnnxRecognizer, Wav2Vec2TorchRecognizer


def measure_inference_time(recognizer, audio_files: List[str]):
    inference_times = []

    for audio_path in audio_files:
        t0 = time.time()
        _ = recognizer.transcribe(audio_path)
        t1 = time.time()

        inference_times.append(t1 - t0)

    total_time = sum(inference_times)
    avg_time = total_time / len(inference_times)

    return {
        "total_time": total_time,
        "avg_time": avg_time,
        "per_file_times": inference_times
    }


if __name__ == "__main__":
    json_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\speech_app\test_data3.json"
    with open(json_path, "r") as f:
        data = json.load(f)

    audio_files = [item["path"] for item in data]

    onnx_model_path = r"F:\EaseSpeak-Software-woody\SpeechRecognition\model\wav2vec2-quant-simplified.onnx"
    onnx_recognizer = Wav2Vec2OnnxRecognizer(
        onnx_model_path,
        "Gargan07/wav2vec2-disfluency-model"
    )

    hf_recognizer = Wav2Vec2TorchRecognizer("Gargan07/wav2vec2-disfluency-model")

    hf_times = measure_inference_time(hf_recognizer, audio_files)
    onnx_times = measure_inference_time(onnx_recognizer, audio_files)

    print("=== Inference Time Comparison ===")

    print("\nNon-Compressed Model:")
    print(f"  Total Time: {hf_times['total_time']:.3f} sec")
    print(f"  Avg Time:   {hf_times['avg_time']:.3f} sec/file")

    print("\nCompressed Model:")
    print(f"  Total Time: {onnx_times['total_time']:.3f} sec")
    print(f"  Avg Time:   {onnx_times['avg_time']:.3f} sec/file")
