import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPackage } from '../../models/content-package.model';

@Component({
  selector: 'app-game-completion',
  imports: [RouterLink],
  templateUrl: './game-completion.html',
  styleUrl: './game-completion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCompletion implements OnInit {
  readonly contentPackage = input.required<ContentPackage>();
  readonly totalPoints = input.required<number>();
  readonly averageTextMatch = input.required<number>();
  readonly recordingCount = input.required<number>();
  readonly correctAnswers = input.required<number>();
  readonly longestStreak = input.required<number>();
  readonly persistenceMessage = input('');
  readonly restartRequested = output<void>();

  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  ngOnInit(): void {
    queueMicrotask(() => this.heading().nativeElement.focus());
  }
}
