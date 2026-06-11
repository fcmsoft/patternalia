import { defineFunction } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const functionDir = path.dirname(fileURLToPath(import.meta.url));

// sharp and @napi-rs/canvas ship native binaries and pdfjs-dist dynamically
// imports @napi-rs/canvas, so none of them can go through esbuild. They stay
// external and are installed for the Lambda platform (linux x64, glibc) into
// the bundle after esbuild runs.
const nativeDeps = ['sharp@0.34.5', '@napi-rs/canvas@1.0.0', 'pdfjs-dist@6.0.227'];

export const resizeFunction = defineFunction(
  (scope) =>
    new NodejsFunction(scope, 'resize', {
      entry: path.join(functionDir, 'handler.ts'),
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
      memorySize: 1024,
      bundling: {
        format: OutputFormat.ESM,
        externalModules: ['@aws-sdk/*', 'sharp', '@napi-rs/canvas', 'pdfjs-dist', 'pdfjs-dist/*'],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (inputDir: string, outputDir: string) => [
            `npm install --prefix "${outputDir}" --no-save --no-package-lock --os=linux --cpu=x64 --libc=glibc ${nativeDeps.join(' ')}`,
          ],
        },
      },
    }),
  // Grouped with storage to avoid a circular dependency between the function
  // stack and the bucket that both triggers it and grants it access.
  { resourceGroupName: 'storage' },
);
