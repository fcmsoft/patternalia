import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  input,
  output,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { PatternService } from '../../pattern.service';
import { RavelryService, RavelryPattern } from '../../../../shared/services/ravelry.service';
import { CraftType, Pattern } from '../../../../core/models';
import type { Category } from '../../../../core/models';

/**
 * Inline edit form for the pattern detail side panel. Relies on the parent's
 * MessageService/p-toast for error feedback.
 */
@Component({
  selector: 'app-pattern-edit-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, MultiSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pattern-edit-form.component.html',
})
export class PatternEditFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patternService = inject(PatternService);
  private readonly ravelryService = inject(RavelryService);
  private readonly messageService = inject(MessageService);

  readonly pattern = input.required<Pattern>();
  readonly categories = input<Category[]>([]);
  readonly saved = output<Pattern>();
  readonly cancelled = output<void>();

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

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    craft: [null as CraftType | null, Validators.required],
    categoryIds: [[] as string[]],
    notes: [''],
    otherLinks: this.fb.array<ReturnType<typeof this.buildLinkGroup>>([]),
  });

  get otherLinks(): FormArray {
    return this.form.get('otherLinks') as FormArray;
  }

  ngOnInit(): void {
    const p = this.pattern();
    this.form.patchValue({
      title: p.title,
      description: p.description ?? '',
      craft: p.craft,
      categoryIds: p.categoryIds,
      notes: p.notes ?? '',
    });
    (p.otherUrls ?? []).forEach((l) => {
      const g = this.buildLinkGroup();
      g.patchValue(l);
      this.otherLinks.push(g);
    });
    if (p.ravelryId) {
      this.linkedRavelryPattern.set({
        id: Number(p.ravelryId),
        name: p.ravelryUrl ?? 'Ravelry pattern',
        permalink: '',
      });
    }
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

  protected async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const rv = this.linkedRavelryPattern();
    const existing = this.pattern();
    try {
      const updated = await this.patternService.update(existing.id, {
        title: v.title!,
        description: v.description || undefined,
        craft: v.craft!,
        categoryIds: v.categoryIds ?? [],
        notes: v.notes || undefined,
        ravelryId: rv ? String(rv.id) : undefined,
        ravelryUrl: rv?.permalink
          ? `https://www.ravelry.com/patterns/library/${rv.permalink}`
          : (existing.ravelryUrl ?? undefined),
        otherUrls: (v.otherLinks as { label: string; url: string }[]).filter(
          (l) => l.label && l.url,
        ),
      });
      this.saved.emit(updated);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save.',
      });
    } finally {
      this.saving.set(false);
    }
  }
}
