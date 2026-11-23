import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendWhatsAppNotification,
  formatFollowUpReminderMessage,
  formatVaccineReminderMessage,
} from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const inThreeDays = new Date(now)
    inThreeDays.setDate(inThreeDays.getDate() + 3)
    inThreeDays.setHours(23, 59, 59, 999)

    // 1. Find upcoming follow-ups in the next 3 days
    const upcomingFollowUps = await prisma.prescription.findMany({
      where: {
        nextVisitDate: {
          not: null,
          lte: inThreeDays,
        },
      },
      include: {
        patient: true,
        clinic: true,
      },
    })

    // 2. Find vaccinations due in next 3 days or overdue where reminder not yet sent
    const pendingVaccinations = await prisma.vaccination.findMany({
      where: {
        nextDueDate: {
          not: null,
          lte: inThreeDays,
        },
        reminderSent: false,
      },
      include: {
        patient: true,
        clinic: true,
      },
    })

    const results = {
      triggeredFollowUps: 0,
      triggeredVaccines: 0,
      timestamp: now.toISOString(),
    }

    // Process Follow-ups
    for (const rx of upcomingFollowUps) {
      if (rx.nextVisitDate && rx.patient.phone) {
        const dueDateStr = new Date(rx.nextVisitDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        const msg = formatFollowUpReminderMessage({
          clinicName: rx.clinic.name,
          patientName: rx.patient.ownerName,
          dueDate: dueDateStr,
          isVet: rx.clinic.type === 'VET',
          petName: rx.patient.petName,
        })

        await sendWhatsAppNotification({
          clinicId: rx.clinicId,
          patientId: rx.patientId,
          phone: rx.patient.phone,
          type: 'VISIT_REMINDER',
          message: msg,
        })

        results.triggeredFollowUps += 1
      }
    }

    // Process Vaccinations
    for (const vac of pendingVaccinations) {
      if (vac.nextDueDate && vac.patient.phone) {
        const dueDateStr = new Date(vac.nextDueDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        const msg = formatVaccineReminderMessage({
          clinicName: vac.clinic.name,
          petName: vac.patient.petName || 'Pet',
          ownerName: vac.patient.ownerName,
          vaccineName: vac.vaccineName,
          dueDate: dueDateStr,
        })

        await sendWhatsAppNotification({
          clinicId: vac.clinicId,
          patientId: vac.patientId,
          phone: vac.patient.phone,
          type: 'VACCINE_REMINDER',
          message: msg,
        })

        await prisma.vaccination.update({
          where: { id: vac.id },
          data: { reminderSent: true },
        })

        results.triggeredVaccines += 1
      }
    }

    return NextResponse.json({
      success: true,
      summary: results,
      totalSent: results.triggeredFollowUps + results.triggeredVaccines,
    })
  } catch (error: any) {
    console.error('Error running reminders cron:', error)
    return NextResponse.json(
      { error: error.message || 'Cron execution failed' },
      { status: 500 }
    )
  }
}
