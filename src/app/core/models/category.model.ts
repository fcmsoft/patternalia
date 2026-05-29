import type { Schema } from '../../../../amplify/data/resource';

export type Category = Schema['Category']['type'];
export type CreateCategoryDto = Omit<Schema['Category']['createType'], 'id'>;
export type UpdateCategoryDto = Omit<Schema['Category']['updateType'], 'id'>;
