import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Outlet } from "react-router"

// ✅ Fuera del componente → se crea una sola vez
const queryClient = new QueryClient()

const MainProviders = () => {
  return (
    // ✅ QueryClientProvider por fuera, SidebarProvider por dentro
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}

export default MainProviders
