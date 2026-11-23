import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendWhatsAppNotification,
  formatBookingConfirmationMessage,
} from '@/lib/whatsapp'

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

    return NextResponse.json({ clinic })
  } catch (error) {
    console.error('Error fetching clinic for booking:', error)
    return NextResponse.json({ error: 'Failed to fetch clinic' }, { status: 500 })
  }
}

export async function POST(
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
    })

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
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

    if (!ownerName || !phone) {
      return NextResponse.json(
        { error: 'Name and Phone Number are required.' },
        { status: 400 }
      )
    }

    const isVet = clinic.type === 'VET'
    if (isVet && !petName) {
      return NextResponse.json(
        { error: 'Pet Name is required for veterinary appointment.' },
        { status: 400 }
      )
    }

    const cleanPhone = String(phone).trim()
    const cleanName = String(ownerName).trim()

    // Check if patient already exists under this clinic
    let patient = null

    if (isVet) {
      // Find existing pet under this owner phone & pet name
      patient = await prisma.patient.findFirst({
        where: {
          clinicId: clinic.id,
          phone: cleanPhone,
          petName: {
            equals: String(petName).trim(),
          },
        },
      })

      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            clinicId: clinic.id,
            ownerName: cleanName,
            phone: cleanPhone,
            petName: String(petName).trim(),
            petSpecies: petSpecies ? String(petSpecies).trim() : 'Dog',
            petBreed: petBreed ? String(petBreed).trim() : null,
            petWeight: petWeight ? parseFloat(String(petWeight)) : null,
            age: age ? parseInt(String(age), 10) : null,
            gender: gender ? String(gender) : null,
          },
        })
      }
    } else {
      // Human mode: find by phone
      patient = await prisma.patient.findFirst({
        where: {
          clinicId: clinic.id,
          phone: cleanPhone,
        },
      })

      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            clinicId: clinic.id,
            ownerName: cleanName,
            phone: cleanPhone,
            age: age ? parseInt(String(age), 10) : null,
            gender: gender ? String(gender) : null,
          },
        })
      } else if (age || gender) {
        // Update age/gender if provided
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: {
            age: age ? parseInt(String(age), 10) : patient.age,
            gender: gender ? String(gender) : patient.gender,
          },
        })
      }
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

    // Calculate sequential token number
    const lastAppt = await prisma.appointment.findFirst({
      where: {
        clinicId: clinic.id,
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

    const tokenNumber = (lastAppt?.tokenNumber || 0) + 1

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        date: appointmentDate,
        slot: slot || 'General Consultation',
        tokenNumber,
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
      const queueUrl = `${protocol}://${host}/queue/${clinic.slug}`

      const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      const message = formatBookingConfirmationMessage({
        clinicName: clinic.name,
        tokenNumber,
        slot: appointment.slot,
        date: formattedDate,
        queueUrl,
        patientName: appointment.patient.ownerName,
        isVet,
        petName: appointment.patient.petName,
      })

      sendWhatsAppNotification({
        clinicId: clinic.id,
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
      tokenNumber,
      clinic: {
        name: clinic.name,
        slug: clinic.slug,
        type: clinic.type,
        address: clinic.address,
        phone: clinic.phone,
        themeColor: clinic.themeColor,
      },
    })
  } catch (error) {
    console.error('Error creating public booking:', error)
    return NextResponse.json(
      { error: 'Failed to complete appointment booking. Please try again.' },
      { status: 500 }
    )
  }
}
