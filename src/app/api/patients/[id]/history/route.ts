import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Ensure patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Fetch past appointments with prescriptions & invoices
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: id,
        clinicId: session.user.clinicId,
      },
      include: {
        prescription: true,
        invoice: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Fetch vaccinations if any
    const vaccinations = await prisma.vaccination.findMany({
      where: {
        patientId: id,
        clinicId: session.user.clinicId,
      },
      orderBy: {
        administeredDate: 'desc',
      },
    })

    return NextResponse.json({
      patient,
      appointments,
      vaccinations,
    })
  } catch (error) {
    console.error('Error fetching patient history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient history' },
      { status: 500 }
    )
  }
}
