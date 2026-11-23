'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  Share2,
  Receipt,
  Phone,
  MapPin,
  CheckCircle2,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  PawPrint,
  Stethoscope,
  X,
} from 'lucide-react'

export interface InvoiceData {
  id: string
  consultationFee: number
  extraCharges: number
  totalAmount: number
  paymentMode: string | null
  status: 'PAID' | 'PENDING'
  createdAt: string | Date
  clinic: {
    id?: string
    name: string
    slug?: string
    type: 'HUMAN' | 'VET'
    address?: string | null
    phone?: string | null
    themeColor?: string | null
  }
  appointment: {
    id: string
    tokenNumber: number
    slot: string
    date: string | Date
    notes?: string | null
    patient: {
      id: string
      ownerName: string
      phone: string
      age?: number | null
      gender?: string | null
      petName?: string | null
      petSpecies?: string | null
      petBreed?: string | null
      petWeight?: number | null
    }
  }
}

interface PrintableReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: InvoiceData | null
  doctorName?: string
}

const SPECIES_ICONS: Record<string, string> = {
  Dog: '🐶',
  Cat: '🐱',
  Bird: '🦜',
  Rabbit: '🐰',
  Other: '🐾',
}

export function PrintableReceiptModal({
  open,
  onOpenChange,
  invoice,
  doctorName,
}: PrintableReceiptModalProps) {
  if (!invoice) return null

  const clinic = invoice.clinic
  const appointment = invoice.appointment
  const patient = appointment.patient
  const isVet = clinic.type === 'VET'
  const themeColor = clinic.themeColor || (isVet ? '#10b981' : '#0ea5e9')

  const handlePrint = () => {
    window.print()
  }

  // Format Receipt ID
  const receiptNumber = `RCP-${new Date(invoice.createdAt).getFullYear()}-${invoice.id.slice(-6).toUpperCase()}`

  // Format Date & Time
  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const invoiceTime = new Date(invoice.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Format WhatsApp Share message
  const getWhatsAppShareUrl = () => {
    const patientName = isVet
      ? `${patient.petName} (${patient.petSpecies} - Owner: ${patient.ownerName})`
      : patient.ownerName

    const message = `🧾 *RECEIPT / BILL - ${clinic.name}*
---------------------------------------
*Receipt No:* ${receiptNumber}
*Date:* ${invoiceDate} at ${invoiceTime}
*Token No:* #${appointment.tokenNumber} (${appointment.slot})
*Patient:* ${patientName}
*Phone:* ${patient.phone}

*ITEMIZED CHARGES:*
• Consultation Fee: ₹${invoice.consultationFee.toLocaleString('en-IN')}
${invoice.extraCharges > 0 ? `• Extra / Procedures / Medicines: ₹${invoice.extraCharges.toLocaleString('en-IN')}\n` : ''}---------------------------------------
*TOTAL AMOUNT:* ₹${invoice.totalAmount.toLocaleString('en-IN')}
*Payment Mode:* ${invoice.paymentMode || 'UPI'}
*Payment Status:* ${invoice.status === 'PAID' ? 'PAID ✅' : 'PENDING ⏳'}
---------------------------------------
${clinic.phone ? `Contact: ${clinic.phone}\n` : ''}${clinic.address ? `${clinic.address}\n` : ''}Thank you for choosing ${clinic.name}!`

    const cleanPhone = patient.phone.replace(/[^0-9]/g, '')
    // Default to Indian prefix if 10 digits
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
  }

  const getPaymentModeIcon = (mode: string | null) => {
    switch (mode?.toUpperCase()) {
      case 'UPI':
        return <Smartphone className="w-4 h-4 text-emerald-600" />
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'CASH':
      default:
        return <Banknote className="w-4 h-4 text-amber-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white max-h-[92vh] flex flex-col">
        {/* MODAL ACTION BAR - HIDDEN DURING PRINT */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 leading-none">
                Digital Invoice & Receipt
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">{receiptNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold h-8"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-gray-500" />
              Print Receipt
            </Button>

            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Share on WhatsApp
              </Button>
            </a>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="overflow-y-auto p-6 flex-1 bg-white" id="printable-receipt">
          <div className="max-w-xl mx-auto border border-gray-200 rounded-2xl p-6 sm:p-8 bg-white shadow-xs">
            {/* CLINIC BRANDED HEADER */}
            <div className="border-b-2 pb-6" style={{ borderColor: themeColor }}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs"
                      style={{ backgroundColor: themeColor }}
                    >
                      {isVet ? <PawPrint className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight">
                        {clinic.name}
                      </h2>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold mt-0.5"
                        style={{
                          backgroundColor: `${themeColor}15`,
                          color: themeColor,
                        }}
                      >
                        {isVet ? 'Veterinary Hospital & Pet Care' : 'Dental & Healthcare Clinic'}
                      </Badge>
                    </div>
                  </div>

                  {clinic.address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      <span>{clinic.address}</span>
                    </p>
                  )}
                  {clinic.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      <span>{clinic.phone}</span>
                    </p>
                  )}
                </div>

                {/* Token Badge on Header */}
                <div
                  className="rounded-2xl p-3 text-center text-white font-extrabold flex-shrink-0 min-w-20 shadow-xs"
                  style={{ backgroundColor: themeColor }}
                >
                  <p className="text-[10px] uppercase tracking-wider opacity-85">Token</p>
                  <p className="text-2xl font-black leading-none mt-0.5">#{appointment.tokenNumber}</p>
                  <p className="text-[10px] opacity-85 font-mono mt-1">{appointment.slot}</p>
                </div>
              </div>
            </div>

            {/* RECEIPT META & PATIENT DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-gray-100 text-xs">
              <div className="space-y-2">
                <p className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">
                  Billed To
                </p>
                {isVet ? (
                  <div>
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <span>{SPECIES_ICONS[patient.petSpecies || 'Other'] || '🐾'}</span>
                      <span>{patient.petName || 'Pet'}</span>
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        {patient.petSpecies}
                      </span>
                    </p>
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium text-gray-700">Owner:</span> {patient.ownerName}
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      {patient.petBreed ? `${patient.petBreed} · ` : ''}
                      {patient.petWeight ? `${patient.petWeight} kg · ` : ''}
                      {patient.age ? `${patient.age} yrs` : ''}
                    </p>
                    <p className="text-gray-600 font-mono mt-1">{patient.phone}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-gray-900">{patient.ownerName}</p>
                    <p className="text-gray-500 mt-0.5">
                      {patient.age ? `${patient.age} yrs` : ''}
                      {patient.age && patient.gender ? ' · ' : ''}
                      {patient.gender || ''}
                    </p>
                    <p className="text-gray-600 font-mono mt-1">{patient.phone}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:text-right">
                <p className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">
                  Receipt Details
                </p>
                <div>
                  <p className="font-bold text-gray-900 font-mono text-sm">{receiptNumber}</p>
                  <p className="text-gray-500 mt-1 flex items-center sm:justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{invoiceDate}</span>
                  </p>
                  <p className="text-gray-500 mt-0.5 flex items-center sm:justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{invoiceTime}</span>
                  </p>
                  {doctorName && (
                    <p className="text-gray-600 mt-1">
                      <span className="text-gray-500">Doctor:</span> {doctorName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ITEMIZED BILL TABLE */}
            <div className="py-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                    <th className="text-left pb-2">Description</th>
                    <th className="text-right pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3">
                      <p className="font-semibold text-gray-800">Doctor Consultation Fee</p>
                      <p className="text-gray-400 text-[11px]">General clinical examination & diagnosis</p>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      ₹{invoice.consultationFee.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {invoice.extraCharges > 0 && (
                    <tr>
                      <td className="py-3">
                        <p className="font-semibold text-gray-800">Additional Charges / Services</p>
                        <p className="text-gray-400 text-[11px]">
                          {appointment.notes ? appointment.notes : 'Procedures, lab investigation, or medications'}
                        </p>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        ₹{invoice.extraCharges.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* TOTAL SUMMARY BOX */}
              <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Taxes / GST</span>
                  <span className="text-emerald-600 font-medium">Included (₹0)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Total Amount</span>
                  <span
                    className="text-2xl font-black"
                    style={{ color: themeColor }}
                  >
                    ₹{invoice.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT STATUS & MODE BANNER */}
            <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Payment Mode:</span>
                <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                  {getPaymentModeIcon(invoice.paymentMode)}
                  {invoice.paymentMode || 'UPI'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Status:</span>
                {invoice.status === 'PAID' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    PAID
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-bold border border-amber-200">
                    PENDING
                  </Badge>
                )}
              </div>
            </div>

            {/* FOOTER NOTE & STAMP */}
            <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center space-y-1">
              <p className="text-[11px] font-medium text-gray-600">
                This is a computer-generated digital receipt. No physical signature required.
              </p>
              <p className="text-[10px] text-gray-400">
                Powered by SparkNexz Clinic & Vet OS · www.sparknexz.com
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
