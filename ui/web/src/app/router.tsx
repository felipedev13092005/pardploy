import { createBrowserRouter } from "react-router";
import MainLayout from "./private/(MainLayout)/MainLayout";
import PageDashboard from "./private/(MainLayout)/dashboard/PageDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />, // El padre
    children: [
      {
        index: true, // Esto hace que se vea al entrar a "/"
        element: <PageDashboard />,
      },
      {
        path: "dashboard", // Se verá en "/dashboard"
        element: <PageDashboard />,
      },
    ],
  },
  {
    path: "/test",
    element: <div>Hello World</div>,
  },
]);
