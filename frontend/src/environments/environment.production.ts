// Used for production builds (`ng build`). Relative path because nginx (see
// frontend/nginx.conf) proxies /api/* to the backend container in Docker Compose.
export const environment = {
  production: true,
  apiUrl: '/api',
};
