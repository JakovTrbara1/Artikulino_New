import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrototypeAuthService } from './prototype-auth.service';

describe('PrototypeAuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('stores the bearer session and selected fictional child in sessionStorage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            token: 'demo-token',
            expiresAt: Date.now() + 60_000,
            user: { id: 'parent', email: 'parent@artikulino.test', role: 'PARENT' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    const service = TestBed.inject(PrototypeAuthService);

    await service.login('parent@artikulino.test', 'ParentDemo123!');
    service.selectChild({ id: 'child-1', displayName: 'Luka' });

    expect(service.isParent()).toBe(true);
    expect(service.activeChild()?.displayName).toBe('Luka');
    expect(sessionStorage.getItem('artikulino.prototype.token')).toBe('demo-token');
    expect(sessionStorage.getItem('artikulino.prototype.active-child')).toContain('Luka');
  });

  it('clears local session state after an unauthorized API response', async () => {
    sessionStorage.setItem('artikulino.prototype.token', 'expired-token');
    sessionStorage.setItem(
      'artikulino.prototype.user',
      JSON.stringify({ id: 'parent', email: 'parent@artikulino.test', role: 'PARENT' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Prijava je istekla.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const service = TestBed.inject(PrototypeAuthService);

    await expect(service.loadChildren()).rejects.toThrow('Prijava je istekla.');
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('artikulino.prototype.token')).toBeNull();
  });

  it('loads protected audio with the current bearer token', async () => {
    sessionStorage.setItem('artikulino.prototype.token', 'demo-token');
    sessionStorage.setItem(
      'artikulino.prototype.user',
      JSON.stringify({ id: 'parent', email: 'parent@artikulino.test', role: 'PARENT' }),
    );
    const audio = new Blob(['fictional adult recording'], { type: 'audio/webm' });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(audio, { status: 200, headers: { 'Content-Type': 'audio/webm' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const service = TestBed.inject(PrototypeAuthService);

    const result = await service.apiBlobRequest('/api/attempts/attempt-1/audio');

    expect(result.type).toBe('audio/webm');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/attempts/attempt-1/audio',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const requestHeaders = fetchMock.mock.calls[0][1].headers as Headers;
    expect(requestHeaders.get('Authorization')).toBe('Bearer demo-token');
  });
});
