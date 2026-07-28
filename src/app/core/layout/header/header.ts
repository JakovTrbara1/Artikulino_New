import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { PrototypeAuthService } from '../../services/prototype-auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly menuOpen = signal(false);

  constructor(
    protected readonly auth: PrototypeAuthService,
    private readonly router: Router,
  ) {}

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected async logout(): Promise<void> {
    this.closeMenu();
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}
