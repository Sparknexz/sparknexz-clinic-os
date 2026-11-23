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
  Stethoscope,
  PawPrint,
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  X,
} from 'lucide-react'

interface Medicine {
  name: string
  dosage: string
  timing: string
  duration: string
}

interface PrintablePrescriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clinic: {
    name: string
    address?: string | null
    phone?: string | null
    themeColor?: string | null
    type: 'HUMAN' | 'VET'
  }
  doctorName: string
  appointment: {
    tokenNumber: number
    date: string
    slot: string
  }
  patient: {
    ownerName: string
    phone: string
    age?: number | null
    gender?: string | null
    petName?: string | null
    petSpecies?: string | null
    petBreed?: string | null
    petWeight?: number | null
  }
  prescription: {
    id?: string
    symptoms?: string | null
    diagnosis?: string | null
    medicines: Medicine[]
    nextVisitDate?: string | null
  }
}

const SPECIES_ICONS: Record<string, string> = {
  Dog: '🐶',
  Cat: '🐱',
  Bird: '🦜',
  Rabbit: '🐰',
  Other: '🐾',
}

export function PrintablePrescriptionModal({
  open,
  onOpenChange,
  clinic,
  doctorName,
  appointment,
  patient,
  prescription,
}: PrintablePrescriptionModalProps) {
  const isVet = clinic.type === 'VET'
  const themeColor = clinic.themeColor || (isVet ? '#10b981' : '#0ea5e9')

  const handlePrint = () => {
    window.print()
  }

  // Construct WhatsApp Share link
  const getWhatsAppShareUrl = () => {
    const patientText = isVet
      ? `${patient.petName} (${patient.petSpecies} - Owner: ${patient.ownerName})`
      : patient.ownerName

    const medsText = prescription.medicines
      .map(
        (m, idx) =>
          `${idx + 1}. *${m.name}* - ${m.dosage || '1-0-1'} (${m.timing || 'After Food'}) for ${m.duration || '5 Days'}`
      )
      .join('\n')

    const message = `📋 *PRESCRIPTION - ${clinic.name}*
👨‍⚕️ *Doctor:* ${doctorName}
🎟️ *Token:* #${appointment.tokenNumber} | 🗓️ *Date:* ${new Date().toLocaleDateString('en-IN')}
👤 *Patient:* ${patientText}
${prescription.diagnosis ? `🩺 *Diagnosis:* ${prescription.diagnosis}\n` : ''}
💊 *Prescribed Medications:*
${medsText || 'No medications listed.'}
${
  prescription.nextVisitDate
    ? `\n📅 *Next Follow-up:* ${new Date(prescription.nextVisitDate).toLocaleDateString('en-IN')}`
    : ''
}
${clinic.phone ? `📞 Clinic Phone: ${clinic.phone}` : ''}
_Generated via SparkNexz Clinic OS_`

    return `https://wa.me/?text=${encodeURIComponent(message)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
        {/* ACTION BAR AT TOP (Hidden during printing) */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200/80 mb-3 flex items-center justify-between gap-3 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Consultation Complete · Ready for Patient
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Rx via WhatsApp
            </a>

            <Button
              onClick={handlePrint}
              size="sm"
              className="text-white font-medium text-xs shadow-xs"
              style={{ backgroundColor: themeColor }}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              🖨️ Print / Save as PDF
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>

        {/* PRINTABLE A4 PRESCRIPTION CARD */}
        <div
          id="printable-rx"
          className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-200 relative text-gray-900 font-sans print:p-0 print:border-0 print:shadow-none print:m-0"
        >
          {/* Top Decorative Clinic Accent Line */}
          <div
            className="h-2.5 w-full rounded-t-xl absolute top-0 left-0"
            style={{ backgroundColor: themeColor }}
          />

          {/* HEADER SECTION */}
          <div className="pb-6 border-b-2 border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-2">
            {/* Clinic Info */}
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl flex-shrink-0 shadow-sm"
                style={{ backgroundColor: themeColor }}
              >
                {isVet ? <PawPrint className="w-8 h-8" /> : <Stethoscope className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-950 tracking-tight">
                  {clinic.name}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    isVet
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold mt-1'
                      : 'bg-blue-50 text-blue-800 border-blue-300 text-[10px] font-bold mt-1'
                  }
                >
                  {isVet ? '🐾 VETERINARY HOSPITAL' : '🏥 MEDICAL CLINIC'}
                </Badge>
                {clinic.address && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{clinic.address}</span>
                  </p>
                )}
                {clinic.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{clinic.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Doctor Info & Token */}
            <div className="sm:text-right space-y-1">
              <p className="text-sm font-extrabold text-gray-900">{doctorName}</p>
              <p className="text-xs text-gray-500">
                {isVet ? 'Consulting Veterinary Surgeon' : 'Consulting Physician & Surgeon'}
              </p>
              <div className="inline-block mt-2">
                <span
                  className="px-3 py-1 rounded-lg text-white font-mono font-black text-xs shadow-xs"
                  style={{ backgroundColor: themeColor }}
                >
                  TOKEN #{appointment.tokenNumber}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-1">
                Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* PATIENT / PET DETAILS BANNER */}
          <div className="my-5 p-4 rounded-xl bg-gray-50/80 border border-gray-200/90 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  {isVet ? 'Pet Name' : 'Patient Name'}
                </span>
                <span className="text-sm font-extrabold text-gray-900 mt-0.5 block truncate">
                  {isVet ? (patient.petName || 'Pet') : patient.ownerName}
                </span>
                {isVet && (
                  <span className="text-xs text-emerald-700 font-semibold block">
                    {SPECIES_ICONS[patient.petSpecies || 'Other'] || '🐾'} {patient.petSpecies}
                    {patient.petBreed ? ` · ${patient.petBreed}` : ''}
                  </span>
                )}
              </div>

              {isVet ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                    Owner Name
                  </span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block truncate">
                    {patient.ownerName}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{patient.phone}</span>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                    Age & Gender
                  </span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                    {patient.age ? `${patient.age} yrs` : 'N/A'} {patient.gender ? `· ${patient.gender}` : ''}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{patient.phone}</span>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  {isVet ? 'Age & Weight' : 'Contact Phone'}
                </span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {isVet ? (
                    <>
                      {patient.age ? `${patient.age} yrs` : 'N/A'}{' '}
                      {patient.petWeight ? `· ${patient.petWeight}kg` : ''}
                    </>
                  ) : (
                    patient.phone
                  )}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Slot / Time
                </span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {appointment.slot}
                </span>
              </div>
            </div>
          </div>

          {/* CLINICAL FINDINGS: SYMPTOMS & DIAGNOSIS */}
          {(prescription.symptoms || prescription.diagnosis) && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {prescription.symptoms && (
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                    Symptoms / Chief Complaints
                  </span>
                  <p className="text-gray-800 leading-relaxed font-medium">
                    {prescription.symptoms}
                  </p>
                </div>
              )}

              {prescription.diagnosis && (
                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40">
                  <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block mb-1">
                    Clinical Diagnosis
                  </span>
                  <p className="text-blue-950 font-bold leading-relaxed">
                    {prescription.diagnosis}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* RX SYMBOL & MEDICINES TABLE */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-serif italic font-extrabold text-2xl text-gray-900">
                ℞
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Prescribed Medications
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100/90 text-gray-700 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Medicine & Strength</th>
                    <th className="py-2.5 px-3">Dosage</th>
                    <th className="py-2.5 px-3">Timing</th>
                    <th className="py-2.5 px-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {prescription.medicines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        No medications prescribed.
                      </td>
                    </tr>
                  ) : (
                    prescription.medicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-gray-900 text-sm">
                          {med.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-xs">
                            {med.dosage || '1-0-1'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-700">
                          {med.timing || 'After Food'}
                        </td>
                        <td className="py-3 px-3 text-gray-800 font-semibold">
                          {med.duration || '5 Days'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* NEXT VISIT & SIGNATURE SECTION */}
          <div className="pt-6 border-t-2 border-gray-200 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs">
            {/* Follow-up info */}
            <div>
              {prescription.nextVisitDate ? (
                <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>
                    Next Follow-up Visit:{' '}
                    <strong className="font-bold">
                      {new Date(prescription.nextVisitDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>
                  </span>
                </div>
              ) : (
                <span className="text-gray-400">Next Visit: As advised / SOS</span>
              )}
              <p className="text-[10px] text-gray-400 mt-2">
                * Please bring this prescription slip on your next visit.
              </p>
            </div>

            {/* Doctor Signature Block */}
            <div className="text-center sm:text-right space-y-1">
              <div className="w-44 h-12 border-b-2 border-gray-400 mx-auto sm:ml-auto sm:mr-0 flex items-end justify-center pb-1">
                <span className="font-serif italic text-gray-400 text-xs">Doctor Signature</span>
              </div>
              <p className="font-bold text-gray-900 text-sm mt-1">{doctorName}</p>
              <p className="text-[11px] text-gray-400">Authorized Medical Stamp</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
