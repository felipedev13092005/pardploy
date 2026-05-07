"use client";

import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "../hooks/use-auth";

export const AuthGuard = () => {
  const { session, loading } = useSession();
  const location = useLocation();

  // 1. Mientras verifica la cookie/token, mostramos un loader
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando sesión...</p>
      </div>
    );
  }

  // 2. Si no hay sesión, redirigimos al login
  // Guardamos 'state' para que tras loguearse pueda volver a donde intentaba ir
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Si hay sesión, renderizamos las rutas hijas
  return <Outlet />;
};
