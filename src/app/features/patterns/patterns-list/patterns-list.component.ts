import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Pattern, CraftType } from '../../../core/models';
import { PatternService } from '../pattern.service';
import { StorageService } from '../storage.service';
import { CategoryService } from '../../categories/category.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import type { Category } from '../../../core/models';

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
  private readonly storageService = inject(StorageService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  protected readonly patterns = signal<Pattern[]>([]);
  protected readonly thumbnailUrls = signal<Record<string, string>>({});
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleteDialogVisible = signal(false);
  protected readonly patternToDelete = signal<Pattern | null>(null);

  protected readonly craftLabels = CRAFT_LABELS;

  protected readonly craftOptions = [
    { label: 'All crafts', value: null },
    ...Object.entries(CRAFT_LABELS).map(([value, label]) => ({ label, value })),
  ];

  protected readonly selectedCategoryIds = signal<string[]>([]);

  protected readonly filterForm = this.fb.group({
    search: [''],
    craft: [null as CraftType | null],
  });

  ngOnInit(): void {
    void this.loadCategories();
    void this.loadPatterns();
    this.filterForm.valueChanges.subscribe(() => void this.loadPatterns());
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

  private async loadPatterns(): Promise<void> {
    this.loading.set(true);
    const { search, craft } = this.filterForm.getRawValue();
    const categoryIds = this.selectedCategoryIds();
    try {
      const patterns = await this.patternService.getAll({
        search: search || undefined,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        craft: craft || undefined,
      });
      this.patterns.set(patterns);
      void this.loadThumbnails(patterns);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load patterns.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  private async loadThumbnails(patterns: Pattern[]): Promise<void> {
    const entries = await Promise.all(
      patterns.map(async (pattern) => {
        try {
          const url = await this.storageService.getUrl(
            this.storageService.thumbnailKey(pattern.s3Key),
          );
          return [pattern.id, url] as const;
        } catch {
          return null;
        }
      }),
    );
    this.thumbnailUrls.set(Object.fromEntries(entries.filter((entry) => entry !== null)));
  }

  protected thumbnailFailed(patternId: string): void {
    this.thumbnailUrls.update((urls) => {
      const { [patternId]: _removed, ...rest } = urls;
      return rest;
    });
  }

  protected toggleCategory(id: string): void {
    this.selectedCategoryIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
    void this.loadPatterns();
  }

  protected clearCategoryFilter(): void {
    this.selectedCategoryIds.set([]);
    void this.loadPatterns();
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

  protected async deleteConfirmed(): Promise<void> {
    const p = this.patternToDelete();
    if (!p) return;
    try {
      await this.patternService.delete(p.id);
      this.patterns.update((list) => list.filter((x) => x.id !== p.id));
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: `"${p.title}" deleted.`,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete pattern.',
      });
    } finally {
      this.deleteDialogVisible.set(false);
      this.patternToDelete.set(null);
    }
  }

  protected cancelDelete(): void {
    this.deleteDialogVisible.set(false);
    this.patternToDelete.set(null);
  }
}
