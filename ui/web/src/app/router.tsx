import { createBrowserRouter } from "react-router";
import MainLayout from "./private/(MainLayout)/MainLayout";
import PageDashboard from "./private/(MainLayout)/dashboard/PageDashboard";
import PageProjects from "./private/(MainLayout)/projects/PageProjects";
import PageContainers from "./private/(MainLayout)/containers/PageContainers";
import PageServers from "./private/(MainLayout)/servers/PageServers";
import PageNetworks from "./private/(MainLayout)/networks/PageNetworks";
import PageVolumes from "./private/(MainLayout)/volumes/PageVolumes";
import PageDeployments from "./private/(MainLayout)/deployments/PageDeployments";
import PageLogs from "./private/(MainLayout)/logs/PageLogs";
import PageMetrics from "./private/(MainLayout)/metrics/PageMetrics";
import PageSecrets from "./private/(MainLayout)/secrets/PageSecrets";
import PageSettings from "./private/(MainLayout)/settings/PageSettings";
import { AuthGuard } from "@/shared/guards/AuthGuard";
import MainProviders from "@/shared/providers/MainProviders";
import PageLogin from "./public/PageLogin";
import PageRegister from "./public/PageRegister";
import PageRequirements from "./public/PageRequirements";
import PageNotFound from "./public/PageNotFound";

export const router = createBrowserRouter([
  {
    element: <MainProviders />,
    children: [
      {
        element: <AuthGuard />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { index: true, element: <PageDashboard /> },
              { path: "dashboard", element: <PageDashboard /> },
              { path: "projects", element: <PageProjects /> },
              { path: "containers", element: <PageContainers /> },
              { path: "servers", element: <PageServers /> },
              { path: "networks", element: <PageNetworks /> },
              { path: "volumes", element: <PageVolumes /> },
              { path: "deployments", element: <PageDeployments /> },
              { path: "logs", element: <PageLogs /> },
              { path: "metrics", element: <PageMetrics /> },
              { path: "secrets", element: <PageSecrets /> },
              { path: "settings", element: <PageSettings /> },
            ],
          },
        ],
      },
      {
        path: "/requirements",
        element: <PageRequirements />,
      },
      {
        path: "/login",
        element: <PageLogin />,
      },
      {
        path: "/register",
        element: <PageRegister />,
      },
      {
        path: "/test",
        element: <div>Hello World</div>,
      },
      {
        path: "*",
        element: <PageNotFound />,
      },
    ]
  },
]);