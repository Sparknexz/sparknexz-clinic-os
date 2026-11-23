import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export interface WhatsAppNotificationPayload {
  clinicId: string
  patientId?: string | null
  phone: string
  type: 'BOOKING_CONFIRMATION' | 'PRESCRIPTION_READY' | 'VISIT_REMINDER' | 'VACCINE_REMINDER'
  message: string
}

/**
 * Clean phone number into international format without symbols (defaults to Indian 91 country code)
 */
export function sanitizePhoneNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.length === 10) {
    return `91${digits}`
  }
  return digits
}

/**
 * Build a 1-click wa.me URL for instant zero-cost WhatsApp messaging
 */
export function getWhatsAppDirectLink(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone)
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Core WhatsApp notification sender & audit logger
 */
export async function sendWhatsAppNotification({
  clinicId,
  patientId,
  phone,
  type,
  message,
}: WhatsAppNotificationPayload) {
  const apiUrl = process.env.WHATSAPP_API_URL
  const apiToken = process.env.WHATSAPP_API_TOKEN
  const cleanPhone = sanitizePhoneNumber(phone)

  let status: 'SENT' | 'LOGGED' = 'LOGGED'

  // If live provider credentials exist (Meta Cloud API / WATI / Interakt)
  if (apiUrl && apiToken) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          to: cleanPhone,
          message,
          type: 'text',
        }),
      })

      if (response.ok) {
        status = 'SENT'
      } else {
        console.warn(`[WhatsApp Provider Error] Status: ${response.status}`, await response.text())
      }
    } catch (apiErr) {
      console.error('[WhatsApp API Exception]', apiErr)
    }
  } else {
    // Zero-Cost Default Local / Console Logging
    console.log(`\n======================================================`)
    console.log(`📱 [SPARKNEXZ WHATSAPP NOTIFICATION - ${type}]`)
    console.log(`To: ${cleanPhone} | ClinicId: ${clinicId}`)
    console.log(`Message:\n${message}`)
    console.log(`======================================================\n`)
  }

  // Record audit trail in database
  try {
    const log = await prisma.notificationLog.create({
      data: {
        clinicId,
        patientId: patientId || undefined,
        phone,
        type: type as NotificationType,
        message,
        status,
      },
    })
    return log
  } catch (dbErr) {
    console.error('[NotificationLog DB Save Error]', dbErr)
    return null
  }
}

// -------------------------------------------------------------
// MESSAGE FORMATTING TEMPLATES
// -------------------------------------------------------------

export function formatBookingConfirmationMessage({
  clinicName,
  tokenNumber,
  slot,
  date,
  queueUrl,
  patientName,
  isVet = false,
  petName,
}: {
  clinicName: string
  tokenNumber: number
  slot: string
  date: string
  queueUrl?: string
  patientName: string
  isVet?: boolean
  petName?: string | null
}): string {
  const displayName = isVet && petName ? `${petName} (Parent: ${patientName})` : patientName

  return `✅ *APPOINTMENT CONFIRMED - ${clinicName}*
---------------------------------------
Hello ${patientName}! Your visit has been successfully booked.

🎟️ *Token Number:* #${tokenNumber}
📅 *Date:* ${date}
⏰ *Time Slot:* ${slot}
👤 *Patient / Pet:* ${displayName}

${queueUrl ? `📺 *Live Queue & Wait Status:* ${queueUrl}\n` : ''}---------------------------------------
Please arrive 10 minutes prior to your slot. Thank you for choosing ${clinicName}!`
}

export function formatPrescriptionReadyMessage({
  clinicName,
  patientName,
  diagnosis,
  medicinesSummary,
  nextVisitDate,
  isVet = false,
  petName,
}: {
  clinicName: string
  patientName: string
  diagnosis?: string | null
  medicinesSummary?: string | null
  nextVisitDate?: string | null
  isVet?: boolean
  petName?: string | null
}): string {
  const displayName = isVet && petName ? `${petName} (Parent: ${patientName})` : patientName

  return `🩺 *DIGITAL PRESCRIPTION & VISIT SUMMARY - ${clinicName}*
---------------------------------------
Dear ${patientName}, here is your medical consultation summary for ${displayName}:

${diagnosis ? `📋 *Diagnosis / Assessment:* ${diagnosis}\n` : ''}${medicinesSummary ? `💊 *Prescribed Medications:*\n${medicinesSummary}\n` : ''}${nextVisitDate ? `🗓️ *Next Follow-up Visit:* ${nextVisitDate}\n` : ''}---------------------------------------
Take medications as prescribed with plenty of rest. We wish you a speedy recovery!`
}

export function formatFollowUpReminderMessage({
  clinicName,
  patientName,
  dueDate,
  isVet = false,
  petName,
}: {
  clinicName: string
  patientName: string
  dueDate: string
  isVet?: boolean
  petName?: string | null
}): string {
  const displayName = isVet && petName ? `${petName} (Parent: ${patientName})` : patientName

  return `⏰ *FOLLOW-UP VISIT REMINDER - ${clinicName}*
---------------------------------------
Dear ${patientName}, this is a gentle reminder regarding your upcoming medical follow-up for *${displayName}*:

📅 *Scheduled Follow-Up:* ${dueDate}
🏥 *Clinic:* ${clinicName}

Regular follow-ups ensure optimal healing and recovery. Please reply to this message or visit our clinic to confirm your slot.`
}

export function formatVaccineReminderMessage({
  clinicName,
  petName,
  ownerName,
  vaccineName,
  dueDate,
}: {
  clinicName: string
  petName: string
  ownerName: string
  vaccineName: string
  dueDate: string
}): string {
  return `🐾 *PET VACCINATION REMINDER - ${clinicName}*
---------------------------------------
Dear ${ownerName}, keeping *${petName}* protected is our priority!

💉 *Vaccine Due:* ${vaccineName}
📅 *Due Date:* ${dueDate}
🏥 *Hospital:* ${clinicName}

Timely immunization shields your pet from critical infections. Visit us soon or book a slot online. Reply here for any questions!`
}
