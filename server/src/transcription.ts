import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const DEFAULT_WORKER_URL = 'http://127.0.0.1:8000';
const DEFAULT_TRANSCRIPTION_TIMEOUT_MS = 15 * 60 * 1000;
const HEALTH_TIMEOUT_MS = 2_000;

export interface TranscriptionJob {
  readonly attemptId: string;
  readonly audioPath: string;
  readonly mimeType: string;
  readonly expectedText: string;
}

export interface TranscriptionRequest {
  readonly audioPath: string;
  readonly mimeType: string;
}

export interface TranscriptionWorkerHealth {
  readonly status: 'AVAILABLE' | 'UNAVAILABLE';
  readonly model?: string;
  readonly language?: string;
  readonly device?: string;
  readonly computeType?: string;
  readonly modelLoaded?: boolean;
}

export interface TranscriptionClient {
  health(): Promise<TranscriptionWorkerHealth>;
  transcribe(request: TranscriptionRequest): Promise<string>;
}

interface WorkerHealthResponse {
  readonly status?: unknown;
  readonly model?: unknown;
  readonly language?: unknown;
  readonly device?: unknown;
  readonly compute_type?: unknown;
  readonly model_loaded?: unknown;
}

interface WorkerTranscriptionResponse {
  readonly transcript?: unknown;
}

export class LocalTranscriptionClient implements TranscriptionClient {
  constructor(
    private readonly baseUrl = process.env['TRANSCRIPTION_WORKER_URL'] ?? DEFAULT_WORKER_URL,
    private readonly timeoutMs = numberEnvironment(
      'TRANSCRIPTION_TIMEOUT_MS',
      DEFAULT_TRANSCRIPTION_TIMEOUT_MS,
    ),
  ) {}

  async health(): Promise<TranscriptionWorkerHealth> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      if (!response.ok) {
        return { status: 'UNAVAILABLE' };
      }
      const body = (await response.json()) as WorkerHealthResponse;
      if (body.status !== 'ok') {
        return { status: 'UNAVAILABLE' };
      }
      return {
        status: 'AVAILABLE',
        ...(typeof body.model === 'string' ? { model: body.model } : {}),
        ...(typeof body.language === 'string' ? { language: body.language } : {}),
        ...(typeof body.device === 'string' ? { device: body.device } : {}),
        ...(typeof body.compute_type === 'string' ? { computeType: body.compute_type } : {}),
        ...(typeof body.model_loaded === 'boolean' ? { modelLoaded: body.model_loaded } : {}),
      };
    } catch {
      return { status: 'UNAVAILABLE' };
    }
  }

  async transcribe(request: TranscriptionRequest): Promise<string> {
    const audio = await readFile(request.audioPath);
    const form = new FormData();
    form.append(
      'audio',
      new Blob([new Uint8Array(audio)], { type: request.mimeType }),
      basename(request.audioPath),
    );
    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Local transcription worker returned ${response.status}.`);
    }
    const body = (await response.json()) as WorkerTranscriptionResponse;
    if (typeof body.transcript !== 'string') {
      throw new Error('Local transcription worker returned an invalid response.');
    }
    return body.transcript.trim();
  }
}

export class SerialTranscriptionQueue {
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;

  enqueue(task: () => Promise<void>): void {
    this.pending += 1;
    this.tail = this.tail
      .then(task, task)
      .catch(() => undefined)
      .finally(() => {
        this.pending -= 1;
      });
  }

  pendingCount(): number {
    return this.pending;
  }

  async waitForIdle(): Promise<void> {
    await this.tail;
  }
}

export function normalizeForTextMatch(value: string): string {
  return value
    .normalize('NFC')
    .toLocaleLowerCase('hr-HR')
    .replace(/\p{P}+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function textMatchPercentage(expectedText: string, transcript: string): number {
  const expected = Array.from(normalizeForTextMatch(expectedText));
  const recognized = Array.from(normalizeForTextMatch(transcript));
  if (recognized.length === 0 || expected.length === 0) {
    return 0;
  }
  if (expected.join('') === recognized.join('')) {
    return 100;
  }
  const distance = levenshteinDistance(expected, recognized);
  const longest = Math.max(expected.length, recognized.length);
  return Math.max(0, Math.min(100, Math.round((1 - distance / longest) * 100)));
}

function levenshteinDistance(left: readonly string[], right: readonly string[]): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + substitutionCost,
      );
    }
    previous = current;
  }
  return previous[right.length] ?? 0;
}

function numberEnvironment(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
