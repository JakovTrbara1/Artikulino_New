from pathlib import Path

from fastapi.testclient import TestClient

from transcription.app import create_app
from transcription.config import TranscriptionSettings
from transcription.engine import join_segments


class FakeEngine:
    def __init__(self, transcript: str = "kruška"):
        self.transcript = transcript
        self.paths: list[Path] = []

    @property
    def model_loaded(self) -> bool:
        return False

    def transcribe(self, audio_path: Path) -> str:
        self.paths.append(audio_path)
        assert audio_path.exists()
        return self.transcript


def test_reports_model_health_without_loading_model() -> None:
    application = create_app(
        engine=FakeEngine(),
        settings=TranscriptionSettings(model="tiny"),
    )
    with TestClient(application) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "model": "tiny",
        "language": "hr",
        "device": "cpu",
        "compute_type": "int8",
        "model_loaded": False,
    }


def test_transcribes_supported_audio_and_removes_temporary_file() -> None:
    engine = FakeEngine("  žaba  ")
    with TestClient(create_app(engine=engine)) as client:
        response = client.post(
            "/transcribe",
            files={"audio": ("adult-test.webm", b"fictional test audio", "audio/webm")},
        )

    assert response.status_code == 200
    assert response.json() == {"transcript": "žaba", "language": "hr"}
    assert len(engine.paths) == 1
    assert not engine.paths[0].exists()


def test_rejects_empty_unsupported_and_oversized_audio() -> None:
    with TestClient(create_app(engine=FakeEngine())) as client:
        unsupported = client.post(
            "/transcribe", files={"audio": ("test.aac", b"audio", "audio/aac")}
        )
        empty = client.post(
            "/transcribe", files={"audio": ("test.webm", b"", "audio/webm")}
        )
        oversized = client.post(
            "/transcribe",
            files={
                "audio": (
                    "test.webm",
                    b"x" * (10 * 1024 * 1024 + 1),
                    "audio/webm",
                )
            },
        )

    assert unsupported.status_code == 415
    assert empty.status_code == 400
    assert oversized.status_code == 413


def test_reports_engine_failure_without_exposing_details() -> None:
    class FailingEngine(FakeEngine):
        def transcribe(self, audio_path: Path) -> str:
            raise RuntimeError("private engine detail")

    with TestClient(create_app(engine=FailingEngine())) as client:
        response = client.post(
            "/transcribe", files={"audio": ("test.webm", b"audio", "audio/webm")}
        )

    assert response.status_code == 503
    assert response.json() == {"detail": "Local transcription failed."}
    assert "private engine detail" not in response.text


def test_joins_nonempty_whisper_segments() -> None:
    class Segment:
        def __init__(self, text: str):
            self.text = text

    assert join_segments([Segment("  dobra "), Segment(""), Segment(" kuća ")]) == (
        "dobra kuća"
    )
