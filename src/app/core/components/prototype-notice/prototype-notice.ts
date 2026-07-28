import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-prototype-notice',
  templateUrl: './prototype-notice.html',
  styleUrl: './prototype-notice.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrototypeNotice {}
