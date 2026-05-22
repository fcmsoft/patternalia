import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center" role="status">
      <span class="text-5xl mb-4" aria-hidden="true">{{ icon() }}</span>
      <h2 class="text-lg font-semibold text-gray-700 mb-1">{{ title() }}</h2>
      <p class="text-sm text-gray-500 max-w-sm">{{ message() }}</p>
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('📂');
  readonly title = input<string>('Nothing here yet');
  readonly message = input<string>('');
}
