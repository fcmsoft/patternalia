import { Component, ChangeDetectionStrategy, inject, signal, OnInit, input } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { PatternService } from '../../pattern.service';
import { CategoryService } from '../../../categories/category.service';
import { RavelryService, RavelryPattern } from '../../../../shared/services/ravelry.service';
import { CraftType, DifficultyLevel, Pattern } from '../../../../core/models';
import type { Category } from '../../../../core/models';

@Component({
  selector: 'app-pattern-edit',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    ToastModule,
    MessageModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pattern-edit.component.html',
})
export class PatternEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patternService = inject(PatternService);
  private readonly categoryService = inject(CategoryService);
  private readonly ravelryService = inject(RavelryService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly id = input.required<string>();

  protected readonly pattern = signal<Pattern | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly ravelryQuery = signal('');
  protected readonly ravelryResults = signal<RavelryPattern[]>([]);
  protected readonly ravelrySearching = signal(false);
  protected readonly linkedRavelryPattern = signal<RavelryPattern | null>(null);

  protected readonly craftOptions: { label: string; value: CraftType }[] = [
    { label: 'Knitting', value: 'knitting' },
    { label: 'Crochet', value: 'crochet' },
    { label: 'Embroidery', value: 'embroidery' },
    { label: 'Cross-stitch', value: 'cross-stitch' },
    { label: 'Other', value: 'other' },
  ];

  protected readonly difficultyOptions: { label: string; value: DifficultyLevel }[] = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Easy', value: 'easy' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
    { label: 'Expert', value: 'expert' },
  ];

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    craft: [null as CraftType | null, Validators.required],
    difficulty: [null as DifficultyLevel | null],
    categoryIds: [[] as string[]],
    tagsInput: [''],
    notes: [''],
    pinterestUrl: [''],
    otherLinks: this.fb.array<ReturnType<typeof this.buildLinkGroup>>([]),
  });

  get otherLinks(): FormArray {
    return this.form.get('otherLinks') as FormArray;
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe((cats) => this.categories.set(cats));
    this.patternService.getById(this.id()).subscribe({
      next: (p) => {
        this.pattern.set(p);
        this.form.patchValue({
          title: p.title,
          description: p.description ?? '',
          craft: p.craft,
          difficulty: p.difficulty ?? null,
          categoryIds: p.categoryIds,
          tagsInput: this.formatTags(p.tags ?? []),
          notes: p.notes ?? '',
          pinterestUrl: p.externalLinks.pinterestUrl ?? '',
        });
        (p.externalLinks.otherUrls ?? []).forEach((l) => {
          const g = this.buildLinkGroup();
          g.patchValue(l);
          this.otherLinks.push(g);
        });
        if (p.externalLinks.ravelryId) {
          this.linkedRavelryPattern.set({
            id: Number(p.externalLinks.ravelryId),
            name: p.externalLinks.ravelryUrl ?? 'Ravelry pattern',
            permalink: '',
          });
        }
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

  protected searchRavelry(): void {
    const q = this.ravelryQuery();
    if (!q.trim()) return;
    this.ravelrySearching.set(true);
    this.ravelryService.search(q).subscribe({
      next: (res) => {
        this.ravelryResults.set(res.patterns);
        this.ravelrySearching.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ravelry search failed.',
        });
        this.ravelrySearching.set(false);
      },
    });
  }

  protected linkRavelry(rv: RavelryPattern): void {
    this.linkedRavelryPattern.set(rv);
    this.ravelryResults.set([]);
  }

  protected unlinkRavelry(): void {
    this.linkedRavelryPattern.set(null);
  }

  protected buildLinkGroup() {
    return this.fb.group({
      label: ['', Validators.required],
      url: ['', Validators.required],
    });
  }

  protected addOtherLink(): void {
    this.otherLinks.push(this.buildLinkGroup());
  }

  protected removeOtherLink(i: number): void {
    this.otherLinks.removeAt(i);
  }

  protected parseTags(value: string | null | undefined): string[] {
    return (value ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  protected formatTags(tags: string[]): string {
    return tags.join(', ');
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const rv = this.linkedRavelryPattern();
    const existing = this.pattern();

    this.patternService
      .update(this.id(), {
        title: v.title!,
        description: v.description || undefined,
        craft: v.craft!,
        difficulty: v.difficulty || undefined,
        categoryIds: v.categoryIds ?? [],
        tags: this.parseTags(v.tagsInput),
        notes: v.notes || undefined,
        externalLinks: {
          ravelryId: rv ? String(rv.id) : undefined,
          ravelryUrl: rv?.permalink
            ? `https://www.ravelry.com/patterns/library/${rv.permalink}`
            : (existing?.externalLinks.ravelryUrl ?? undefined),
          pinterestUrl: v.pinterestUrl || undefined,
          otherUrls: (v.otherLinks as { label: string; url: string }[]).filter(
            (l) => l.label && l.url,
          ),
        },
      })
      .subscribe({
        next: () => this.router.navigate(['/patterns', this.id()]),
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save.',
          });
          this.saving.set(false);
        },
      });
  }
}
