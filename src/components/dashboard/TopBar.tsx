'use client'

import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, User, Bell } from 'lucide-react'

interface TopBarProps {
  session: Session
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onToggleMobileSidebar: () => void
}

export function TopBar({ session, sidebarOpen, onToggleSidebar, onToggleMobileSidebar }: TopBarProps) {
  const themeColor = session.user.clinicThemeColor || '#0ea5e9'
  const isVet = session.user.clinicType === 'VET'

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </button>

      {/* Clinic Badge (mobile) */}
      <div className="lg:hidden flex items-center gap-2 flex-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: themeColor }}
        >
          {isVet ? '🐾' : '🏥'}
        </div>
        <span className="font-semibold text-gray-900 text-sm truncate">{session.user.clinicName}</span>
      </div>

      {/* Spacer */}
      <div className="hidden lg:flex flex-1 items-center gap-3">
        <span className="text-gray-400 text-sm">|</span>
        <Badge
          className={
            isVet
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs'
          }
        >
          {isVet ? '🐾 Veterinary Mode' : '🏥 Human Clinic Mode'}
        </Badge>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full p-0 outline-none cursor-pointer">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className="text-white text-sm font-semibold"
                style={{ backgroundColor: themeColor }}
              >
                {(session.user.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2 py-1.5 flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
              <Badge variant="outline" className="text-[10px] mt-1 w-fit">
                {session.user.role}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
