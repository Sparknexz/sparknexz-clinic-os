import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppNotification } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type = 'VISIT_REMINDER',
      id, // prescriptionId or vaccinationId
      patientId,
      phone,
      message,
    } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      )
    }

    const clinicId = session.user.clinicId || (body.clinicId as string)

    // Send and log notification
    const log = await sendWhatsAppNotification({
      clinicId,
      patientId,
      phone,
      type,
      message,
    })

    // If vaccination reminder, update reminderSent to true
    if (type === 'VACCINE_REMINDER' && id) {
      try {
        await prisma.vaccination.update({
          where: { id },
          data: { reminderSent: true },
        })
      } catch (vacErr) {
        console.error('Failed to update vaccination reminderSent flag:', vacErr)
      }
    }

    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch reminder' },
      { status: 500 }
    )
  }
}
