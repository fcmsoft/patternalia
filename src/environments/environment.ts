export const environment = {
  production: false,
  apiUrl: 'https://YOUR_API_GATEWAY_URL/dev',
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
