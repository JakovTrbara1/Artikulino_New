import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DemoChildProfile } from '../../../core/models/prototype-auth.model';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';

@Component({
  selector: 'app-profiles-page',
  imports: [ReactiveFormsModule],
  templateUrl: './profiles.page.html',
  styleUrl: './profiles.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilesPage implements OnInit {
  protected readonly auth = inject(PrototypeAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly children = signal<readonly DemoChildProfile[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly displayName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(50)],
  });

  async ngOnInit(): Promise<void> {
    await this.refreshChildren();
  }

  protected async selectChild(child: DemoChildProfile): Promise<void> {
    this.auth.selectChild(child);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    await this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/igre');
  }

  protected async createChild(): Promise<void> {
    if (this.displayName.invalid || this.busy()) {
      this.displayName.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.errorMessage.set('');
    try {
      const child = await this.auth.createChild(this.displayName.value);
      this.children.update((children) =>
        [...children, child].sort((first, second) =>
          first.displayName.localeCompare(second.displayName, 'hr'),
        ),
      );
      this.displayName.reset();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Profil nije dodan.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async deleteChild(child: DemoChildProfile): Promise<void> {
    if (!confirm(`Izbrisati profil „${child.displayName}”?`)) {
      return;
    }
    this.errorMessage.set('');
    try {
      await this.auth.deleteChild(child.id);
      this.children.update((children) => children.filter((item) => item.id !== child.id));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Profil nije izbrisan.');
    }
  }

  private async refreshChildren(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.children.set(await this.auth.loadChildren());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Profili nisu dostupni.');
      if (!this.auth.isAuthenticated()) {
        await this.router.navigate(['/prijava']);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
