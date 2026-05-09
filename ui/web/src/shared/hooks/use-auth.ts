'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiService } from '../utils/api-service'
import { AuthService } from '../utils/auth'

export const useSession = () => {
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading: loading,
    isFetching: caching,
    isError,
  } = useQuery({
    queryKey: ['session'],
    queryFn: AuthService.me,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      AuthService.login(data.username, data.password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session'] }),
  })

  const registerMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      AuthService.register(data.username, data.password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session'] }),
  })

  const logoutMutation = useMutation({
    mutationFn: () => {
      ApiService.skipRefresh = true
      return AuthService.logout()
    },
    onSuccess: () => {
      queryClient.setQueryData(['session'], null)
      queryClient.clear()
    },
    onSettled: () => {
      // Lo reseteamos por si acaso el usuario vuelve a loguearse en la misma sesión
      ApiService.skipRefresh = false
    },
  })

  const refreshMutation = useMutation({
    mutationFn: () => AuthService.refresh(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session'] }),
  })

  return {
    user,
    caching,
    loading,
    session: isError ? false : loading ? undefined : !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    refresh: refreshMutation.mutate,
  }
}
