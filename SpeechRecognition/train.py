import os
import json
import torch
import torchaudio
import evaluate
from dataclasses import dataclass
from typing import Any, Dict, List, Union
from transformers import (
    Wav2Vec2Processor,
    Wav2Vec2ForCTC,
    TrainingArguments,
    Trainer,
)
from datasets import Dataset

# === 1. Load transcription JSON ===
with open("Audio/transcript.json", "r") as f:
    transcription_data = json.load(f)

# === 2. Convert into Hugging Face Dataset format ===
dataset = Dataset.from_list(transcription_data)

# === 3. Load pre-trained processor and model ===
processor = Wav2Vec2Processor.from_pretrained("wav2vec2-disfluency-model-v2")
model = Wav2Vec2ForCTC.from_pretrained("wav2vec2-disfluency-model-v2")

# === 4. Preprocess audio ===
def speech_file_to_array(batch):
    # Ensure the "path" column is accessed correctly
    speech_array, sampling_rate = torchaudio.load(batch["path"])  # Loading the audio file from the path
    resampler = torchaudio.transforms.Resample(orig_freq=sampling_rate, new_freq=16000)  # Resample to 16kHz
    batch["speech"] = resampler(speech_array).squeeze().numpy()  # Resample and remove unnecessary dimensions
    batch["sampling_rate"] = 16000  # Fixing the sample rate
    batch["target_text"] = batch["transcription"]  # Map transcription text
    return batch

dataset = dataset.map(speech_file_to_array)

# === 5. Tokenize ===
def prepare_dataset(batch):
    # Tokenize the speech file for input
    batch["input_values"] = processor(batch["speech"], sampling_rate=16000).input_values[0]
    
    with processor.as_target_processor():
        batch["labels"] = processor.tokenizer(batch["target_text"]).input_ids
    
    return batch

dataset = dataset.map(prepare_dataset, remove_columns=dataset.column_names)

# === 6. Data collator ===
@dataclass
class DataCollatorCTCWithPadding:
    processor: Wav2Vec2Processor

    def __call__(self, features):
        # Extract input values and labels from features
        input_values = [f["input_values"] for f in features]
        labels = [f["labels"] for f in features]
        
        # Pad the input values
        batch = self.processor.pad(
            {"input_values": input_values}, return_tensors="pt", padding=True
        )
        
        # Pad the labels as well (this will pad the labels but also apply -100 for padding tokens)
        with self.processor.as_target_processor():
            labels_batch = self.processor.pad(
                {"input_ids": labels}, return_tensors="pt", padding=True
            )
        
        # Mask the labels padding as -100 for CTC loss
        batch["labels"] = labels_batch["input_ids"].masked_fill(
            labels_batch["attention_mask"].ne(1), -100
        )
        
        return batch


data_collator = DataCollatorCTCWithPadding(processor=processor)

# === 7. Evaluation metric ===
wer_metric = evaluate.load("wer")  # Load Word Error Rate metric

def compute_metrics(pred):
    # Predicted IDs
    pred_ids = torch.argmax(torch.tensor(pred.predictions), dim=-1)
    # Decode the predicted and reference IDs to strings
    pred_str = processor.batch_decode(pred_ids)
    label_str = processor.batch_decode(pred.label_ids, group_tokens=False)
    
    # Compute the WER
    return {"wer": wer_metric.compute(predictions=pred_str, references=label_str)}

# === 8. Training arguments ===
training_args = TrainingArguments(
    output_dir="./wav2vec2-checkpoint",
    group_by_length=True,
    per_device_train_batch_size=2,
    eval_strategy="epoch",
    num_train_epochs=5,
    save_steps=10,
    logging_steps=10,
    learning_rate=1e-4,
    save_total_limit=2,
    warmup_steps=0,
)

# === 9. Trainer ===
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    eval_dataset=dataset,  # Using the same dataset for eval, you can split this later
    tokenizer=processor.feature_extractor,
    data_collator=data_collator,
    compute_metrics=compute_metrics,
)
#resume_from_checkpoint=True
# === 10. Start training ===
trainer.train(resume_from_checkpoint=True)

# === 11. Save final model ===
model.save_pretrained("wav2vec2-disfluency-model-v3")
processor.save_pretrained("wav2vec2-disfluency-model-v3")
