import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RavelryPattern {
  id: number;
  name: string;
  permalink: string;
  pattern_author?: { name: string };
  craft?: { name: string };
  difficulty_average?: number;
  photos?: { medium_url: string }[];
}

export interface RavelrySearchResult {
  patterns: RavelryPattern[];
  paginator: { page: number; page_count: number; results: number };
}

@Injectable({ providedIn: 'root' })
export class RavelryService {
  private readonly api = inject(ApiService);

  search(query: string, page = 1): Observable<RavelrySearchResult> {
    return this.api.get<RavelrySearchResult>('/ravelry/search', {
      query,
      page: String(page),
    });
  }

  getPattern(id: number): Observable<{ pattern: RavelryPattern }> {
    return this.api.get<{ pattern: RavelryPattern }>(`/ravelry/patterns/${id}`);
  }
}
