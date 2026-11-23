import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Clinic slug is required' }, { status: 400 })
    }

    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
        logoUrl: true,
        themeColor: true,
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    // Current in-progress consultation
    const nowServing = await prisma.appointment.findFirst({
      where: {
        clinicId: clinic.id,
        date: { gte: today, lte: endOfDay },
        status: 'IN_PROGRESS',
      },
      include: {
        patient: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Next 5 waiting in queue
    const upNext = await prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
        date: { gte: today, lte: endOfDay },
        status: 'WAITING',
      },
      include: {
        patient: true,
      },
      orderBy: {
        tokenNumber: 'asc',
      },
      take: 6,
    })

    // Aggregated counts
    const [waitingCount, completedCount, totalCount] = await Promise.all([
      prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          date: { gte: today, lte: endOfDay },
          status: 'WAITING',
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          date: { gte: today, lte: endOfDay },
          status: 'COMPLETED',
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          date: { gte: today, lte: endOfDay },
        },
      }),
    ])

    return NextResponse.json({
      clinic,
      nowServing: nowServing
        ? {
            id: nowServing.id,
            tokenNumber: nowServing.tokenNumber,
            slot: nowServing.slot,
            notes: nowServing.notes,
            status: nowServing.status,
            patient: {
              id: nowServing.patient.id,
              ownerName: nowServing.patient.ownerName,
              phone: nowServing.patient.phone,
              age: nowServing.patient.age,
              gender: nowServing.patient.gender,
              petName: nowServing.patient.petName,
              petSpecies: nowServing.patient.petSpecies,
              petBreed: nowServing.patient.petBreed,
              petWeight: nowServing.patient.petWeight,
            },
          }
        : null,
      upNext: upNext.map((appt) => ({
        id: appt.id,
        tokenNumber: appt.tokenNumber,
        slot: appt.slot,
        notes: appt.notes,
        status: appt.status,
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
      })),
      stats: {
        total: totalCount,
        waiting: waitingCount,
        inProgress: nowServing ? 1 : 0,
        completed: completedCount,
      },
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching public queue:', error)
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }
}
