import { Component, ChangeDetectionStrategy, input, signal, effect, inject } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-pdf-viewer',
  imports: [PdfViewerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pdf-viewer.component.html',
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
