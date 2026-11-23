import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ClinicType } from '@prisma/client'
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Enforce SUPER_ADMIN role guard
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  // Fetch initial platform stats and clinics
  const [
    totalClinics,
    humanClinics,
    vetClinics,
    totalPatients,
    totalAppointments,
    paidInvoices,
    clinics,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.clinic.count({ where: { type: ClinicType.HUMAN } }),
    prisma.clinic.count({ where: { type: ClinicType.VET } }),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.invoice.findMany({
      where: { status: 'PAID' },
      select: { totalAmount: true },
    }),
    prisma.clinic.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            patients: true,
            appointments: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  const initialStats = {
    totalClinics,
    humanClinics,
    vetClinics,
    totalPatients,
    totalAppointments,
    totalRevenue,
  }

  return (
    <SuperAdminDashboard
      initialStats={initialStats}
      initialClinics={clinics as any}
      adminUser={{
        name: session.user.name,
        email: session.user.email,
      }}
    />
  )
}
