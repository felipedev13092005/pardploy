import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from '@/shared/ui/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/components/ui/tooltip'
import {
  Activity,
  Container,
  FolderKanban,
  GitBranch,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Network,
  ScrollText,
  Server,
  Settings,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { SidebarUser } from './SidebarUser'

const groups = [
  {
    label: 'General',
    items: [
      { title: 'Dashboard', url: '/private/dashboard', icon: LayoutDashboard },
      { title: 'Proyectos', url: '/private/projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Infraestructura',
    items: [
      { title: 'Contenedores', url: '/private/containers', icon: Container },
      { title: 'Servidores', url: '/private/servers', icon: Server },
      { title: 'Redes', url: '/private/networks', icon: Network },
      { title: 'Volúmenes', url: '/private/volumes', icon: HardDrive },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { title: 'Despliegues', url: '/private/deployments', icon: GitBranch },
      { title: 'Logs', url: '/private/logs', icon: ScrollText },
      { title: 'Métricas', url: '/private/metrics', icon: Activity },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Secretos', url: '/private/secrets', icon: KeyRound },
      { title: 'Configuración', url: '/private/settings', icon: Settings },
    ],
  },
]

const SidebarAdmin = () => {
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex items-center justify-center py-2'>
          <Link to={'/private/dashboard'}>
            <h3 className='text-2xl font-bold'>Pardploy</h3>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <Tooltip key={item.url}>
                    <TooltipTrigger
                      render={
                        <SidebarMenuButton isActive={pathname === item.url}>
                          <Link to={item.url} className='flex items-center gap-2'>
                            <item.icon className='h-4 w-4' />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      }
                    />
                    <TooltipContent side='right'>
                      <span>{item.title}</span>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarAdmin
