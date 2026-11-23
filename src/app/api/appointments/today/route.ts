import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    let queryDate = new Date()
    if (dateParam) {
      const parsed = new Date(dateParam)
      if (!isNaN(parsed.getTime())) {
        queryDate = parsed
      }
    }

    const startOfDay = new Date(queryDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(queryDate)
    endOfDay.setHours(23, 59, 59, 999)

    const [appointments, waitingCount, inProgressCount, completedCount, cancelledCount] =
      await Promise.all([
        prisma.appointment.findMany({
          where: {
            clinicId: session.user.clinicId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
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
            date: { gte: startOfDay, lte: endOfDay },
            status: 'WAITING',
          },
        }),
        prisma.appointment.count({
          where: {
            clinicId: session.user.clinicId,
            date: { gte: startOfDay, lte: endOfDay },
            status: 'IN_PROGRESS',
          },
        }),
        prisma.appointment.count({
          where: {
            clinicId: session.user.clinicId,
            date: { gte: startOfDay, lte: endOfDay },
            status: 'COMPLETED',
          },
        }),
        prisma.appointment.count({
          where: {
            clinicId: session.user.clinicId,
            date: { gte: startOfDay, lte: endOfDay },
            status: 'CANCELLED',
          },
        }),
      ])

    return NextResponse.json({
      stats: {
        total: appointments.length,
        waiting: waitingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      appointments,
    })
  } catch (error) {
    console.error('Error fetching today appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
