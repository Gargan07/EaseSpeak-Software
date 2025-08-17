from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.responses import JSONResponse
import os
from services.transcription_service import process_transcription
from utils.audio_utils import AUDIO_DIRECTORY
from dependencies import get_speech_recognizer
from models.base_recognizer import SpeechRecognizer

app = FastAPI()

@app.post("/transcribe/")
async def transcribe(
    file: UploadFile = File(...),
    recognizer: SpeechRecognizer = Depends(get_speech_recognizer)
):
    print(f"📥 Received file: {file.filename}")
    try:
        temp_path = os.path.join(AUDIO_DIRECTORY, f"temp_{file.filename}")
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        result, status = process_transcription(temp_path, recognizer)
        return JSONResponse(content=result, status_code=status)

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/test/")
async def test_connection():
    return {"message": "FastAPI is working!"}
