# IntelliJ IDEA Run Configurations

These configurations run the localhost-only thesis prototype from IntelliJ IDEA without changing
the application architecture. Use only fictional profiles and fictional or adult-generated test
recordings.

## Prerequisites

From the project root, install the JavaScript dependencies and create the Python environment:

```bash
npm install
npm --prefix server install
py -3.11 -m venv transcription/.venv
.\transcription\.venv\Scripts\python.exe -m pip install -r transcription/requirements-dev.txt
```

## 1. Angular application

Create **Run | Edit Configurations | + | npm**:

- Name: `Artikulino - Angular`
- `package.json`: the project-root `package.json`
- Command: `run`
- Scripts: `start`
- Node interpreter: project default

Expected URL: `http://localhost:4200`.

## 2. Express prototype API

Create another **npm** configuration:

- Name: `Artikulino - Express API`
- `package.json`: the project-root `package.json`
- Command: `run`
- Scripts: `server:start`
- Node interpreter: project default

Expected health endpoint: `http://localhost:3000/api/health`.

## 3. Croatian transcription worker

Create **Run | Edit Configurations | + | Python**:

- Name: `Artikulino - Croatian transcription`
- Run: `Module name`
- Module name: `uvicorn`
- Parameters: `transcription.app:app --host 127.0.0.1 --port 8000`
- Python interpreter:
  `<project>\transcription\.venv\Scripts\python.exe`
- Working directory: the project root

The default model is `small`. For a lighter local smoke test, add the environment variable
`ARTIKULINO_WHISPER_MODEL=tiny`. The first run downloads the selected model.

Expected health endpoint: `http://127.0.0.1:8000/health`.

## 4. Start all services

Create **Run | Edit Configurations | + | Compound**:

- Name: `Artikulino - Full prototype`
- Add:
  - `Artikulino - Croatian transcription`;
  - `Artikulino - Express API`;
  - `Artikulino - Angular`.

Start the compound configuration, wait for all three health checks, then open
`http://localhost:4200`.

## Quality and reset configurations

Create two additional **npm** configurations using the project-root `package.json`:

- `Artikulino - Full quality gate`: command `run`, script `prototype:check`;
- `Artikulino - Reset demo data`: command `run`, script `prototype:reset`.

Reset removes the Git-ignored runtime database and test recordings, invalidates demo sessions, and
reseeds the predefined parent, therapist, Luka, and Mia demo data.
