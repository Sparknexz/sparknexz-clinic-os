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
    const patientId = searchParams.get('patientId')

    const where: any = { clinicId: session.user.clinicId }
    if (patientId) {
      where.patientId = patientId
    }

    const vaccinations = await prisma.vaccination.findMany({
      where,
      include: {
        patient: true,
      },
      orderBy: {
        administeredDate: 'desc',
      },
    })

    return NextResponse.json({ vaccinations })
  } catch (error) {
    console.error('Error fetching vaccinations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vaccinations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { patientId, vaccineName, administeredDate, nextDueDate } = body

    if (!patientId || !vaccineName) {
      return NextResponse.json(
        { error: 'Patient ID and Vaccine Name are required' },
        { status: 400 }
      )
    }

    // Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId: session.user.clinicId,
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const vaccination = await prisma.vaccination.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        vaccineName: String(vaccineName).trim(),
        administeredDate: administeredDate ? new Date(administeredDate) : new Date(),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        reminderSent: false,
      },
      include: {
        patient: true,
      },
    })

    return NextResponse.json({
      success: true,
      vaccination,
    })
  } catch (error) {
    console.error('Error recording vaccination:', error)
    return NextResponse.json(
      { error: 'Failed to record vaccination' },
      { status: 500 }
    )
  }
}
