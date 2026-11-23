import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendWhatsAppNotification,
  formatPrescriptionReadyMessage,
} from '@/lib/whatsapp'

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

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: true,
        appointment: true,
        clinic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
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
    const {
      appointmentId,
      patientId,
      symptoms,
      diagnosis,
      medicinesJson,
      nextVisitDate,
    } = body

    if (!appointmentId || !patientId) {
      return NextResponse.json(
        { error: 'Appointment ID and Patient ID are required' },
        { status: 400 }
      )
    }

    // Verify appointment belongs to this clinic
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId: session.user.clinicId,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Upsert prescription
    const prescription = await prisma.prescription.upsert({
      where: {
        appointmentId,
      },
      update: {
        symptoms: symptoms ? String(symptoms).trim() : null,
        diagnosis: diagnosis ? String(diagnosis).trim() : null,
        medicinesJson: typeof medicinesJson === 'string' ? medicinesJson : JSON.stringify(medicinesJson || []),
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
      },
      create: {
        clinicId: session.user.clinicId,
        appointmentId,
        patientId,
        symptoms: symptoms ? String(symptoms).trim() : null,
        diagnosis: diagnosis ? String(diagnosis).trim() : null,
        medicinesJson: typeof medicinesJson === 'string' ? medicinesJson : JSON.stringify(medicinesJson || []),
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
      },
      include: {
        patient: true,
        appointment: true,
        clinic: true,
      },
    })

    // Mark appointment as COMPLETED
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    })

    // Automated WhatsApp digital prescription notification
    try {
      let parsedMeds: Array<{ name: string; dosage?: string; timing?: string; duration?: string }> = []
      try {
        parsedMeds = JSON.parse(prescription.medicinesJson || '[]')
      } catch {}

      const medsSummary =
        parsedMeds.length > 0
          ? parsedMeds
              .map(
                (m) =>
                  `• ${m.name} (${m.dosage || '1-0-1'}, ${m.timing || 'After Food'} - ${m.duration || '5 Days'})`
              )
              .join('\n')
          : null

      const nextVisitStr = prescription.nextVisitDate
        ? new Date(prescription.nextVisitDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null

      const message = formatPrescriptionReadyMessage({
        clinicName: prescription.clinic.name,
        patientName: prescription.patient.ownerName,
        diagnosis: prescription.diagnosis,
        medicinesSummary: medsSummary,
        nextVisitDate: nextVisitStr,
        isVet: prescription.clinic.type === 'VET',
        petName: prescription.patient.petName,
      })

      sendWhatsAppNotification({
        clinicId: prescription.clinicId,
        patientId: prescription.patientId,
        phone: prescription.patient.phone,
        type: 'PRESCRIPTION_READY',
        message,
      }).catch((e) => console.error('WhatsApp notify error:', e))
    } catch (notifyErr) {
      console.error('WhatsApp prescription preparation error:', notifyErr)
    }

    return NextResponse.json({
      success: true,
      prescription,
    })
  } catch (error) {
    console.error('Error saving prescription:', error)
    return NextResponse.json(
      { error: 'Failed to save prescription' },
      { status: 500 }
    )
  }
}
