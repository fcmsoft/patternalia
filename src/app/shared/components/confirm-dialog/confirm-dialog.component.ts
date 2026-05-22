import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  readonly visible = input.required<boolean>();
  readonly title = input<string>('Confirm');
  readonly message = input<string>('Are you sure?');
  readonly confirmLabel = input<string>('Confirm');
  readonly confirmSeverity = input<'danger' | 'success' | 'secondary'>('danger');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
