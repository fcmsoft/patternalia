import { Injectable } from '@angular/core';
import type { Schema } from '../../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categoryClient = generateClient<Schema>().models.Category;

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

  async getAll(): Promise<Category[]> {
    const result = await this.categoryClient.list({ authMode: 'userPool' });
    if (result.errors && result.errors.length > 0) {
      throw result.errors[0];
    }

    return result.data;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const result = await this.categoryClient.create(dto, { authMode: 'userPool' });
    return this.ensureData(result, 'Category creation returned no data.');
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const result = await this.categoryClient.update({ id, ...dto }, { authMode: 'userPool' });
    return this.ensureData(result, 'Category update returned no data.');
  }

  async delete(id: string): Promise<void> {
    const result = await this.categoryClient.delete({ id }, { authMode: 'userPool' });
    if (result.errors && result.errors.length > 0) {
      throw result.errors[0];
    }
  }
}
