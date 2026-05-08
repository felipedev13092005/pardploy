import { Outlet } from "react-router";
import SidebarAdmin from "./components/SidebarAdmin";
import { SidebarTrigger } from "@/shared/ui/components/ui/sidebar";
import { BreadcrumbNav } from "./components/BreadcrumbNav";
import { UserMenu } from "./components/UserMenu";

export default function MainLayout() {
  return (
    <div className='flex h-screen w-screen overflow-hidden'>
      <SidebarAdmin />

      <div className='flex flex-col flex-1 overflow-hidden'>
        <header className='flex items-center justify-between border-b px-4 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <div className='flex items-center gap-3'>
            <SidebarTrigger />
            <BreadcrumbNav />
          </div>

          <UserMenu />
        </header>

        <main className='flex-1 overflow-auto p-4'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
