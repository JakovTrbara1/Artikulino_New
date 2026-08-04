import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { PracticeRoundResult } from '../../models/practice-round-result.model';

@Component({
  selector: 'app-practice-result-dialog',
  templateUrl: './practice-result-dialog.html',
  styleUrl: './practice-result-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeResultDialog implements OnInit {
  readonly pending = input(false);
  readonly result = input<PracticeRoundResult | null>(null);
  readonly retryRequested = output<void>();
  readonly continueRequested = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  protected readonly isCompleted = computed(() => this.result()?.status === 'COMPLETED');
  protected readonly title = computed(() => {
    const percentage = this.result()?.percentage ?? 0;
    if (percentage >= 90) {
      return 'Fantastično!';
    }
    if (percentage >= 70) {
      return 'Sjajan pokušaj!';
    }
    if (percentage >= 40) {
      return 'Lijepo napreduješ!';
    }
    return 'Svaki pokušaj vrijedi!';
  });
  protected readonly encouragement = computed(() => {
    const percentage = this.result()?.percentage ?? 0;
    if (percentage >= 90) {
      return 'Tekst se gotovo potpuno podudara. Nastavi tako!';
    }
    if (percentage >= 70) {
      return 'Još malo vježbe i bit će još bolje.';
    }
    if (percentage >= 40) {
      return 'Poslušaj primjer još jednom ili kreni dalje.';
    }
    return 'Možeš pokušati ponovno ili nastaviti na sljedeći krug.';
  });

  ngOnInit(): void {
    queueMicrotask(() => this.dialog().nativeElement.focus());
  }
}
