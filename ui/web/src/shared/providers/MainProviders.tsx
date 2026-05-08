import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Outlet } from "react-router"
import { SidebarProvider } from "../ui/components/ui/sidebar"

// Create a client
const queryClient = new QueryClient()
const MainProviders = () => {
  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <Outlet />;
      </QueryClientProvider>
    </SidebarProvider>
  )
}

export default MainProviders
