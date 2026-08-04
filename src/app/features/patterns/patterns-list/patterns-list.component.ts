import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, EMPTY, from } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
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

// A freshly uploaded pattern has no thumbnail until the resize lambda runs
// (a few seconds). When a thumbnail is missing for a pattern this young we
// poll for it so it appears without a page refresh.
const THUMBNAIL_RETRY_WINDOW_MS = 5 * 60 * 1000;
const THUMBNAIL_RETRY_DELAY_MS = 3000;
const THUMBNAIL_MAX_RETRIES = 10;

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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly patterns = signal<Pattern[]>([]);
  protected readonly thumbnailUrls = signal<Record<string, string>>({});
  private readonly thumbnailRetries = new Map<string, number>();
  private readonly pendingRetryTimers = new Set<ReturnType<typeof setTimeout>>();
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

  private readonly refresh$ = new Subject<void>();

  constructor() {
    this.destroyRef.onDestroy(() => this.pendingRetryTimers.forEach(clearTimeout));

    this.refresh$
      .pipe(
        tap(() => this.loading.set(true)),
        switchMap(() =>
          from(this.fetchPatterns()).pipe(
            catchError(() => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load patterns.',
              });
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ patterns, thumbnails }) => {
        this.patterns.set(patterns);
        this.thumbnailUrls.set(thumbnails);
        this.loading.set(false);
      });
  }

  ngOnInit(): void {
    void this.loadCategories();
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh$.next());
    this.refresh$.next();
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

  private async fetchPatterns(): Promise<{ patterns: Pattern[]; thumbnails: Record<string, string> }> {
    const { search, craft } = this.filterForm.getRawValue();
    const categoryIds = this.selectedCategoryIds();
    const patterns = await this.patternService.getAll({
      search: search || undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      craft: craft || undefined,
    });
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
    return {
      patterns,
      thumbnails: Object.fromEntries(entries.filter((entry) => entry !== null)),
    };
  }

  protected thumbnailFailed(patternId: string): void {
    this.thumbnailUrls.update((urls) => {
      const { [patternId]: _removed, ...rest } = urls;
      return rest;
    });
    this.scheduleThumbnailRetry(patternId);
  }

  private scheduleThumbnailRetry(patternId: string): void {
    const pattern = this.patterns().find((p) => p.id === patternId);
    if (!pattern?.createdAt) return;
    const age = Date.now() - new Date(pattern.createdAt).getTime();
    if (!Number.isFinite(age) || age > THUMBNAIL_RETRY_WINDOW_MS) return;

    const attempts = this.thumbnailRetries.get(patternId) ?? 0;
    if (attempts >= THUMBNAIL_MAX_RETRIES) return;
    this.thumbnailRetries.set(patternId, attempts + 1);

    const timer = setTimeout(() => {
      this.pendingRetryTimers.delete(timer);
      void this.retryThumbnail(patternId);
    }, THUMBNAIL_RETRY_DELAY_MS);
    this.pendingRetryTimers.add(timer);
  }

  private async retryThumbnail(patternId: string): Promise<void> {
    const pattern = this.patterns().find((p) => p.id === patternId);
    if (!pattern) return;
    const url = await this.storageService.getUrlIfExists(
      this.storageService.thumbnailKey(pattern.s3Key),
    );
    if (url) {
      this.thumbnailRetries.delete(patternId);
      this.thumbnailUrls.update((urls) => ({ ...urls, [patternId]: url }));
    } else {
      this.scheduleThumbnailRetry(patternId);
    }
  }

  protected toggleCategory(id: string): void {
    this.selectedCategoryIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
    this.refresh$.next();
  }

  protected clearCategoryFilter(): void {
    this.selectedCategoryIds.set([]);
    this.refresh$.next();
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
