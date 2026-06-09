import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'patternaliaStorage',
  access: (allow) => ({
    'patterns/*': [allow.authenticated.to(['read', 'write', 'delete'])],
  }),
});
