export type DemoRole = 'PARENT' | 'THERAPIST';

export interface DemoUser {
  readonly id: string;
  readonly email: string;
  readonly role: DemoRole;
}

export interface DemoChildProfile {
  readonly id: string;
  readonly displayName: string;
}

export interface DemoLoginResponse {
  readonly token: string;
  readonly expiresAt: number;
  readonly user: DemoUser;
}
