from collections.abc import Iterable
from pathlib import Path
from threading import Lock
from typing import Any, Protocol

from .config import TranscriptionSettings


class TranscriptionEngine(Protocol):
    @property
    def model_loaded(self) -> bool: ...

    def transcribe(self, audio_path: Path) -> str: ...


class FasterWhisperEngine:
    """Lazily loads one CPU model and serializes inference inside the worker."""

    def __init__(self, settings: TranscriptionSettings):
        self._settings = settings
        self._model: Any | None = None
        self._lock = Lock()

    @property
    def model_loaded(self) -> bool:
        return self._model is not None

    def transcribe(self, audio_path: Path) -> str:
        with self._lock:
            model = self._load_model()
            segments, _ = model.transcribe(
                str(audio_path),
                language=self._settings.language,
                beam_size=5,
                vad_filter=True,
            )
            return join_segments(segments)

    def _load_model(self) -> Any:
        if self._model is None:
            from faster_whisper import WhisperModel

            self._model = WhisperModel(
                self._settings.model,
                device=self._settings.device,
                compute_type=self._settings.compute_type,
            )
        return self._model


def join_segments(segments: Iterable[Any]) -> str:
    return " ".join(
        text for segment in segments if (text := str(segment.text).strip())
    ).strip()
