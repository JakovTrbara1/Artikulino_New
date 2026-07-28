import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  const login = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        {
          provide: PrototypeAuthService,
          useValue: { login },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('routes the predefined therapist account directly to therapist review', async () => {
    login.mockResolvedValue({
      id: 'therapist',
      email: 'therapist@artikulino.test',
      role: 'THERAPIST',
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const therapistButton = fixture.nativeElement.querySelectorAll(
      '.demo-choices button',
    )[1] as HTMLButtonElement;
    therapistButton.click();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(login).toHaveBeenCalledWith('therapist@artikulino.test', 'TherapistDemo123!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pregled-terapeuta');
  });
});
