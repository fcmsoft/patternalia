import { Injectable } from '@angular/core';
import type { Schema } from '../../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
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

  async getAll(): Promise<Category[]> {
    const result = await this.client.models.Category.list();
    if (result.errors && result.errors.length > 0) {
      throw result.errors[0];
    }

    return result.data;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const result = await this.client.models.Category.create(dto);
    return this.ensureData(result, 'Category creation returned no data.');
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const result = await this.client.models.Category.update({ id, ...dto });
    return this.ensureData(result, 'Category update returned no data.');
  }

  async delete(id: string): Promise<void> {
    const result = await this.client.models.Category.delete({ id });
    if (result.errors && result.errors.length > 0) {
      throw result.errors[0];
    }
  }
}
