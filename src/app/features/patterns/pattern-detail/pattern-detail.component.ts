import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Pattern } from '../../../core/models';
import { PatternService } from '../pattern.service';
import { CategoryService } from '../../categories/category.service';
import { StorageService } from '../storage.service';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PatternEditFormComponent } from './pattern-edit-form/pattern-edit-form.component';
import type { Category } from '../../../core/models';

@Component({
  selector: 'app-pattern-detail',
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    ToastModule,
    PdfViewerComponent,
    ConfirmDialogComponent,
    PatternEditFormComponent,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pattern-detail.component.html',
})
export class PatternDetailComponent implements OnInit {
  private readonly patternService = inject(PatternService);
  private readonly categoryService = inject(CategoryService);
  private readonly storageService = inject(StorageService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  /** Bound from the `?edit=1` query param to open the page in edit mode. */
  readonly edit = input<string>();

  protected readonly editing = signal(false);
  protected readonly pattern = signal<Pattern | null>(null);
  protected readonly pdfUrl = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleteDialogVisible = signal(false);
  protected readonly savingAnnotations = signal(false);
  protected readonly panelVisible = signal(true);

  protected readonly patternCategories = computed(() => {
    const cats = this.categories();
    return (this.pattern()?.categoryIds ?? []).map((id) => {
      const cat = cats.find((c) => c.id === id);
      return { id, name: cat?.name ?? id, color: cat?.color ?? '#6366f1' };
    });
  });

  ngOnInit(): void {
    this.editing.set(Boolean(this.edit()));
    void this.loadCategories();
    void this.loadPattern();
  }

  private async loadPattern(): Promise<void> {
    try {
      const p = await this.patternService.getById(this.id());
      this.pattern.set(p);
      // Prefer the user's annotated copy (highlights, notes) when one exists.
      const annotatedUrl = await this.storageService.getUrlIfExists(
        this.storageService.annotatedKey(p.s3Key),
      );
      this.pdfUrl.set(annotatedUrl ?? (await this.storageService.getUrl(p.s3Key)));
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Pattern not found.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      const cats = await this.categoryService.getAll();
      this.categories.set(cats);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load categories.',
      });
    }
  }

  protected async saveAnnotatedPdf(blob: Blob): Promise<void> {
    const p = this.pattern();
    if (!p) return;
    this.savingAnnotations.set(true);
    try {
      await this.storageService.uploadBlob(
        this.storageService.annotatedKey(p.s3Key),
        blob,
        'application/pdf',
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Progress saved',
        detail: 'Your highlights and notes were saved.',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save your progress.',
      });
    } finally {
      this.savingAnnotations.set(false);
    }
  }

  protected onEditSaved(updated: Pattern): void {
    this.pattern.set(updated);
    this.editing.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Pattern updated.',
    });
  }

  protected async deleteConfirmed(): Promise<void> {
    const p = this.pattern();
    if (!p) return;
    try {
      await this.patternService.delete(p.id);
      void this.router.navigate(['/patterns']);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete.',
      });
    }
  }
}
