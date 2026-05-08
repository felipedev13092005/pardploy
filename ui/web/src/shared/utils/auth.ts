import { ApiService } from "./api-service";
export interface UserAuth {
  id: number,
  username: string
}
export const AuthService = {
  me: () => ApiService.get<UserAuth>('/auth/me'),
  login: (username: string, password: string) =>
    ApiService.post<UserAuth>('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    ApiService.post<UserAuth>('/auth/register', { username, password }),
  logout: () =>
    ApiService.post('/auth/logout', {}),
  refresh: () =>
    ApiService.post('/auth/refresh', {}),
};
