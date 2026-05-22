import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [header]="title()"
      [visible]="visible()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '400px' }"
      (onHide)="cancelled.emit()"
      role="alertdialog"
      [attr.aria-labelledby]="'confirm-dialog-title'"
      [attr.aria-describedby]="'confirm-dialog-msg'"
    >
      <p id="confirm-dialog-msg" class="text-gray-700">{{ message() }}</p>
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <button
            pButton
            type="button"
            label="Cancel"
            severity="secondary"
            (click)="cancelled.emit()"
          ></button>
          <button
            pButton
            type="button"
            [label]="confirmLabel()"
            [severity]="confirmSeverity()"
            (click)="confirmed.emit()"
          ></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
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
