import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.api.post<Category>('/categories', dto);
  }

  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.api.put<Category>(`/categories/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/categories/${id}`);
  }
}
