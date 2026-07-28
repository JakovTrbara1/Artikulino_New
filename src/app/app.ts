import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrototypeNotice } from './core/components/prototype-notice/prototype-notice';
import { Header } from './core/layout/header/header';

@Component({
  selector: 'app-root',
  imports: [Header, PrototypeNotice, RouterOutlet],
  template: `
    <a class="skip-link" href="#main-content">Preskoči na sadržaj</a>
    <app-prototype-notice />
    <app-header />
    <main id="main-content" tabindex="-1">
      <router-outlet />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
