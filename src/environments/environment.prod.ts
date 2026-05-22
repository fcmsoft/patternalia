export const environment = {
  production: true,
  apiUrl: 'https://YOUR_API_GATEWAY_URL/prod',
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
