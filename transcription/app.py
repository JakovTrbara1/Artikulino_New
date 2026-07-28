import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import AsyncIterator

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from .config import TranscriptionSettings
from .engine import FasterWhisperEngine, TranscriptionEngine

MAX_AUDIO_BYTES = 10 * 1024 * 1024
SUPPORTED_AUDIO_TYPES = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
}


class HealthResponse(BaseModel):
    status: str
    model: str
    language: str
    device: str
    compute_type: str
    model_loaded: bool


class TranscriptionResponse(BaseModel):
    transcript: str
    language: str


def create_app(
    engine: TranscriptionEngine | None = None,
    settings: TranscriptionSettings | None = None,
) -> FastAPI:
    active_settings = settings or TranscriptionSettings.from_environment()
    active_engine = engine or FasterWhisperEngine(active_settings)
    inference_lock = asyncio.Lock()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        application.state.engine = active_engine
        yield

    application = FastAPI(
        title="Artikulino Local Croatian Transcription",
        version="0.1.0",
        lifespan=lifespan,
    )

    @application.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            model=active_settings.model,
            language=active_settings.language,
            device=active_settings.device,
            compute_type=active_settings.compute_type,
            model_loaded=active_engine.model_loaded,
        )

    @application.post("/transcribe", response_model=TranscriptionResponse)
    async def transcribe(audio: UploadFile = File(...)) -> TranscriptionResponse:
        content_type = normalized_content_type(audio.content_type)
        suffix = SUPPORTED_AUDIO_TYPES.get(content_type)
        if not suffix:
            raise HTTPException(status_code=415, detail="Unsupported audio format.")

        content = await audio.read(MAX_AUDIO_BYTES + 1)
        if not content:
            raise HTTPException(status_code=400, detail="Audio file is empty.")
        if len(content) > MAX_AUDIO_BYTES:
            raise HTTPException(status_code=413, detail="Audio file exceeds 10 MB.")

        temporary_path = write_temporary_audio(content, suffix)
        try:
            async with inference_lock:
                transcript = await run_in_threadpool(
                    active_engine.transcribe, temporary_path
                )
        except Exception as error:
            raise HTTPException(
                status_code=503, detail="Local transcription failed."
            ) from error
        finally:
            temporary_path.unlink(missing_ok=True)

        return TranscriptionResponse(
            transcript=transcript.strip(),
            language=active_settings.language,
        )

    return application


def normalized_content_type(value: str | None) -> str:
    return (value or "").split(";", 1)[0].strip().lower()


def write_temporary_audio(content: bytes, suffix: str) -> Path:
    with NamedTemporaryFile(
        mode="wb", suffix=suffix, prefix="artikulino-", delete=False
    ) as file:
        file.write(content)
        return Path(file.name)


app = create_app()
