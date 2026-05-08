'use client'

import { LogOut, Settings } from 'lucide-react'
import { Link } from 'react-router'

import { AuthService } from '@/shared/utils/auth'
import { useSession } from '@/shared/hooks/use-auth'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/components/ui/dropdown-menu'

import { Button } from '@/shared/ui/components/ui/button'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/components/ui/avatar'

interface UserMenuProps {
  name?: string | null
}

export const UserMenu = ({ name }: UserMenuProps) => {
  const { user } = useSession()

  const logout = async () => {
    await AuthService.logout()
    window.location.href = '/'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            className='rounded-full p-0 w-8 h-8 overflow-hidden border'
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
          </Button>
        }
      />

      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>
          {name || 'Usuario'}
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
          className='flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer'
        >
          <LogOut className='w-4 h-4' />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
