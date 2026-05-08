'use client'

import { Code, LogOut, Settings } from 'lucide-react'
import { Link } from 'react-router'
import { AuthService } from '@/shared/utils/auth'
import { useSession } from '@/shared/hooks/use-auth'
import { useSidebar } from '@/shared/ui/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/components/ui/dropdown-menu'
import { cn } from '@/shared/ui/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/components/ui/avatar'

export function SidebarUser() {
  const { user } = useSession()
  const { state } = useSidebar()

  const isCollapsed = state === 'collapsed'

  const logout = async () => {
    await AuthService.logout()
    window.location.href = '/'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            className={cn(
              'flex items-center gap-2 w-full px-2 py-2 hover:bg-accent rounded-md transition cursor-pointer',
              isCollapsed ? 'justify-center' : 'justify-start',
            )}
          >
            <Avatar className='w-8 h-8'>
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
                alt={user?.username}
              />
              <AvatarFallback>
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <div className='flex flex-1 items-center overflow-hidden'>
                <div className='flex-1 flex flex-col text-left min-w-0'>
                  <span className='text-sm font-medium leading-none truncate'>
                    {user?.username}
                  </span>
                </div>

                <Code className='rotate-90 w-4 h-4 text-muted-foreground flex-shrink-0 ml-2' />
              </div>
            )}
          </button>
        }
      />

      <DropdownMenuContent
        side='right'
        align='start'
        sideOffset={12}
        className='w-56'
      >
        <DropdownMenuLabel className='flex flex-col space-y-1'>
          <span className='text-sm font-medium'>{user?.username}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={
            <Link
              to='/private/settings'
              className='flex items-center gap-2 cursor-pointer w-full'
            >
              <Settings className='w-4 h-4' />
              Configuración
            </Link>
          }
        />

        <DropdownMenuItem
          onClick={logout}
          className='flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600'
        >
          <LogOut className='w-4 h-4 text-red-600' />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
