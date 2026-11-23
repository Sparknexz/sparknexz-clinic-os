'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Receipt,
  IndianRupee,
  Smartphone,
  Banknote,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  PawPrint,
  Clock,
  Sparkles,
  Phone,
  Plus,
} from 'lucide-react'
import { InvoiceData } from './PrintableReceiptModal'

export interface SelectableAppointment {
  id: string
  tokenNumber: number
  slot: string
  date: string | Date
  status: string
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

interface GenerateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clinicType: 'HUMAN' | 'VET'
  clinicThemeColor?: string
  appointments: SelectableAppointment[]
  preselectedAppointmentId?: string | null
  onInvoiceCreated: (invoice: InvoiceData) => void
}

const CONSULTATION_FEE_PRESETS = [300, 500, 800, 1000]

const EXTRA_CHARGES_PRESETS = [
  { label: '+ ₹200 Dressing', amount: 200 },
  { label: '+ ₹350 Medicine', amount: 350 },
  { label: '+ ₹500 Lab / Test', amount: 500 },
  { label: '+ ₹800 Procedure', amount: 800 },
]

export function GenerateInvoiceModal({
  open,
  onOpenChange,
  clinicType,
  clinicThemeColor = '#0ea5e9',
  appointments,
  preselectedAppointmentId,
  onInvoiceCreated,
}: GenerateInvoiceModalProps) {
  const isVet = clinicType === 'VET'

  const [selectedApptId, setSelectedApptId] = useState<string>('')
  const [consultationFee, setConsultationFee] = useState<number>(500)
  const [extraCharges, setExtraCharges] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID')
  const [notes, setNotes] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Sync preselected appointment when modal opens
  useEffect(() => {
    if (open) {
      setError(null)
      if (preselectedAppointmentId) {
        setSelectedApptId(preselectedAppointmentId)
      } else if (appointments.length > 0) {
        // default to first active or completed appointment
        const first = appointments.find((a) => a.status === 'COMPLETED') || appointments[0]
        setSelectedApptId(first.id)
      }
    }
  }, [open, preselectedAppointmentId, appointments])

  const selectedAppointment = appointments.find((a) => a.id === selectedApptId)
  const totalAmount = (Number(consultationFee) || 0) + (Number(extraCharges) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApptId) {
      setError('Please select an appointment')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedApptId,
          consultationFee,
          extraCharges,
          paymentMode,
          status: paymentStatus,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invoice')
      }

      onOpenChange(false)
      onInvoiceCreated(data.invoice)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div
          className="p-5 text-white"
          style={{ backgroundColor: clinicThemeColor }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Generate Invoice & Digital Bill
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-0.5">
                Issue an itemized receipt with instant WhatsApp share & print options
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* APPOINTMENT SELECTOR */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Select Patient / Appointment
            </Label>
            {appointments.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                No appointments found for today. Register or check in a patient first.
              </div>
            ) : (
              <select
                value={selectedApptId}
                onChange={(e) => setSelectedApptId(e.target.value)}
                className="w-full text-xs font-medium border border-gray-300 rounded-xl px-3 py-2.5 bg-white text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                required
              >
                {appointments.map((appt) => {
                  const pt = appt.patient
                  const label = isVet
                    ? `Token #${appt.tokenNumber} - ${pt.petName || 'Pet'} (${pt.petSpecies} - ${pt.ownerName}) [${appt.slot}] · ${appt.status}`
                    : `Token #${appt.tokenNumber} - ${pt.ownerName} (${pt.phone}) [${appt.slot}] · ${appt.status}`
                  return (
                    <option key={appt.id} value={appt.id}>
                      {label}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* PREVIEW SELECTED PATIENT CARD */}
          {selectedAppointment && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white font-extrabold flex-shrink-0"
                  style={{ backgroundColor: clinicThemeColor }}
                >
                  <span className="text-[8px] uppercase">Token</span>
                  <span className="text-sm leading-none font-bold">
                    #{selectedAppointment.tokenNumber}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    {isVet
                      ? `${selectedAppointment.patient.petName} (${selectedAppointment.patient.petSpecies} · Owner: ${selectedAppointment.patient.ownerName})`
                      : selectedAppointment.patient.ownerName}
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {selectedAppointment.patient.phone}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {selectedAppointment.slot}
                    </span>
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] ${
                  selectedAppointment.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {selectedAppointment.status}
              </Badge>
            </div>
          )}

          {/* CONSULTATION FEE WITH QUICK CHIPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Doctor Consultation Fee (₹)
              </Label>
              <span className="text-xs font-bold text-emerald-700">
                ₹{consultationFee.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                  ₹
                </span>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Math.max(0, Number(e.target.value)))}
                  className="pl-7 text-xs font-semibold"
                  placeholder="500"
                  required
                />
              </div>

              {/* Fast 1-click Preset Chips */}
              <div className="flex gap-1.5 flex-wrap">
                {CONSULTATION_FEE_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setConsultationFee(amt)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      consultationFee === amt
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EXTRA CHARGES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Extra Charges / Lab / Procedures (₹)
              </Label>
              <span className="text-xs text-gray-500">
                ₹{extraCharges.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                ₹
              </span>
              <Input
                type="number"
                min="0"
                step="50"
                value={extraCharges}
                onChange={(e) => setExtraCharges(Math.max(0, Number(e.target.value)))}
                className="pl-7 text-xs font-semibold"
                placeholder="0"
              />
            </div>

            {/* Quick Extra Chips */}
            <div className="flex gap-1.5 flex-wrap pt-1">
              {EXTRA_CHARGES_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setExtraCharges((prev) => prev + p.amount)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5 text-gray-400" />
                  {p.label}
                </button>
              ))}
              {extraCharges > 0 && (
                <button
                  type="button"
                  onClick={() => setExtraCharges(0)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  Reset Extra
                </button>
              )}
            </div>
          </div>

          {/* PAYMENT MODE SELECTOR */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Payment Mode
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'UPI',
                  label: 'UPI / QR',
                  icon: Smartphone,
                  desc: 'GPay, PhonePe, Paytm',
                  color: 'border-emerald-500 bg-emerald-50/50 text-emerald-800',
                },
                {
                  id: 'Cash',
                  label: 'Cash',
                  icon: Banknote,
                  desc: 'Physical Currency',
                  color: 'border-amber-500 bg-amber-50/50 text-amber-800',
                },
                {
                  id: 'Card',
                  label: 'Card',
                  icon: CreditCard,
                  desc: 'Debit / Credit POS',
                  color: 'border-blue-500 bg-blue-50/50 text-blue-800',
                },
              ].map((mode) => {
                const Icon = mode.icon
                const isSelected = paymentMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? `${mode.color} border-2 shadow-xs`
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4" />
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-bold leading-none">{mode.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mode.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* PAYMENT STATUS TOGGLE */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Payment Status
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('PAID')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  paymentStatus === 'PAID'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark as PAID (Collected)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('PENDING')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  paymentStatus === 'PENDING'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Keep PENDING
              </button>
            </div>
          </div>

          {/* TOTAL AMOUNT HIGHLIGHT CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Total Billable Amount
              </p>
              <p className="text-xs text-gray-300 mt-0.5">
                ₹{consultationFee} (Consult) + ₹{extraCharges} (Extra)
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black tracking-tight text-emerald-400">
                ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading || !selectedApptId}
              className="w-full h-11 text-sm font-bold text-white shadow-md transition-all"
              style={{ backgroundColor: clinicThemeColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Invoice...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Save & Generate Digital Receipt
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
