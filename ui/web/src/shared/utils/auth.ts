import { ApiService } from "./api-service";

export const AuthService = {
  me: () => ApiService.get('/auth/me'),
  login: (username: string, password: string) =>
    ApiService.post('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    ApiService.post('/auth/register', { username, password }),
  logout: () =>
    ApiService.post('/auth/logout', {}),
  refresh: () =>
    ApiService.post('/auth/refresh', {}),
};
