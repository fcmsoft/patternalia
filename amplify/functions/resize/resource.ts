import { defineFunction } from '@aws-amplify/backend';

export const resizeFunction = defineFunction({
  name: 'resize',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
});
