import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendWhatsAppNotification,
  formatBookingConfirmationMessage,
} from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      patientId: existingPatientId,
      ownerName,
      phone,
      age,
      gender,
      petName,
      petSpecies,
      petBreed,
      petWeight,
      date,
      slot,
      notes,
    } = body

    let patientId = existingPatientId

    // If no existing patient is selected, create new patient record
    if (!patientId) {
      if (!ownerName || !phone) {
        return NextResponse.json(
          { error: 'Name and Phone Number are required' },
          { status: 400 }
        )
      }

      const newPatient = await prisma.patient.create({
        data: {
          clinicId: session.user.clinicId,
          ownerName: String(ownerName).trim(),
          phone: String(phone).trim(),
          age: age ? parseInt(String(age), 10) : null,
          gender: gender ? String(gender) : null,
          petName: petName ? String(petName).trim() : null,
          petSpecies: petSpecies ? String(petSpecies).trim() : null,
          petBreed: petBreed ? String(petBreed).trim() : null,
          petWeight: petWeight ? parseFloat(String(petWeight)) : null,
        },
      })

      patientId = newPatient.id
    }

    // Determine target appointment date
    let appointmentDate = new Date()
    if (date) {
      const parsed = new Date(date)
      if (!isNaN(parsed.getTime())) {
        appointmentDate = parsed
      }
    }

    const startOfDay = new Date(appointmentDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(appointmentDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Calculate next sequential token number for this clinic and date
    const lastAppointment = await prisma.appointment.findFirst({
      where: {
        clinicId: session.user.clinicId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        tokenNumber: 'desc',
      },
      select: {
        tokenNumber: true,
      },
    })

    const nextTokenNumber = (lastAppointment?.tokenNumber || 0) + 1

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        date: appointmentDate,
        slot: slot || 'Walk-in / Immediate',
        tokenNumber: nextTokenNumber,
        status: 'WAITING',
        notes: notes ? String(notes).trim() : null,
      },
      include: {
        patient: true,
      },
    })

    // Automated WhatsApp booking confirmation notification
    try {
      const host = request.headers.get('host') || 'localhost:3000'
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const queueUrl = session.user.clinicSlug
        ? `${protocol}://${host}/queue/${session.user.clinicSlug}`
        : undefined

      const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      const message = formatBookingConfirmationMessage({
        clinicName: session.user.clinicName || 'Clinic',
        tokenNumber: nextTokenNumber,
        slot: appointment.slot,
        date: formattedDate,
        queueUrl,
        patientName: appointment.patient.ownerName,
        isVet: session.user.clinicType === 'VET',
        petName: appointment.patient.petName,
      })

      sendWhatsAppNotification({
        clinicId: session.user.clinicId,
        patientId: appointment.patientId,
        phone: appointment.patient.phone,
        type: 'BOOKING_CONFIRMATION',
        message,
      }).catch((e) => console.error('WhatsApp notify error:', e))
    } catch (notifyErr) {
      console.error('WhatsApp preparation error:', notifyErr)
    }

    return NextResponse.json({
      success: true,
      appointment,
      tokenNumber: nextTokenNumber,
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
