export const environment = {
  amplify: {
    Auth: {
      Cognito: {
        userPoolId: 'YOUR_USER_POOL_ID',
        userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID',
        loginWith: {
          email: true,
        },
      },
    },
  },
};
