import { computed, Injectable, signal } from '@angular/core';
import { DemoChildProfile, DemoLoginResponse, DemoUser } from '../models/prototype-auth.model';

const TOKEN_KEY = 'artikulino.prototype.token';
const USER_KEY = 'artikulino.prototype.user';
const CHILD_KEY = 'artikulino.prototype.active-child';

interface ApiMessage {
  readonly message?: string;
}

@Injectable({ providedIn: 'root' })
export class PrototypeAuthService {
  private readonly tokenState = signal(this.readStorage(TOKEN_KEY));
  private readonly userState = signal(this.readJson<DemoUser>(USER_KEY));
  private readonly activeChildState = signal(this.readJson<DemoChildProfile>(CHILD_KEY));

  readonly user = this.userState.asReadonly();
  readonly activeChild = this.activeChildState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState() && this.userState()));
  readonly isParent = computed(() => this.userState()?.role === 'PARENT');
  readonly isTherapist = computed(() => this.userState()?.role === 'THERAPIST');

  async login(email: string, password: string): Promise<DemoUser> {
    const response = await this.apiRequest<DemoLoginResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    this.tokenState.set(response.token);
    this.userState.set(response.user);
    this.activeChildState.set(null);
    this.writeStorage(TOKEN_KEY, response.token);
    this.writeStorage(USER_KEY, JSON.stringify(response.user));
    this.removeStorage(CHILD_KEY);
    return response.user;
  }

  async logout(): Promise<void> {
    try {
      if (this.tokenState()) {
        await this.apiRequest<void>('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Local logout must still succeed when the demonstration server is unavailable.
    } finally {
      this.clearSession();
    }
  }

  async loadChildren(): Promise<readonly DemoChildProfile[]> {
    const response = await this.apiRequest<{ children: readonly DemoChildProfile[] }>(
      '/api/children',
    );
    const selected = this.activeChildState();
    if (selected && !response.children.some((child) => child.id === selected.id)) {
      this.selectChild(null);
    }
    return response.children;
  }

  async createChild(displayName: string): Promise<DemoChildProfile> {
    const response = await this.apiRequest<{ child: DemoChildProfile }>('/api/children', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });
    return response.child;
  }

  async deleteChild(childId: string): Promise<void> {
    await this.apiRequest<void>(`/api/children/${encodeURIComponent(childId)}`, {
      method: 'DELETE',
    });
    if (this.activeChildState()?.id === childId) {
      this.selectChild(null);
    }
  }

  selectChild(child: DemoChildProfile | null): void {
    this.activeChildState.set(child);
    if (child) {
      this.writeStorage(CHILD_KEY, JSON.stringify(child));
    } else {
      this.removeStorage(CHILD_KEY);
    }
  }

  async apiRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
    const response = await this.fetchApiResponse(path, init, authenticated);
    return (response.status === 204 ? undefined : await response.json()) as T;
  }

  async apiBlobRequest(path: string): Promise<Blob> {
    const response = await this.fetchApiResponse(path);
    return response.blob();
  }

  private async fetchApiResponse(
    path: string,
    init: RequestInit = {},
    authenticated = true,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (authenticated) {
      const token = this.tokenState();
      if (!token) {
        throw new Error('Za nastavak je potrebna demo prijava.');
      }
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(path, { ...init, headers });
    if (!response.ok) {
      if (response.status === 401 && authenticated) {
        this.clearSession();
      }
      const body = (await response.json().catch(() => ({}))) as ApiMessage;
      throw new Error(body.message || 'Lokalni prototip trenutačno nije dostupan.');
    }
    return response;
  }

  private clearSession(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.activeChildState.set(null);
    this.removeStorage(TOKEN_KEY);
    this.removeStorage(USER_KEY);
    this.removeStorage(CHILD_KEY);
  }

  private readStorage(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private readJson<T>(key: string): T | null {
    const value = this.readStorage(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      this.removeStorage(key);
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // The in-memory state still supports this localhost-only prototype session.
    }
  }

  private removeStorage(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Nothing else is required when browser storage is unavailable.
    }
  }
}
