import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReceptionDesk } from '@/components/reception/ReceptionDesk'

export const dynamic = 'force-dynamic'

export default async function ReceptionPage() {
  const session = await auth()
  if (!session?.user?.clinicId) {
    redirect('/login')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [appointments, waitingCount, inProgressCount, completedCount, cancelledCount] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          clinicId: session.user.clinicId,
          date: { gte: today, lt: tomorrow },
        },
        include: {
          patient: true,
        },
        orderBy: {
          tokenNumber: 'asc',
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: session.user.clinicId,
          date: { gte: today, lt: tomorrow },
          status: 'WAITING',
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: session.user.clinicId,
          date: { gte: today, lt: tomorrow },
          status: 'IN_PROGRESS',
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: session.user.clinicId,
          date: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: session.user.clinicId,
          date: { gte: today, lt: tomorrow },
          status: 'CANCELLED',
        },
      }),
    ])

  const initialStats = {
    total: appointments.length,
    waiting: waitingCount,
    inProgress: inProgressCount,
    completed: completedCount,
    cancelled: cancelledCount,
  }

  // Format appointments with ISO strings for date so they serialize cleanly to Client Component
  const serializedAppointments = appointments.map((appt) => ({
    id: appt.id,
    clinicId: appt.clinicId,
    patientId: appt.patientId,
    date: appt.date.toISOString(),
    slot: appt.slot,
    tokenNumber: appt.tokenNumber,
    status: appt.status as 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    notes: appt.notes,
    patient: {
      id: appt.patient.id,
      ownerName: appt.patient.ownerName,
      phone: appt.patient.phone,
      age: appt.patient.age,
      gender: appt.patient.gender,
      petName: appt.patient.petName,
      petSpecies: appt.patient.petSpecies,
      petBreed: appt.patient.petBreed,
      petWeight: appt.patient.petWeight,
    },
  }))

  return (
    <ReceptionDesk
      initialAppointments={serializedAppointments}
      initialStats={initialStats}
      clinicSlug={session.user.clinicSlug || ''}
      clinicType={(session.user.clinicType as 'HUMAN' | 'VET') || 'HUMAN'}
      clinicName={session.user.clinicName || 'Clinic'}
      clinicThemeColor={session.user.clinicThemeColor || '#0ea5e9'}
      userRole={session.user.role}
      userName={session.user.name || 'Staff'}
    />
  )
}
