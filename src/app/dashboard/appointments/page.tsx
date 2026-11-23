import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Hash, Plus, ArrowRight } from 'lucide-react'

export default async function AppointmentsPage() {
  const session = await auth()
  if (!session) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: session.user.clinicId,
      date: { gte: today, lt: tomorrow },
    },
    include: { patient: true },
    orderBy: { tokenNumber: 'asc' },
  })

  const isVet = session.user.clinicType === 'VET'
  const themeColor = session.user.clinicThemeColor || '#0ea5e9'

  const statusConfig: Record<string, { label: string; className: string }> = {
    WAITING: { label: 'Waiting', className: 'bg-amber-100 text-amber-700' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">
            Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/reception">
            <Button
              className="text-white font-medium"
              style={{ backgroundColor: themeColor }}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Open Live Reception & Queue
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {appointments.map((appt) => {
          const statusInfo = statusConfig[appt.status] || { label: appt.status, className: 'bg-gray-100 text-gray-700' }
          return (
            <Card key={appt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <div className="text-indigo-700 font-bold text-lg">#{appt.tokenNumber}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">
                        {isVet
                          ? `${appt.patient.petName || 'Pet'} (${appt.patient.ownerName})`
                          : appt.patient.ownerName}
                      </p>
                      <Badge className={`${statusInfo.className} hover:${statusInfo.className} text-xs`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{appt.slot}</span>
                      </div>
                      {appt.notes && (
                        <span className="text-xs text-gray-400 truncate">{appt.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {appointments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No appointments today</p>
          </div>
        )}
      </div>
    </div>
  )
}
