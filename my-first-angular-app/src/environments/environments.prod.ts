/**
 * Production build variant, swapped in via angular.json's `fileReplacements`
 * for the `production` configuration.
 *
 * Fixed by Judgment Day implementation round 1 (Judge B, WARNING): design.md
 * decided production should call the API same-origin (`/api/v1`), not an
 * absolute `http://<hostname>:8081` URL — that port is a local dev-only
 * convenience. A relative path lets the browser resolve it against whatever
 * origin served the SPA, which is what "same-origin" means in production
 * (the API is expected to be reverse-proxied under the same host).
 */
export const environment = {
  production: true,
  apiUrl: '/api/v1',
};
