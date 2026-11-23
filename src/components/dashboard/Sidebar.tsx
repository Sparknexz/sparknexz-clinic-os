'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Session } from 'next-auth'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  FileText,
  Syringe,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  BellRing,
  Stethoscope,
  PawPrint,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  session: Session
  isOpen: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

function getNavItems(role: string) {
  if (role === 'SUPER_ADMIN') {
    return [
      { href: '/admin', label: '⚡ Super Admin Panel', icon: ShieldCheck },
      { href: '/dashboard', label: 'Platform Overview', icon: LayoutDashboard },
      { href: '/dashboard/invoices', label: 'Global Billing', icon: Receipt },
      { href: '/dashboard/analytics', label: 'Global Analytics', icon: BarChart3 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ]
  }

  if (role === 'RECEPTIONIST') {
    return [
      { href: '/dashboard/reception', label: 'Reception & Queue', icon: Clock },
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/reminders', label: 'Reminders & WhatsApp', icon: BellRing },
      { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ]
  }

  if (role === 'DOCTOR') {
    return [
      { href: '/dashboard/doctor', label: 'Doctor Workspace', icon: Stethoscope },
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/reception', label: 'Live Queue Desk', icon: Clock },
      { href: '/dashboard/prescriptions', label: 'Prescriptions', icon: FileText },
      { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/vaccinations', label: 'Vaccinations', icon: Syringe },
      { href: '/dashboard/reminders', label: 'Reminders & WhatsApp', icon: BellRing },
      { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ]
  }

  const base = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/reception', label: 'Live Queue', icon: Clock },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/patients', label: 'Patients', icon: Users },
    { href: '/dashboard/reminders', label: 'Reminders & WhatsApp', icon: BellRing },
    { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return base
}

export function Sidebar({ session, isOpen, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItems(session.user.role)
  const isVet = session.user.clinicType === 'VET'

  const themeColor = session.user.clinicThemeColor || '#0ea5e9'

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-20 bg-white border-r border-gray-200 transition-all duration-300 hidden lg:flex flex-col',
          isOpen ? 'w-64' : 'w-16'
        )}
      >
        <SidebarContent
          session={session}
          isOpen={isOpen}
          navItems={navItems}
          pathname={pathname}
          isVet={isVet}
          themeColor={themeColor}
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 flex flex-col lg:hidden transition-transform duration-300 w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex justify-end p-4 border-b">
          <button onClick={onMobileClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <SidebarContent
          session={session}
          isOpen={true}
          navItems={navItems}
          pathname={pathname}
          isVet={isVet}
          themeColor={themeColor}
        />
      </aside>
    </>
  )
}

function SidebarContent({
  session,
  isOpen,
  navItems,
  pathname,
  isVet,
  themeColor,
}: {
  session: Session
  isOpen: boolean
  navItems: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>
  pathname: string
  isVet: boolean
  themeColor: string
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / Clinic Badge */}
      <div className={cn('p-4 border-b border-gray-100', !isOpen && 'flex justify-center')}>
        {isOpen ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: themeColor }}
              >
                {isVet ? (
                  <PawPrint className="w-5 h-5 text-white" />
                ) : (
                  <Stethoscope className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
                  {session.user.clinicName}
                </p>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-semibold mt-0.5',
                    isVet
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                  )}
                >
                  {isVet ? '🐾 VET MODE' : '🏥 HUMAN MODE'}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
            title={session.user.clinicName || 'Clinic'}
          >
            {isVet ? (
              <PawPrint className="w-5 h-5 text-white" />
            ) : (
              <Stethoscope className="w-5 h-5 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                !isOpen && 'justify-center px-2'
              )}
              style={isActive ? { backgroundColor: themeColor } : {}}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className={cn('flex-shrink-0', isActive ? 'h-5 w-5' : 'h-5 w-5')} />
              {isOpen && <span className="truncate">{item.label}</span>}
              {isOpen && isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: themeColor }}
            >
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.role === 'DOCTOR' ? '👨‍⚕️ Doctor' : '🗂️ Receptionist'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
