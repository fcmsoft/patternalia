import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { resizeFunction } from './functions/resize/resource';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  resizeFunction,
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
