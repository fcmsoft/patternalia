import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Pattern, CraftType } from '../../../../core/models';
import { PatternService } from '../../pattern.service';
import { CategoryService } from '../../../categories/category.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import type { Category } from '../../../../core/models';

const CRAFT_LABELS: Record<CraftType, string> = {
  knitting: 'Knitting',
  crochet: 'Crochet',
  embroidery: 'Embroidery',
  'cross-stitch': 'Cross-stitch',
  other: 'Other',
};

@Component({
  selector: 'app-patterns-list',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patterns-list.component.html',
})
export class PatternsListComponent implements OnInit {
  private readonly patternService = inject(PatternService);
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  protected readonly patterns = signal<Pattern[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleteDialogVisible = signal(false);
  protected readonly patternToDelete = signal<Pattern | null>(null);

  protected readonly craftLabels = CRAFT_LABELS;

  protected readonly craftOptions = [
    { label: 'All crafts', value: null },
    ...Object.entries(CRAFT_LABELS).map(([value, label]) => ({ label, value })),
  ];

  protected readonly filterForm = this.fb.group({
    search: [''],
    categoryId: [null as string | null],
    craft: [null as CraftType | null],
  });

  ngOnInit(): void {
    void this.loadCategories();
    this.loadPatterns();
    this.filterForm.valueChanges.subscribe(() => this.loadPatterns());
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

  private loadPatterns(): void {
    this.loading.set(true);
    const { search, categoryId, craft } = this.filterForm.getRawValue();
    this.patternService
      .getAll({
        search: search || undefined,
        categoryId: categoryId || undefined,
        craft: craft || undefined,
      })
      .subscribe({
        next: (patterns) => {
          this.patterns.set(patterns);
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load patterns.',
          });
          this.loading.set(false);
        },
      });
  }

  protected getCategoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  protected getCategoryColor(id: string): string {
    return this.categories().find((c) => c.id === id)?.color ?? '#6366f1';
  }

  protected confirmDelete(pattern: Pattern): void {
    this.patternToDelete.set(pattern);
    this.deleteDialogVisible.set(true);
  }

  protected deleteConfirmed(): void {
    const p = this.patternToDelete();
    if (!p) return;
    this.patternService.delete(p.id).subscribe({
      next: () => {
        this.patterns.update((list) => list.filter((x) => x.id !== p.id));
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `"${p.title}" deleted.`,
        });
        this.deleteDialogVisible.set(false);
        this.patternToDelete.set(null);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete pattern.',
        });
        this.deleteDialogVisible.set(false);
      },
    });
  }

  protected cancelDelete(): void {
    this.deleteDialogVisible.set(false);
    this.patternToDelete.set(null);
  }
}
