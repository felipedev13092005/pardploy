export const AuthService = {
  me: () => globalThis.fetch('/auth/me', {
    credentials: 'include',
  }),
  login: (username: string, password: string) =>
    globalThis.fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    }),
  register: (username: string, password: string) =>
    globalThis.fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    }),
  logout: () =>
    globalThis.fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }),
  refresh: () =>
    globalThis.fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    }),
};
