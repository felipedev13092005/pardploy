import { config } from '../config/config'
import { throwHttpError } from '../errors'

export class ApiService {
  static skipRefresh = false

  private static async executeRefresh(): Promise<void> {
    const res = await fetch(`${config.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error('Refresh token invalid')
    }
  }

  private static async request<T>(method: string, url: string, body?: any, isRetry = false): Promise<T> {
    const response = await fetch(`${config.API_URL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const isAuthPath = url.includes('/auth/login') || url.includes('/auth/refresh')
      if (response.status === 401 && !isRetry && !isAuthPath && !ApiService.skipRefresh) {
        try {
          await ApiService.executeRefresh()
          return await ApiService.request<T>(method, url, body, true)
        } catch {
          throwHttpError(401, 'Tu sesión ha expirado, vuelve a entrar.')
        }
      }
      const json = await response.json().catch(() => ({}))
      throwHttpError(response.status as any, json.error ?? 'Error en la petición')
    }

    return response.json() as Promise<T>
  }

  static get<T>(url: string) {
    return ApiService.request<T>('GET', url)
  }
  static post<T>(url: string, body?: any) {
    return ApiService.request<T>('POST', url, body)
  }
  static put<T>(url: string, body: any) {
    return ApiService.request<T>('PUT', url, body)
  }
  static patch<T>(url: string, body: any) {
    return ApiService.request<T>('PATCH', url, body)
  }
  static delete<T>(url: string) {
    return ApiService.request<T>('DELETE', url)
  }
}
