import type { PreSignUpTriggerHandler } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (event) => {
  const email = (event.request.userAttributes.email ?? '').trim().toLowerCase();
  const allowedDomains = new Set(['gmail.com', 'outlook.com']);

  const domain = email.split('@')[1] ?? '';
  if (!allowedDomains.has(domain)) {
    throw new Error('Only emails from gmail.com and outlook.com are allowed.');
  }
  return event;
};
