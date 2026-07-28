import { TestBed } from '@angular/core/testing';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { TherapistReviewService } from './therapist-review.service';

describe('TherapistReviewService', () => {
  const apiRequest = vi.fn();
  const apiBlobRequest = vi.fn();

  beforeEach(() => {
    apiRequest.mockReset();
    apiBlobRequest.mockReset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PrototypeAuthService,
          useValue: { apiRequest, apiBlobRequest },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('loads therapist session summaries and a selected session detail', async () => {
    apiRequest
      .mockResolvedValueOnce({ sessions: [{ id: 'session-1' }] })
      .mockResolvedValueOnce({ session: { id: 'session-1' } });
    const service = TestBed.inject(TherapistReviewService);

    await expect(service.listSessions()).resolves.toEqual([{ id: 'session-1' }]);
    await expect(service.getSession('session/1')).resolves.toEqual({ id: 'session-1' });

    expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/therapist/sessions');
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/therapist/sessions/session%2F1');
  });

  it('loads protected audio and saves a typed review', async () => {
    const audio = new Blob(['fictional adult recording'], { type: 'audio/webm' });
    apiBlobRequest.mockResolvedValue(audio);
    apiRequest.mockResolvedValue({ attempt: { id: 'attempt-1' } });
    const service = TestBed.inject(TherapistReviewService);

    await expect(service.loadAttemptAudio('attempt-1')).resolves.toBe(audio);
    await expect(
      service.saveReview('attempt-1', 'PRACTICE_AGAIN', 'Ponoviti testni primjer.'),
    ).resolves.toEqual({ id: 'attempt-1' });

    expect(apiBlobRequest).toHaveBeenCalledWith('/api/attempts/attempt-1/audio');
    expect(apiRequest).toHaveBeenCalledWith('/api/attempts/attempt-1/review', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'PRACTICE_AGAIN',
        comment: 'Ponoviti testni primjer.',
      }),
    });
  });
});
