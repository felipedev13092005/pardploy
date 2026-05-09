"use client";

import { Navigate, Outlet, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthService } from "../utils/auth";
import { SystemService } from "../utils/system";

export const PublicGuard = () => {
  const location = useLocation();

  const isRegister = location.pathname === "/register";

  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => AuthService.getStatus(),
    retry: false,
  });

  const { data: requirements, isLoading: reqLoading } = useQuery({
    queryKey: ["system-requirements"],
    queryFn: () => SystemService.getRequirements(),
    retry: false,
  });

  if (authLoading || reqLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  const requirementsMet = requirements
    ? requirements.docker.installed &&
      requirements.docker.ready &&
      requirements.compose.installed &&
      requirements.daemon.running &&
      requirements.port_3000.available
    : false;

  const hasUsers = authStatus?.hasUsers ?? false;

  // /register: redirect if users exist or requirements not met
  if (isRegister) {
    if (!requirementsMet) {
      return <Navigate to="/requirements" replace />;
    }
    if (hasUsers) {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  }

  // /login: redirect based on users and requirements
  if (!hasUsers) {
    return <Navigate to="/register" replace />;
  }

  if (!requirementsMet) {
    return <Navigate to="/requirements" replace />;
  }

  return <Outlet />;
};