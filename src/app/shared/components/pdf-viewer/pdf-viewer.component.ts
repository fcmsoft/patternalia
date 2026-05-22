import { Component, ChangeDetectionStrategy, input, signal, effect, inject } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-pdf-viewer',
  imports: [PdfViewerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-full min-h-96" role="region" aria-label="PDF viewer">
      @if (pdfUrl()) {
        <pdf-viewer
          [src]="pdfUrl()!"
          [render-text]="true"
          [original-size]="false"
          [fit-to-page]="true"
          style="width: 100%; height: 100%;"
        />
      } @else {
        <div class="flex items-center justify-center h-96 bg-gray-100 rounded" aria-live="polite">
          <span class="text-gray-400 text-sm">Loading PDF…</span>
        </div>
      }
    </div>
  `,
})
export class PdfViewerComponent {
  private readonly storage = inject(StorageService);

  readonly patternId = input.required<string>();

  protected readonly pdfUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.patternId();
      this.storage.getViewUrl(id).subscribe((url) => this.pdfUrl.set(url));
    });
  }
}
