import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ReminderCenter } from '@/components/reminders/ReminderCenter'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const clinicId = session.user.clinicId
  const whereClinic = clinicId ? { clinicId } : {}

  const now = new Date()
  const fourteenDaysFromNow = new Date(now)
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)
  fourteenDaysFromNow.setHours(23, 59, 59, 999)

  // 1. Follow-up visits from Prescriptions
  const followUps = await prisma.prescription.findMany({
    where: {
      ...whereClinic,
      nextVisitDate: {
        not: null,
        lte: fourteenDaysFromNow,
      },
    },
    include: {
      patient: true,
      clinic: true,
      appointment: true,
    },
    orderBy: {
      nextVisitDate: 'asc',
    },
  })

  // 2. Vaccinations due
  const vaccinations = await prisma.vaccination.findMany({
    where: {
      ...whereClinic,
      nextDueDate: {
        not: null,
        lte: fourteenDaysFromNow,
      },
    },
    include: {
      patient: true,
      clinic: true,
    },
    orderBy: {
      nextDueDate: 'asc',
    },
  })

  // 3. Recent WhatsApp Notification Activity Logs
  const notificationLogs = await prisma.notificationLog.findMany({
    where: whereClinic,
    include: {
      patient: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  return (
    <ReminderCenter
      initialFollowUps={followUps as any}
      initialVaccinations={vaccinations as any}
      initialLogs={notificationLogs as any}
      clinicSlug={session.user.clinicSlug || ''}
      clinicType={(session.user.clinicType as 'HUMAN' | 'VET') || 'HUMAN'}
      clinicName={session.user.clinicName || 'Clinic'}
      clinicThemeColor={session.user.clinicThemeColor || '#0ea5e9'}
    />
  )
}
