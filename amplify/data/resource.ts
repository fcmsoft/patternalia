import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  OtherUrl: a.customType({
    label: a.string().required(),
    url: a.string().required(),
  }),
  Pattern: a
    .model({
      title: a.string().required(),
      description: a.string(),
      craft: a.string().required(),
      categoryIds: a.string().array(),
      s3Key: a.string().required(),
      notes: a.string(),
      ravelryId: a.string(),
      ravelryUrl: a.string(),
      otherUrls: a.ref('OtherUrl').array(),
    })
    .authorization((allow) => [allow.owner()]),
  Category: a
    .model({
      name: a.string().required(),
      description: a.string(),
      color: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
