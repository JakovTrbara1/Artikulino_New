from dataclasses import dataclass
import os


@dataclass(frozen=True)
class TranscriptionSettings:
    model: str = "small"
    language: str = "hr"
    device: str = "cpu"
    compute_type: str = "int8"

    @classmethod
    def from_environment(cls) -> "TranscriptionSettings":
        return cls(
            model=os.getenv("ARTIKULINO_WHISPER_MODEL", "small").strip() or "small",
            language="hr",
            device="cpu",
            compute_type="int8",
        )
