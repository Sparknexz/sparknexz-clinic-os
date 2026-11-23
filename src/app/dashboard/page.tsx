import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Clock, CheckCircle2, TrendingUp, Activity, ArrowRight, Sparkles } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    todayAppointments,
    totalPatients,
    waitingCount,
    inProgressCount,
    completedCount,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clinicId: session.user.clinicId,
        date: { gte: today, lt: tomorrow },
      },
      include: { patient: true },
      orderBy: { tokenNumber: 'asc' },
    }),
    prisma.patient.count({ where: { clinicId: session.user.clinicId } }),
    prisma.appointment.count({
      where: { clinicId: session.user.clinicId, date: { gte: today, lt: tomorrow }, status: 'WAITING' },
    }),
    prisma.appointment.count({
      where: { clinicId: session.user.clinicId, date: { gte: today, lt: tomorrow }, status: 'IN_PROGRESS' },
    }),
    prisma.appointment.count({
      where: { clinicId: session.user.clinicId, date: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
    }),
  ])

  const isVet = session.user.clinicType === 'VET'
  const themeColor = session.user.clinicThemeColor || '#0ea5e9'

  const stats = [
    {
      title: "Today's Appointments",
      value: todayAppointments.length,
      icon: Calendar,
      description: 'Total scheduled today',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      description: isVet ? 'Pets & animals registered' : 'Patients registered',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Waiting',
      value: waitingCount,
      icon: Clock,
      description: 'In queue right now',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      description: 'Seen today',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Waiting</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
          {(session.user.name || 'Doctor').split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}
          <span className={isVet ? 'text-emerald-600 font-medium' : 'text-blue-600 font-medium'}>
            {session.user.clinicName}
          </span>
        </p>
      </div>

      {/* Quick Launch Banner for Receptionist */}
      {session.user.role === 'RECEPTIONIST' && (
        <div
          className="p-4 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Reception & Live Queue Desk</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Issue instant tokens, register walk-ins with smart phone lookup, and call in patients.
              </p>
            </div>
          </div>
          <Link href="/dashboard/reception" className="flex-shrink-0">
            <Button className="bg-white text-gray-900 hover:bg-gray-100 font-semibold text-xs h-9 px-4">
              Open Reception Desk →
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Launch Banner for Doctor */}
      {session.user.role === 'DOCTOR' && (
        <div
          className="p-4 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Doctor Consultation Workspace</h3>
              <p className="text-xs text-white/80 mt-0.5">
                3-column clinical desk: Live token queue, patient history, and fast 1-click prescription builder.
              </p>
            </div>
          </div>
          <Link href="/dashboard/doctor" className="flex-shrink-0">
            <Button className="bg-white text-gray-900 hover:bg-gray-100 font-semibold text-xs h-9 px-4">
              Open Doctor Workspace →
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-300" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700">{stat.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.description}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Live Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Today&apos;s Queue</CardTitle>
                  <CardDescription>Live appointment status</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 font-medium">Live</span>
                  </div>
                  <Link
                    href="/dashboard/reception"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Open Desk →
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: themeColor }}
                      >
                        #{appt.tokenNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {isVet
                            ? `${appt.patient.petName || 'Unknown Pet'} (${appt.patient.ownerName})`
                            : appt.patient.ownerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appt.slot} · {appt.notes || 'General consultation'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">{getStatusBadge(appt.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Queue Summary</CardTitle>
              <CardDescription>Today&apos;s progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Waiting', count: waitingCount, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'In Progress', count: inProgressCount, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Completed', count: completedCount, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${item.bg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${item.text}`}>{item.count}</span>
                </div>
              ))}

              {todayAppointments.length > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{completedCount}/{todayAppointments.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(completedCount / todayAppointments.length) * 100}%`,
                        backgroundColor: themeColor,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
