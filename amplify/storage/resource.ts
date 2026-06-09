import { defineStorage } from '@aws-amplify/backend';
import { resizeFunction } from '../functions/resize/resource';

export const storage = defineStorage({
  name: 'patternaliaStorage',
  triggers: {
    onUpload: resizeFunction,
  },
  access: (allow) => ({
    'patterns/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.resource(resizeFunction).to(['read']),
    ],
    'thumbnails/*': [
      allow.authenticated.to(['read']),
      allow.resource(resizeFunction).to(['read', 'write']),
    ],
  }),
});
