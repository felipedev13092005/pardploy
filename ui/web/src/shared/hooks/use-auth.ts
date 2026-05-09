
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "../utils/auth";


export const useSession = () => {
  const queryClient = useQueryClient();

  // -------- GET /auth/me --------
  const {
    data: user,
    isLoading: loading,
    isFetching: caching,
    isError,
  } = useQuery({
    queryKey: ["session"],
    queryFn: AuthService.me,
    retry: false,
  });

  // -------- POST /auth/login --------
  const loginMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      AuthService.login(data.username, data.password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  // -------- POST /auth/register --------
  const registerMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      AuthService.register(data.username, data.password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  // -------- POST /auth/logout --------
  const logoutMutation = useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['session'], null)  // 👈 no refetchea, limpia directo
      queryClient.clear()                          // limpia todo el cache
    },
  })

  // -------- POST /auth/refresh --------
  const refreshMutation = useMutation({
    mutationFn: () => AuthService.refresh(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

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
};

