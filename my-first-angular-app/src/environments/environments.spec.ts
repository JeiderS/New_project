import { describe, expect, it } from 'vitest';
import { environment, resolveApiUrl } from './environments';

describe('resolveApiUrl', () => {
  it('derives the API URL from a tenant subdomain hostname', () => {
    expect(resolveApiUrl('acme.localhost')).toBe('http://acme.localhost:8081/api/v1');
  });

  it('derives the API URL from the default hostname', () => {
    expect(resolveApiUrl('localhost')).toBe('http://localhost:8081/api/v1');
  });

  it('derives a different API URL for a different tenant subdomain', () => {
    expect(resolveApiUrl('globex.localhost')).toBe('http://globex.localhost:8081/api/v1');
  });
});

describe('environment', () => {
  it('apiUrl is derived from the current window.location.hostname', () => {
    expect(environment.apiUrl).toBe(`http://${window.location.hostname}:8081/api/v1`);
  });
});
