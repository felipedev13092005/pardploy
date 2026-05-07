import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Outlet } from "react-router"

// Create a client
const queryClient = new QueryClient()
const MainProviders = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />;
    </QueryClientProvider>
  )
}

export default MainProviders
