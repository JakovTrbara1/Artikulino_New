import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(PrototypeAuthService);

  protected readonly busy = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['parent@artikulino.test', [Validators.required, Validators.email]],
    password: ['ParentDemo123!', Validators.required],
  });

  protected useParentDemo(): void {
    this.form.setValue({
      email: 'parent@artikulino.test',
      password: 'ParentDemo123!',
    });
  }

  protected useTherapistDemo(): void {
    this.form.setValue({
      email: 'therapist@artikulino.test',
      password: 'TherapistDemo123!',
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.errorMessage.set('');
    try {
      const user = await this.auth.login(
        this.form.controls.email.value,
        this.form.controls.password.value,
      );
      const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (user.role === 'THERAPIST') {
        await this.router.navigateByUrl(
          requestedUrl?.startsWith('/pregled-terapeuta') ? requestedUrl : '/pregled-terapeuta',
        );
      } else {
        await this.router.navigate(['/profili'], {
          queryParams: requestedUrl ? { returnUrl: requestedUrl } : undefined,
        });
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Prijava nije uspjela.');
    } finally {
      this.busy.set(false);
    }
  }
}
