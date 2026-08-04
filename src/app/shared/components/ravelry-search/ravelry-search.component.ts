import { Component, ChangeDetectionStrategy, inject, signal, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { RavelryService, RavelryPattern } from '../../services/ravelry.service';

@Component({
  selector: 'app-ravelry-search',
  imports: [ButtonModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ravelry-search.component.html',
})
export class RavelrySearchComponent {
  private readonly ravelryService = inject(RavelryService);
  private readonly messageService = inject(MessageService);

  readonly linkedPattern = input<RavelryPattern | null>(null);
  readonly placeholder = input('Search Ravelry…');

  readonly patternLinked = output<RavelryPattern>();
  readonly patternUnlinked = output<void>();

  protected readonly query = signal('');
  protected readonly results = signal<RavelryPattern[]>([]);
  protected readonly searching = signal(false);

  protected onQueryChange(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.results.set([]);
  }

  protected search(): void {
    const q = this.query();
    if (!q.trim()) return;
    this.searching.set(true);
    this.ravelryService.search(q).subscribe({
      next: (res) => {
        this.results.set(res.patterns);
        this.searching.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ravelry search failed.',
        });
        this.searching.set(false);
      },
    });
  }

  protected select(rv: RavelryPattern): void {
    this.results.set([]);
    this.patternLinked.emit(rv);
  }
}
