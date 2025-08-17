from abc import ABC, abstractmethod

class SpeechRecognizer(ABC):
    """Abstract interface for speech recognizers."""

    @abstractmethod
    def transcribe(self, audio_path: str) -> str:
        pass
