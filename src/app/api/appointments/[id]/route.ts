import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(AppointmentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid appointment status' },
        { status: 400 }
      )
    }

    // Verify appointment belongs to this clinic
    const existing = await prisma.appointment.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: status as AppointmentStatus },
      include: { patient: true },
    })

    return NextResponse.json({
      success: true,
      appointment: updated,
    })
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
