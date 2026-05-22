import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
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
import { StorageService } from '../../../../shared/services/storage.service';
import { RavelryService, RavelryPattern } from '../../../../shared/services/ravelry.service';
import { CraftType, DifficultyLevel } from '../../../../core/models';
import type { Category } from '../../../../core/models';

@Component({
  selector: 'app-pattern-upload',
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
  templateUrl: './pattern-upload.component.html',
})
export class PatternUploadComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patternService = inject(PatternService);
  private readonly categoryService = inject(CategoryService);
  private readonly storageService = inject(StorageService);
  private readonly ravelryService = inject(RavelryService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
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
  }

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid file',
        detail: 'Only PDF files are accepted.',
      });
      return;
    }
    this.selectedFile.set(file);
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

  protected linkRavelry(pattern: RavelryPattern): void {
    this.linkedRavelryPattern.set(pattern);
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

  async submit(): Promise<void> {
    if (this.form.invalid || !this.selectedFile()) return;
    this.saving.set(true);

    const patternId = uuidv4();
    const file = this.selectedFile()!;
    const rv = this.linkedRavelryPattern();

    try {
      // 1. Get presigned S3 upload URL
      this.uploading.set(true);
      const { uploadUrl, s3Key } = await new Promise<{ uploadUrl: string; s3Key: string }>(
        (resolve, reject) =>
          this.storageService
            .getUploadUrl(patternId, file.name)
            .subscribe({ next: resolve, error: reject }),
      );

      // 2. Upload PDF to S3
      await new Promise<void>((resolve, reject) =>
        this.storageService.uploadFile(uploadUrl, file).subscribe({ next: resolve, error: reject }),
      );
      this.uploading.set(false);

      // 3. Save pattern metadata
      const v = this.form.getRawValue();
      await new Promise<void>((resolve, reject) =>
        this.patternService
          .create({
            title: v.title!,
            description: v.description || undefined,
            craft: v.craft!,
            difficulty: v.difficulty || undefined,
            categoryIds: v.categoryIds ?? [],
            s3Key,
            tags: this.parseTags(v.tagsInput),
            notes: v.notes || undefined,
            externalLinks: {
              ravelryId: rv ? String(rv.id) : undefined,
              ravelryUrl: rv
                ? `https://www.ravelry.com/patterns/library/${rv.permalink}`
                : undefined,
              pinterestUrl: v.pinterestUrl || undefined,
              otherUrls: (v.otherLinks as { label: string; url: string }[]).filter(
                (l) => l.label && l.url,
              ),
            },
          })
          .subscribe({ next: () => resolve(), error: reject }),
      );

      this.router.navigate(['/patterns']);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Upload failed. Please try again.',
      });
      this.saving.set(false);
      this.uploading.set(false);
    }
  }
}
