import { createBrowserRouter } from "react-router";
import MainLayout from "./private/(MainLayout)/MainLayout";
import PageDashboard from "./private/(MainLayout)/dashboard/PageDashboard";
import { AuthGuard } from "@/shared/guards/AuthGuard";
import MainProviders from "@/shared/providers/MainProviders";
import PageLogin from "./public/PageLogin";

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
        element: <PageLogin />,
      },
      {
        path: "/test",
        element: <div>Hello World</div>,
      },
    ]
  },
]);
