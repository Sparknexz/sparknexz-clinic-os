import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const clinicId = session.user.clinicId
    const whereClinic = clinicId ? { clinicId } : {}

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(23, 59, 59, 999)

    // 1. Follow-up visits from Prescriptions
    const followUps = await prisma.prescription.findMany({
      where: {
        ...whereClinic,
        nextVisitDate: {
          not: null,
          lte: sevenDaysFromNow,
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
          lte: sevenDaysFromNow,
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

    return NextResponse.json({
      followUps,
      vaccinations,
      notificationLogs,
      counts: {
        followUpsCount: followUps.length,
        vaccinationsCount: vaccinations.length,
        logsCount: notificationLogs.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}
