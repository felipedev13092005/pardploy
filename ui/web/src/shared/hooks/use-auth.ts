
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  // -------- POST /auth/refresh --------
  const refreshMutation = useMutation({
    mutationFn: () => AuthService.refresh(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  return {
    user,
    loading,
    caching,
    session: isError ? false : loading || caching ? undefined : user ? true : false,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refresh: refreshMutation.mutateAsync,
  };
};

