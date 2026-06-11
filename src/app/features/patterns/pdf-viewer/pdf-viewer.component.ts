import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { NgxExtendedPdfViewerModule, NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-pdf-viewer',
  imports: [NgxExtendedPdfViewerModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent {
  private readonly pdfService = inject(NgxExtendedPdfViewerService);

  readonly url = input.required<string | null>();
  readonly saving = input(false);
  readonly save = output<Blob>();

  protected readonly exporting = signal(false);

  protected async saveProgress(): Promise<void> {
    this.exporting.set(true);
    try {
      const blob = await this.pdfService.getCurrentDocumentAsBlob();
      if (blob) {
        this.save.emit(blob);
      }
    } finally {
      this.exporting.set(false);
    }
  }
}
