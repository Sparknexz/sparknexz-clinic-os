import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BillingDesk } from '@/components/invoices/BillingDesk'

export default async function InvoicesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const clinicId = session.user.clinicId

  // Fetch clinic invoices
  const invoices = await prisma.invoice.findMany({
    where: clinicId ? { clinicId } : {},
    include: {
      clinic: true,
      appointment: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch today's appointments for the invoice generator dropdown
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(clinicId ? { clinicId } : {}),
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    include: {
      patient: true,
    },
    orderBy: { tokenNumber: 'asc' },
  })

  return (
    <BillingDesk
      initialInvoices={invoices as any}
      initialAppointments={appointments as any}
      clinicSlug={session.user.clinicSlug || ''}
      clinicType={(session.user.clinicType as 'HUMAN' | 'VET') || 'HUMAN'}
      clinicName={session.user.clinicName || 'Clinic'}
      clinicThemeColor={session.user.clinicThemeColor || '#0ea5e9'}
      userName={session.user.name || 'Staff'}
      userRole={session.user.role || 'RECEPTIONIST'}
    />
  )
}
