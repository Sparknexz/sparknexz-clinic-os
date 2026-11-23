import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClinicType, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Super Admin access required.' },
        { status: 403 }
      )
    }

    // Platform-wide counts
    const [
      totalClinics,
      humanClinics,
      vetClinics,
      totalPatients,
      totalAppointments,
      paidInvoices,
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { type: ClinicType.HUMAN } }),
      prisma.clinic.count({ where: { type: ClinicType.VET } }),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.invoice.findMany({
        where: { status: 'PAID' },
        select: { totalAmount: true },
      }),
    ])

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

    // Full list of clinics with related users and counts
    const clinics = await prisma.clinic.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            patients: true,
            appointments: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      stats: {
        totalClinics,
        humanClinics,
        vetClinics,
        totalPatients,
        totalAppointments,
        totalRevenue,
      },
      clinics,
    })
  } catch (error: any) {
    console.error('Error fetching admin clinics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clinics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Super Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      type = 'HUMAN',
      address,
      phone,
      themeColor,
      doctor,
      receptionist,
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Clinic Name and Slug are required' },
        { status: 400 }
      )
    }

    // Clean slug format
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')

    // Check if slug exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { slug: cleanSlug },
    })
    if (existingClinic) {
      return NextResponse.json(
        { error: `Clinic with slug "${cleanSlug}" already exists` },
        { status: 400 }
      )
    }

    // Doctor & Receptionist validation
    const doctorEmail = doctor?.email?.toLowerCase().trim() || `doctor@${cleanSlug}.com`
    const doctorPassword = doctor?.password || 'password123'
    const doctorName = doctor?.name || (type === 'VET' ? 'Lead Vet Doctor' : 'Chief Medical Doctor')

    const receptionistEmail = receptionist?.email?.toLowerCase().trim() || `reception@${cleanSlug}.com`
    const receptionistPassword = receptionist?.password || 'password123'
    const receptionistName = receptionist?.name || 'Clinic Reception Desk'

    // Check email uniqueness
    const existingDoctorUser = await prisma.user.findUnique({ where: { email: doctorEmail } })
    if (existingDoctorUser) {
      return NextResponse.json(
        { error: `User with email "${doctorEmail}" already exists` },
        { status: 400 }
      )
    }

    const existingReceptionUser = await prisma.user.findUnique({ where: { email: receptionistEmail } })
    if (existingReceptionUser) {
      return NextResponse.json(
        { error: `User with email "${receptionistEmail}" already exists` },
        { status: 400 }
      )
    }

    // Hash passwords
    const [hashedDocPassword, hashedRecPassword] = await Promise.all([
      bcrypt.hash(doctorPassword, 10),
      bcrypt.hash(receptionistPassword, 10),
    ])

    const clinicType = type === 'VET' ? ClinicType.VET : ClinicType.HUMAN
    const defaultColor = type === 'VET' ? '#10b981' : '#0ea5e9'

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Clinic
      const newClinic = await tx.clinic.create({
        data: {
          name,
          slug: cleanSlug,
          type: clinicType,
          address: address || null,
          phone: phone || null,
          themeColor: themeColor || defaultColor,
        },
      })

      // 2. Create Initial Doctor
      const newDoctor = await tx.user.create({
        data: {
          clinicId: newClinic.id,
          name: doctorName,
          email: doctorEmail,
          password: hashedDocPassword,
          role: UserRole.DOCTOR,
        },
      })

      // 3. Create Initial Receptionist
      const newReceptionist = await tx.user.create({
        data: {
          clinicId: newClinic.id,
          name: receptionistName,
          email: receptionistEmail,
          password: hashedRecPassword,
          role: UserRole.RECEPTIONIST,
        },
      })

      return {
        clinic: newClinic,
        doctor: {
          id: newDoctor.id,
          name: newDoctor.name,
          email: newDoctor.email,
          role: newDoctor.role,
          plainPassword: doctorPassword,
        },
        receptionist: {
          id: newReceptionist.id,
          name: newReceptionist.name,
          email: newReceptionist.email,
          role: newReceptionist.role,
          plainPassword: receptionistPassword,
        },
      }
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error: any) {
    console.error('Error onboarding clinic:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to onboard clinic' },
      { status: 500 }
    )
  }
}
