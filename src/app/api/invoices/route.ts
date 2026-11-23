import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      appointmentId,
      consultationFee,
      extraCharges = 0,
      paymentMode = 'UPI',
      status = 'PAID',
    } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 })
    }

    // Verify appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { clinic: true, patient: true },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== 'SUPER_ADMIN' && session.user.clinicId && appointment.clinicId !== session.user.clinicId) {
      return NextResponse.json({ error: 'Unauthorized clinic access' }, { status: 403 })
    }

    const clinicId = appointment.clinicId
    const numConsultationFee = Number(consultationFee) || 0
    const numExtraCharges = Number(extraCharges) || 0
    const totalAmount = numConsultationFee + numExtraCharges

    const invoiceStatus = status === 'PAID' ? InvoiceStatus.PAID : InvoiceStatus.PENDING

    // Upsert invoice for this appointment
    const invoice = await prisma.invoice.upsert({
      where: { appointmentId },
      update: {
        consultationFee: numConsultationFee,
        extraCharges: numExtraCharges,
        totalAmount,
        paymentMode: paymentMode || 'UPI',
        status: invoiceStatus,
      },
      create: {
        clinicId,
        appointmentId,
        consultationFee: numConsultationFee,
        extraCharges: numExtraCharges,
        totalAmount,
        paymentMode: paymentMode || 'UPI',
        status: invoiceStatus,
      },
      include: {
        clinic: true,
        appointment: {
          include: {
            patient: true,
          },
        },
      },
    })

    return NextResponse.json({ invoice, success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating/updating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process invoice' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointmentId')
    const clinicId = session.user.clinicId

    if (appointmentId) {
      const invoice = await prisma.invoice.findUnique({
        where: { appointmentId },
        include: {
          clinic: true,
          appointment: {
            include: {
              patient: true,
            },
          },
        },
      })
      return NextResponse.json({ invoice })
    }

    const where: any = {}
    if (clinicId) {
      where.clinicId = clinicId
    }

    // Calculate Today's Stats
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const todayInvoices = await prisma.invoice.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    })

    const todayPaidInvoices = todayInvoices.filter((i) => i.status === 'PAID')
    const todayCollection = todayPaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const paidCount = todayPaidInvoices.length
    const pendingCount = todayInvoices.filter((i) => i.status === 'PENDING').length

    const paymentBreakdown: Record<string, { amount: number; count: number }> = {
      UPI: { amount: 0, count: 0 },
      Cash: { amount: 0, count: 0 },
      Card: { amount: 0, count: 0 },
    }

    todayPaidInvoices.forEach((i) => {
      const mode = i.paymentMode && paymentBreakdown[i.paymentMode] ? i.paymentMode : 'UPI'
      paymentBreakdown[mode].amount += i.totalAmount
      paymentBreakdown[mode].count += 1
    })

    // Fetch all clinic invoices for display
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        clinic: true,
        appointment: {
          include: {
            patient: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      stats: {
        todayCollection,
        paidCount,
        pendingCount,
        paymentBreakdown,
        totalInvoices: invoices.length,
      },
      invoices,
    })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
