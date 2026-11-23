import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, paymentMode, consultationFee, extraCharges } = body

    const updateData: any = {}
    if (status) {
      updateData.status = status === 'PAID' ? InvoiceStatus.PAID : InvoiceStatus.PENDING
    }
    if (paymentMode) {
      updateData.paymentMode = paymentMode
    }
    if (consultationFee !== undefined || extraCharges !== undefined) {
      const existing = await prisma.invoice.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      const fee = consultationFee !== undefined ? Number(consultationFee) : existing.consultationFee
      const extra = extraCharges !== undefined ? Number(extraCharges) : existing.extraCharges
      updateData.consultationFee = fee
      updateData.extraCharges = extra
      updateData.totalAmount = fee + extra
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        clinic: true,
        appointment: {
          include: {
            patient: true,
          },
        },
      },
    })

    return NextResponse.json({ invoice: updated, success: true })
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice' },
      { status: 500 }
    )
  }
}
