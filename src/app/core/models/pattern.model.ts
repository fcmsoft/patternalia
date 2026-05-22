export type CraftType = 'knitting' | 'crochet' | 'embroidery' | 'cross-stitch' | 'other';
export type DifficultyLevel = 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'expert';

export interface ExternalLink {
  label: string;
  url: string;
}

export interface PatternExternalLinks {
  ravelryId?: string;
  ravelryUrl?: string;
  pinterestUrl?: string;
  otherUrls?: ExternalLink[];
}

export interface Pattern {
  id: string;
  userId: string;
  title: string;
  description?: string;
  craft: CraftType;
  difficulty?: DifficultyLevel;
  categoryIds: string[];
  s3Key: string;
  tags?: string[];
  notes?: string;
  externalLinks: PatternExternalLinks;
  createdAt: string;
  updatedAt: string;
}

export type CreatePatternDto = Omit<Pattern, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdatePatternDto = Partial<CreatePatternDto>;
