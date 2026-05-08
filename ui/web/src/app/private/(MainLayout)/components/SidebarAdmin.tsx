import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton } from '@/shared/ui/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/components/ui/tooltip'
import { Armchair, Boxes, Calendar, History, LayoutDashboard, LayoutGrid, MapPin, Package, Tags } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { SidebarUser } from './SidebarUser'

const items = [
  {
    title: 'Dashboard',
    url: '/private/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Categorias',
    url: '/private/categories',
    icon: Tags,
  },
  {
    title: 'Productos',
    url: '/private/products',
    icon: Package,
  },
  {
    title: 'Inventario',
    url: '/private/inventory',
    icon: Boxes,
  },
  {
    title: 'Transacciones',
    url: '/private/transactions',
    icon: History,
  },
  {
    title: 'Zonas',
    url: '/private/areas',
    icon: MapPin,
  },
  {
    title: 'Mesas',
    url: '/private/tables',
    icon: Armchair,
  },
  {
    title: 'Pedidos',
    url: '/private/orders',
    icon: LayoutGrid,
  },
  {
    title: 'Eventos',
    url: '/private/events',
    icon: Calendar,
  },
]
const SidebarAdmin = () => {
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex items-center justify-center py-2'>
          <Link to={'/private/dashboard'}>
            <h3 className='text-2xl font-bold'>Panel</h3>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <Tooltip key={item.url}>
                  <TooltipTrigger
                    render={
                      <SidebarMenuButton isActive={pathname === item.url}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    }
                  />
                  <TooltipContent side="right">
                    <span>{item.title}</span>
                  </TooltipContent>
                </Tooltip>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarAdmin
