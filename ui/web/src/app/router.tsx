import { createBrowserRouter } from "react-router";
import MainLayout from "./private/(MainLayout)/MainLayout";
import PageDashboard from "./private/(MainLayout)/dashboard/PageDashboard";
import { AuthGuard } from "@/shared/guards/AuthGuard";
import MainProviders from "@/shared/providers/MainProviders";

export const router = createBrowserRouter([
  {
    element: <MainProviders />,
    children: [
      {
        // Rutas Protegidas
        element: <AuthGuard />,
        children: [
          {
            path: "/",
            element: <MainLayout />,
            children: [
              { index: true, element: <PageDashboard /> },
              { path: "dashboard", element: <PageDashboard /> },
            ],
          },
        ],
      },
      {
        // Rutas Públicas
        path: "/login",
        element: <div>Página de Login</div>,
      },
      {
        path: "/test",
        element: <div>Hello World</div>,
      },
    ]
  },
]);
