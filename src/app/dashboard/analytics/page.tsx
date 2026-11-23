import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ClinicAnalytics, DailyVisitMetric, PaymentModeSplit } from '@/components/analytics/ClinicAnalytics'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const clinicId = session.user.clinicId
  const clinicType = (session.user.clinicType as 'HUMAN' | 'VET') || 'HUMAN'
  const isVet = clinicType === 'VET'

  // Calculate 7-day rolling window
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Query appointments for last 7 days
  const appointments = await prisma.appointment.findMany({
    where: {
      ...(clinicId ? { clinicId } : {}),
      date: { gte: sevenDaysAgo },
    },
    include: {
      patient: true,
      invoice: true,
    },
    orderBy: { date: 'asc' },
  })

  // Query invoices for last 7 days
  const invoices = await prisma.invoice.findMany({
    where: {
      ...(clinicId ? { clinicId } : {}),
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      appointment: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Build daily metrics for each of the 7 days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const last7DaysVisits: DailyVisitMetric[] = []

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() - i)
    const dateStr = targetDate.toISOString().split('T')[0]
    const dayName = dayNames[targetDate.getDay()]
    const shortDate = targetDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })

    // Filter appointments for this calendar day
    const dayAppts = appointments.filter((a) => {
      const aDate = new Date(a.date).toISOString().split('T')[0]
      return aDate === dateStr
    })

    // Filter invoices created or dated on this day
    const dayInvoices = invoices.filter((inv) => {
      const iDate = new Date(inv.createdAt).toISOString().split('T')[0]
      return iDate === dateStr && inv.status === 'PAID'
    })

    const dayRevenue = dayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

    last7DaysVisits.push({
      date: dateStr,
      dayName,
      shortDate,
      totalVisits: dayAppts.length,
      completed: dayAppts.filter((a) => a.status === 'COMPLETED').length,
      inProgress: dayAppts.filter((a) => a.status === 'IN_PROGRESS').length,
      waiting: dayAppts.filter((a) => a.status === 'WAITING').length,
      cancelled: dayAppts.filter((a) => a.status === 'CANCELLED').length,
      revenue: dayRevenue,
    })
  }

  // Payment Mode Breakdown
  const paidInvoices7Days = invoices.filter((i) => i.status === 'PAID')
  const totalRevenue7Days = paidInvoices7Days.reduce((sum, i) => sum + i.totalAmount, 0)
  const totalVisits7Days = appointments.length
  const totalPaidCount7Days = paidInvoices7Days.length
  const averageRevenuePerVisit = totalPaidCount7Days > 0 ? totalRevenue7Days / totalPaidCount7Days : 0

  const modeTotals: Record<'UPI' | 'Cash' | 'Card', { amount: number; count: number }> = {
    UPI: { amount: 0, count: 0 },
    Cash: { amount: 0, count: 0 },
    Card: { amount: 0, count: 0 },
  }

  paidInvoices7Days.forEach((inv) => {
    const mode = (inv.paymentMode || 'UPI').toUpperCase() as 'UPI' | 'CASH' | 'CARD'
    if (mode === 'UPI') {
      modeTotals.UPI.amount += inv.totalAmount
      modeTotals.UPI.count += 1
    } else if (mode === 'CASH') {
      modeTotals.Cash.amount += inv.totalAmount
      modeTotals.Cash.count += 1
    } else if (mode === 'CARD') {
      modeTotals.Card.amount += inv.totalAmount
      modeTotals.Card.count += 1
    }
  })

  const paymentSplit: PaymentModeSplit[] = (['UPI', 'Cash', 'Card'] as const).map((mode) => {
    const data = modeTotals[mode]
    const percentage = totalRevenue7Days > 0 ? Math.round((data.amount / totalRevenue7Days) * 100) : 0
    return {
      mode,
      amount: data.amount,
      count: data.count,
      percentage,
    }
  }).sort((a, b) => b.amount - a.amount)

  // Species Distribution (Vet mode)
  let speciesData = undefined
  let demographicData = undefined

  if (isVet) {
    const allPatients = await prisma.patient.findMany({
      where: clinicId ? { clinicId } : {},
      select: { petSpecies: true },
    })

    const speciesCounts: Record<string, number> = {}
    allPatients.forEach((p) => {
      const sp = p.petSpecies || 'Other'
      speciesCounts[sp] = (speciesCounts[sp] || 0) + 1
    })

    const totalPets = allPatients.length || 1
    const icons: Record<string, string> = {
      Dog: '🐶',
      Cat: '🐱',
      Bird: '🦜',
      Rabbit: '🐰',
      Other: '🐾',
    }

    speciesData = Object.entries(speciesCounts).map(([species, count]) => ({
      species,
      count,
      percentage: Math.round((count / totalPets) * 100),
      icon: icons[species] || '🐾',
    })).sort((a, b) => b.count - a.count)
  } else {
    // Human demographic distribution
    const allPatients = await prisma.patient.findMany({
      where: clinicId ? { clinicId } : {},
      select: { gender: true, age: true },
    })

    const totalPatients = allPatients.length || 1
    const maleCount = allPatients.filter((p) => p.gender?.toLowerCase() === 'male').length
    const femaleCount = allPatients.filter((p) => p.gender?.toLowerCase() === 'female').length
    const adults = allPatients.filter((p) => (p.age || 0) >= 18 && (p.age || 0) < 60).length
    const seniors = allPatients.filter((p) => (p.age || 0) >= 60).length

    demographicData = [
      { label: 'Male Patients', count: maleCount, percentage: Math.round((maleCount / totalPatients) * 100) },
      { label: 'Female Patients', count: femaleCount, percentage: Math.round((femaleCount / totalPatients) * 100) },
      { label: 'Adults (18-59 yrs)', count: adults, percentage: Math.round((adults / totalPatients) * 100) },
      { label: 'Seniors (60+ yrs)', count: seniors, percentage: Math.round((seniors / totalPatients) * 100) },
    ]
  }

  return (
    <ClinicAnalytics
      clinicName={session.user.clinicName || 'Clinic'}
      clinicSlug={session.user.clinicSlug || ''}
      clinicType={clinicType}
      clinicThemeColor={session.user.clinicThemeColor || '#0ea5e9'}
      last7DaysVisits={last7DaysVisits}
      paymentSplit={paymentSplit}
      totalRevenue7Days={totalRevenue7Days}
      totalVisits7Days={totalVisits7Days}
      totalPaidCount7Days={totalPaidCount7Days}
      averageRevenuePerVisit={averageRevenuePerVisit}
      speciesData={speciesData}
      demographicData={demographicData}
    />
  )
}
