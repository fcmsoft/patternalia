import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { from, map, Observable } from 'rxjs';
import type { Schema } from '../../../../amplify/data/resource';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly client = generateClient<Schema>();

  private ensureData<T>(
    result: { data: T | null; errors?: readonly unknown[] | undefined },
    fallbackError: string,
  ): T {
    if (result.errors && result.errors.length > 0) {
      throw result.errors[0];
    }

    if (result.data === null) {
      throw new Error(fallbackError);
    }

    return result.data;
  }

  getAll(): Observable<Category[]> {
    return from(this.client.models.Category.list()).pipe(
      map((result) => {
        if (result.errors && result.errors.length > 0) {
          throw result.errors[0];
        }

        return result.data;
      }),
    );
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return from(this.client.models.Category.create(dto)).pipe(
      map((result) => this.ensureData(result, 'Category creation returned no data.')),
    );
  }

  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return from(this.client.models.Category.update({ id, ...dto })).pipe(
      map((result) => this.ensureData(result, 'Category update returned no data.')),
    );
  }

  delete(id: string): Observable<void> {
    return from(this.client.models.Category.delete({ id })).pipe(
      map((result) => {
        if (result.errors && result.errors.length > 0) {
          throw result.errors[0];
        }

        return void 0;
      }),
    );
  }
}
