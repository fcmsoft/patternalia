import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import outputs from '../../../../amplify_outputs.json';

// amplify_outputs.json gains a `custom` section after sandbox/deploy
type ExtendedOutputs = typeof outputs & { custom?: { ravelryProxyUrl?: string } };

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
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ((outputs as ExtendedOutputs).custom?.ravelryProxyUrl ?? '').replace(
    /\/$/,
    '',
  );

  search(query: string, page = 1): Observable<RavelrySearchResult> {
    const params = new HttpParams().set('query', query).set('page', String(page));
    return this.http.get<RavelrySearchResult>(`${this.baseUrl}/ravelry/search`, { params });
  }

  getPattern(id: number): Observable<{ pattern: RavelryPattern }> {
    return this.http.get<{ pattern: RavelryPattern }>(`${this.baseUrl}/ravelry/patterns/${id}`);
  }
}
