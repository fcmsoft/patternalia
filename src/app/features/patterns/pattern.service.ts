import { inject, Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { StorageService } from './storage.service';
import type { Schema } from '../../../../amplify/data/resource';
import {
  Pattern,
  CreatePatternDto,
  UpdatePatternDto,
  CraftType,
  AmplifyPattern,
} from '../../core/models';

export interface PatternFilters {
  /** Patterns matching any of these categories pass the filter. */
  categoryIds?: string[];
  craft?: CraftType;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class PatternService {
  private readonly patternClient = generateClient<Schema>().models.Pattern;
  private readonly authMode = 'userPool' as const;
  private readonly storage = inject(StorageService);

  private getPatternClient() {
    const client = this.patternClient;
    if (!client) {
      throw new Error(
        'Pattern model is not available in Amplify outputs. Run `npx ampx sandbox` (or deploy backend) to sync `amplify_outputs.json`.',
      );
    }
    return client;
  }

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

  private toPattern(model: AmplifyPattern): Pattern {
    return {
      id: model.id,
      title: model.title,
      description: model.description ?? undefined,
      craft: model.craft as CraftType,
      categoryIds: (model.categoryIds ?? []).filter((id): id is string => Boolean(id)),
      s3Key: model.s3Key,
      notes: model.notes ?? undefined,
      ravelryId: model.ravelryId ?? undefined,
      ravelryUrl: model.ravelryUrl ?? undefined,
      otherUrls: (model.otherUrls ?? [])
        .filter((link): link is { label: string; url: string } => Boolean(link?.label && link?.url))
        .map((link) => ({ label: link.label, url: link.url })),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  private toCreateInput(dto: CreatePatternDto): Omit<Schema['Pattern']['createType'], 'id'> {
    return {
      title: dto.title,
      description: dto.description,
      craft: dto.craft,
      categoryIds: dto.categoryIds,
      s3Key: dto.s3Key,
      notes: dto.notes,
      ravelryId: dto.ravelryId,
      ravelryUrl: dto.ravelryUrl,
      otherUrls: dto.otherUrls,
    };
  }

  private toUpdateInput(dto: UpdatePatternDto): Omit<Schema['Pattern']['updateType'], 'id'> {
    return {
      title: dto.title,
      description: dto.description,
      craft: dto.craft,
      categoryIds: dto.categoryIds,
      s3Key: dto.s3Key,
      notes: dto.notes,
      ravelryId: dto.ravelryId,
      ravelryUrl: dto.ravelryUrl,
      otherUrls: dto.otherUrls,
    };
  }

  async getAll(filters?: PatternFilters): Promise<Pattern[]> {
    const result = await this.getPatternClient().list({ authMode: this.authMode });
    if (result.errors && result.errors.length > 0) {
      throw result.errors[0];
    }

    const patterns = result.data.map((item) => this.toPattern(item));
    const search = filters?.search?.trim().toLowerCase();

    return patterns.filter((pattern) => {
      const matchesCategory =
        !filters?.categoryIds?.length ||
        pattern.categoryIds.some((id) => filters.categoryIds!.includes(id));
      const matchesCraft = !filters?.craft || pattern.craft === filters.craft;
      const matchesSearch =
        !search ||
        pattern.title.toLowerCase().includes(search) ||
        (pattern.description ?? '').toLowerCase().includes(search) ||
        (pattern.notes ?? '').toLowerCase().includes(search);

      return matchesCategory && matchesCraft && matchesSearch;
    });
  }

  async getById(id: string): Promise<Pattern> {
    const result = await this.getPatternClient().get({ id }, { authMode: this.authMode });
    return this.toPattern(this.ensureData(result, 'Pattern not found.'));
  }

  async create(dto: CreatePatternDto): Promise<Pattern> {
    const result = await this.getPatternClient().create(
      this.toCreateInput(dto),
      { authMode: this.authMode },
    );
    return this.toPattern(this.ensureData(result, 'Pattern creation returned no data.'));
  }

  async update(id: string, dto: UpdatePatternDto): Promise<Pattern> {
    const result = await this.getPatternClient().update(
      { id, ...this.toUpdateInput(dto) },
      { authMode: this.authMode },
    );
    return this.toPattern(this.ensureData(result, 'Pattern update returned no data.'));
  }

  async delete(id: string): Promise<void> {
    const result = await this.getPatternClient().delete({ id }, { authMode: this.authMode });
    if (result.errors && result.errors.length > 0) {
      throw result.errors[0];
    }

    const s3Key = result.data?.s3Key;
    if (s3Key) {
      await this.storage.removePatternFiles(s3Key);
    }
  }
}
