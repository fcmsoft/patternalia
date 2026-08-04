import { defineFunction, secret } from '@aws-amplify/backend';

export const ravelryFunction = defineFunction({
  name: 'ravelry',
  entry: './handler.ts',
  runtime: 22,
  timeoutSeconds: 29,
  environment: {
    RAVELRY_ACCESS_KEY: secret('RAVELRY_ACCESS_KEY'),
    RAVELRY_SECRET_KEY: secret('RAVELRY_SECRET_KEY'),
  },
});
