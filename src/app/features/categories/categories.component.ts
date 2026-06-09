import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Category, CreateCategoryDto } from '../../core/models';
import { CategoryService } from './category.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-categories',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ColorPickerModule,
    ToastModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly dialogVisible = signal(false);
  protected readonly deleteDialogVisible = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingCategory = signal<Category | null>(null);
  protected readonly categoryToDelete = signal<Category | null>(null);

  protected readonly dialogTitle = computed(() =>
    this.editingCategory() ? 'Edit category' : 'New category',
  );

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    description: [''],
    color: ['#6366f1'],
  });

  ngOnInit(): void {
    void this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    this.loading.set(true);
    try {
      const cats = await this.categoryService.getAll();
      this.categories.set(cats);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load categories.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreate(): void {
    this.editingCategory.set(null);
    this.form.reset({ color: '#6366f1' });
    this.dialogVisible.set(true);
  }

  protected openEdit(category: Category): void {
    this.editingCategory.set(category);
    this.form.setValue({
      name: category.name,
      description: category.description ?? '',
      color: category.color ?? '#6366f1',
    });
    this.dialogVisible.set(true);
  }

  protected closeDialog(): void {
    this.dialogVisible.set(false);
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    const dto: CreateCategoryDto = {
      name: value.name!,
      description: value.description || undefined,
      color: value.color || undefined,
    };
    const editing = this.editingCategory();
    const request = editing
      ? this.categoryService.update(editing.id, dto)
      : this.categoryService.create(dto);

    try {
      const saved = await request;
      if (editing) {
        this.categories.update((cats) => cats.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        this.categories.update((cats) => [...cats, saved]);
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: `Category "${saved.name}" saved.`,
      });
      this.dialogVisible.set(false);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save category.',
      });
    } finally {
      this.saving.set(false);
    }
  }

  protected confirmDelete(category: Category): void {
    this.categoryToDelete.set(category);
    this.deleteDialogVisible.set(true);
  }

  protected async deleteConfirmed(): Promise<void> {
    const cat = this.categoryToDelete();
    if (!cat) return;
    try {
      await this.categoryService.delete(cat.id);
      this.categories.update((cats) => cats.filter((c) => c.id !== cat.id));
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: `"${cat.name}" deleted.`,
      });
      this.categoryToDelete.set(null);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete category.',
      });
    } finally {
      this.deleteDialogVisible.set(false);
    }
  }

  protected cancelDelete(): void {
    this.deleteDialogVisible.set(false);
    this.categoryToDelete.set(null);
  }
}
