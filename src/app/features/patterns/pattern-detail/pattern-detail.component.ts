import { Component, ChangeDetectionStrategy, inject, signal, OnInit, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Pattern } from '../../../core/models';
import { PatternService } from '../pattern.service';
import { CategoryService } from '../../categories/category.service';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
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
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pattern-detail.component.html',
})
export class PatternDetailComponent implements OnInit {
  private readonly patternService = inject(PatternService);
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly pattern = signal<Pattern | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleteDialogVisible = signal(false);

  ngOnInit(): void {
    void this.loadCategories();
    this.patternService.getById(this.id()).subscribe({
      next: (p) => {
        this.pattern.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Pattern not found.',
        });
        this.loading.set(false);
      },
    });
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

  protected getCategoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  protected getCategoryColor(id: string): string {
    return this.categories().find((c) => c.id === id)?.color ?? '#6366f1';
  }

  protected deleteConfirmed(): void {
    const p = this.pattern();
    if (!p) return;
    this.patternService.delete(p.id).subscribe({
      next: () => this.router.navigate(['/patterns']),
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete.',
        }),
    });
  }
}
