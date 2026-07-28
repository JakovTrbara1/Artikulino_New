import { TestBed } from '@angular/core/testing';
import { DEMO_CONTENT_PACKAGES } from '../../features/games/data/demo-content-packages';
import { PrototypeAuthService } from './prototype-auth.service';
import { PrototypeSessionService } from './prototype-session.service';

describe('PrototypeSessionService', () => {
  const apiRequest = vi.fn();
  const apiBlobRequest = vi.fn();
  const activeChild = vi.fn().mockReturnValue({ id: 'child-1', displayName: 'Luka' });

  beforeEach(() => {
    apiRequest.mockReset();
    apiBlobRequest.mockReset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PrototypeAuthService,
          useValue: { apiRequest, apiBlobRequest, activeChild },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates a game session for the active fictional child', async () => {
    apiRequest.mockResolvedValue({ session: { id: 'session-1' } });
    const service = TestBed.inject(PrototypeSessionService);

    await service.create(DEMO_CONTENT_PACKAGES[0]);

    expect(apiRequest).toHaveBeenCalledWith(
      '/api/sessions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"childId":"child-1"'),
      }),
    );
  });

  it('uploads a typed recording as multipart data and surfaces failures for retry', async () => {
    apiRequest.mockRejectedValue(new Error('Spremanje nije dostupno.'));
    const service = TestBed.inject(PrototypeSessionService);
    const blob = new Blob(['fictional adult recording'], { type: 'audio/webm' });

    await expect(
      service.uploadAttempt(
        'session-1',
        {
          blob,
          mimeType: 'audio/webm',
          durationMs: 1_500,
          questionId: 'question-1',
          attemptNumber: 2,
        },
        'kruška',
      ),
    ).rejects.toThrow('Spremanje nije dostupno.');

    const body = apiRequest.mock.calls[0][1].body as FormData;
    expect(body.get('questionId')).toBe('question-1');
    expect(body.get('attemptNumber')).toBe('2');
    expect(body.get('expectedText')).toBe('kruška');
    expect(body.get('audio')).toBeInstanceOf(Blob);
  });

  it('loads recording audio through the authenticated API boundary', async () => {
    const audio = new Blob(['fictional adult recording'], { type: 'audio/webm' });
    apiBlobRequest.mockResolvedValue(audio);
    const service = TestBed.inject(PrototypeSessionService);

    await expect(service.loadAttemptAudio('attempt/1')).resolves.toBe(audio);
    expect(apiBlobRequest).toHaveBeenCalledWith('/api/attempts/attempt%2F1/audio');
  });
});
