# Local Croatian Transcription Worker

## Boundary

This FastAPI worker is only for the localhost master’s-thesis prototype and fictional or
adult-generated test recordings. Express is its only application client; the browser never calls
the worker directly.

The worker returns a Croatian transcript. Express separately calculates `Podudarnost teksta`
between the expected text and transcript. Neither value is a pronunciation score, diagnosis, or
clinical conclusion, and neither affects game points.

## Requirements

- Python 3.11 or 3.12;
- enough free disk space for the selected Whisper model and Python environment;
- FFmpeg available on `PATH` is recommended for audio diagnostics and format conversion.

`faster-whisper` decodes supported audio through PyAV, which bundles FFmpeg libraries, so this
worker does not directly execute the standalone `ffmpeg` command. If FFmpeg is installed, verify it
with:

```powershell
ffmpeg -version
```

## Windows setup

From the repository root:

```powershell
py -3.11 -m venv transcription/.venv
.\transcription\.venv\Scripts\python.exe -m pip install --upgrade pip
.\transcription\.venv\Scripts\python.exe -m pip install -r transcription/requirements-dev.txt
```

Run the worker:

```powershell
.\transcription\.venv\Scripts\python.exe -m uvicorn transcription.app:app --host 127.0.0.1 --port 8000
```

The first real transcription downloads the default `small` model to the normal Hugging Face cache.
That first request can take several minutes. Later starts reuse the local cache.

For a lighter development-only model:

```powershell
$env:ARTIKULINO_WHISPER_MODEL = "tiny"
.\transcription\.venv\Scripts\python.exe -m uvicorn transcription.app:app --host 127.0.0.1 --port 8000
```

The approved default remains `small`. Inference always uses Croatian (`hr`), CPU, and `int8`.
Express uses `http://127.0.0.1:8000` by default. Developers may override it with
`TRANSCRIPTION_WORKER_URL`; `TRANSCRIPTION_TIMEOUT_MS` overrides the default 15-minute first-request
timeout.

## Endpoints

- `GET /health` reports configured model, language, device, compute type, and whether the model has
  been loaded.
- `POST /transcribe` accepts one supported multipart `audio` file up to 10 MB.

The worker binds to `127.0.0.1:8000` in the documented command. Do not expose it publicly.

## Tests

Tests use a fake engine and do not download a Whisper model:

```powershell
.\transcription\.venv\Scripts\python.exe -m pytest transcription
```

For the final smoke test, use only a fictional adult-generated Croatian recording.
