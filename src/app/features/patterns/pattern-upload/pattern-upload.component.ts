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
import { PatternService } from '../pattern.service';
import { CategoryService } from '../../categories/category.service';
import { StorageService } from '../storage.service';
import { RavelrySearchComponent } from '../../../shared/components/ravelry-search/ravelry-search.component';
import { RavelryPattern } from '../../../shared/services/ravelry.service';
import { CraftType } from '../../../core/models';
import type { Category } from '../../../core/models';

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
    RavelrySearchComponent,
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
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
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
    void this.loadCategories();
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
    if (file && !this.form.controls.title.value) {
      const title = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      this.form.controls.title.setValue(title);
    }
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

  async submit(): Promise<void> {
    if (this.form.invalid || !this.selectedFile()) return;
    this.saving.set(true);

    const file = this.selectedFile()!;
    const rv = this.linkedRavelryPattern();

    try {
      this.uploading.set(true);
      const s3Key = await this.storageService.upload(file);
      console.log('File uploaded to S3 with key:', s3Key);
      this.uploading.set(false);

      // 3. Save pattern metadata
      const v = this.form.getRawValue();
      await this.patternService.create({
        title: v.title!,
        description: v.description || undefined,
        craft: v.craft!,
        categoryIds: v.categoryIds ?? [],
        s3Key,
        notes: v.notes || undefined,
        ravelryId: rv ? String(rv.id) : undefined,
        ravelryUrl: rv ? `https://www.ravelry.com/patterns/library/${rv.permalink}` : undefined,
        otherUrls: (v.otherLinks as { label: string; url: string }[]).filter(
          (l) => l.label && l.url,
        ),
      });

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
