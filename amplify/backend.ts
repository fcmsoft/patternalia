import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { resizeFunction } from './functions/resize/resource';
import { ravelryFunction } from './functions/ravelry/resource';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';

const backend = defineBackend({
  auth,
  data,
  storage,
  resizeFunction,
  ravelryFunction,
});

backend.storage.resources.bucket.addEventNotification(
  // OBJECT_CREATED covers both single PUT and multipart uploads; Amplify's
  // uploadData switches to multipart for larger files.
  EventType.OBJECT_CREATED,
  new LambdaDestination(backend.resizeFunction.resources.lambda),
  {
    prefix: 'patterns/',
  },
);

const ravelryFnUrl = backend.ravelryFunction.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.GET],
    allowedHeaders: ['authorization', 'content-type'],
  },
});

backend.addOutput({
  custom: { ravelryProxyUrl: ravelryFnUrl.url },
});
