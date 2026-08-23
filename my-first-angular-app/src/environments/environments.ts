/**
 * Derives the backend API URL from the current host, so the SPA on a tenant
 * subdomain (e.g. `acme.localhost:4200`) sends requests with `Host:
 * acme.localhost` and resolves to the correct tenant on the backend. A
 * hardcoded `localhost` would always resolve to the default tenant
 * regardless of which subdomain the SPA is served from.
 */
export function resolveApiUrl(hostname: string): string {
  return `http://${hostname}:8081/api/v1`;
}

export const environment = {
  production: false,
  apiUrl: resolveApiUrl(window.location.hostname),
};
