import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Pattern, CreatePatternDto, UpdatePatternDto, CraftType } from '../../core/models';

export interface PatternFilters {
  categoryId?: string;
  craft?: CraftType;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class PatternService {
  private readonly api = inject(ApiService);

  getAll(filters?: PatternFilters): Observable<Pattern[]> {
    const params: Record<string, string> = {};
    if (filters?.categoryId) params['categoryId'] = filters.categoryId;
    if (filters?.craft) params['craft'] = filters.craft;
    if (filters?.search) params['search'] = filters.search;
    return this.api.get<Pattern[]>('/patterns', params);
  }

  getById(id: string): Observable<Pattern> {
    return this.api.get<Pattern>(`/patterns/${id}`);
  }

  create(dto: CreatePatternDto): Observable<Pattern> {
    return this.api.post<Pattern>('/patterns', dto);
  }

  update(id: string, dto: UpdatePatternDto): Observable<Pattern> {
    return this.api.put<Pattern>(`/patterns/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/patterns/${id}`);
  }
}
