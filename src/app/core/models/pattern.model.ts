import type { Schema } from '../../../../amplify/data/resource';
export type CraftType = 'knitting' | 'crochet' | 'embroidery' | 'cross-stitch' | 'other';

export type AmplifyPattern = Schema['Pattern']['type'];

export interface ExternalLink {
  label: string;
  url: string;
}

export interface Pattern {
  id: string;
  title: string;
  description?: string;
  craft: CraftType;
  categoryIds: string[];
  s3Key: string;
  notes?: string;
  ravelryId?: string;
  ravelryUrl?: string;
  otherUrls?: ExternalLink[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePatternDto {
  title: string;
  description?: string;
  craft: CraftType;
  categoryIds: string[];
  s3Key: string;
  notes?: string;
  ravelryId?: string;
  ravelryUrl?: string;
  otherUrls?: ExternalLink[];
}

export type UpdatePatternDto = Partial<CreatePatternDto>;
