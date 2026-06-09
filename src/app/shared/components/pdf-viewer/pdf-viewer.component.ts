import { Component, ChangeDetectionStrategy, input, signal, effect, inject } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { StorageService } from '../../../features/patterns/storage.service';

@Component({
  selector: 'app-pdf-viewer',
  imports: [PdfViewerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent {
  private readonly storage = inject(StorageService);

  readonly s3Key = input.required<string>();

  protected readonly pdfUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      void this.storage.getUrl(this.s3Key()).then((url) => this.pdfUrl.set(url));
    });
  }
}
