import { describe, expect, it } from 'vitest';
import {
  SerialTranscriptionQueue,
  normalizeForTextMatch,
  textMatchPercentage,
} from '../src/transcription.js';

describe('Croatian transcript matching', () => {
  it('normalizes case, punctuation, and whitespace while preserving diacritics', () => {
    expect(normalizeForTextMatch('  Četiri,   ŽABE!  ')).toBe('četiri žabe');
    expect(normalizeForTextMatch('C i Č')).not.toBe(normalizeForTextMatch('C i C'));
  });

  it('returns an integer Levenshtein similarity without pronunciation claims', () => {
    expect(textMatchPercentage('Kruška', 'kruška')).toBe(100);
    expect(textMatchPercentage('žaba', '')).toBe(0);
    expect(textMatchPercentage('', '')).toBe(0);
    expect(textMatchPercentage('maca', 'masa')).toBe(75);
    expect(Number.isInteger(textMatchPercentage('dobra kuća', 'dobra kuća'))).toBe(true);
  });
});

describe('serial transcription queue', () => {
  it('processes CPU work one task at a time and survives failures', async () => {
    const queue = new SerialTranscriptionQueue();
    const events: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstBlocked = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    queue.enqueue(async () => {
      events.push('first-start');
      await firstBlocked;
      events.push('first-end');
    });
    queue.enqueue(async () => {
      events.push('second');
      throw new Error('fictional worker failure');
    });
    queue.enqueue(async () => {
      events.push('third');
    });

    await Promise.resolve();
    expect(events).toEqual(['first-start']);
    expect(queue.pendingCount()).toBe(3);
    releaseFirst?.();
    await queue.waitForIdle();

    expect(events).toEqual(['first-start', 'first-end', 'second', 'third']);
    expect(queue.pendingCount()).toBe(0);
  });
});
