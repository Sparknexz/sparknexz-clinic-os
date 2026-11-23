'use client'

import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  User,
  MapPin,
  PawPrint,
  Stethoscope,
  CheckCircle2,
  Share2,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  QrCode,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface ClinicData {
  id: string
  name: string
  slug: string
  type: 'HUMAN' | 'VET'
  address?: string | null
  phone?: string | null
  logoUrl?: string | null
  themeColor?: string | null
}

interface PublicBookingFormProps {
  clinic: ClinicData
}

const MORNING_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
]

const EVENING_SLOTS = [
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
]

const SPECIES_OPTIONS = [
  { label: 'Dog 🐶', value: 'Dog' },
  { label: 'Cat 🐱', value: 'Cat' },
  { label: 'Bird 🦜', value: 'Bird' },
  { label: 'Rabbit 🐰', value: 'Rabbit' },
  { label: 'Other 🐾', value: 'Other' },
]

export function PublicBookingForm({ clinic }: PublicBookingFormProps) {
  const isVet = clinic.type === 'VET'
  const themeColor = clinic.themeColor || (isVet ? '#10b981' : '#0ea5e9')

  // Form State
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')

  // Vet fields
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('Dog')
  const [petBreed, setPetBreed] = useState('')
  const [petWeight, setPetWeight] = useState('')

  // Appointment fields
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [slot, setSlot] = useState('10:00 AM')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Confirmation Pass State
  const [confirmationData, setConfirmationData] = useState<{
    tokenNumber: number
    appointment: any
    clinic: any
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const payload: any = {
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        age: age ? parseInt(age, 10) : null,
        gender: !isVet ? gender : null,
        petName: isVet ? petName.trim() : null,
        petSpecies: isVet ? petSpecies : null,
        petBreed: isVet ? petBreed.trim() : null,
        petWeight: isVet && petWeight ? parseFloat(petWeight) : null,
        date,
        slot,
        notes: notes.trim(),
      }

      if (!payload.ownerName || !payload.phone) {
        setErrorMessage('Please provide your name and phone number.')
        setIsSubmitting(false)
        return
      }

      if (isVet && !payload.petName) {
        setErrorMessage('Please provide your pet name.')
        setIsSubmitting(false)
        return
      }

      const res = await fetch(`/api/public/book/${clinic.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to book appointment. Please try again.')
        return
      }

      setConfirmationData(data)
    } catch (err) {
      console.error('Booking error:', err)
      setErrorMessage('Something went wrong. Please check your internet connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setConfirmationData(null)
    setOwnerName('')
    setPhone('')
    setAge('')
    setPetName('')
    setPetBreed('')
    setPetWeight('')
    setNotes('')
    setErrorMessage('')
  }

  // Construct WhatsApp Share message
  const getWhatsAppShareUrl = () => {
    if (!confirmationData) return '#'
    const appt = confirmationData.appointment
    const token = confirmationData.tokenNumber

    const patientText = isVet
      ? `${appt.patient.petName} (${appt.patient.petSpecies} - Owner: ${appt.patient.ownerName})`
      : appt.patient.ownerName

    const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    const message = `🏥 *Appointment Confirmed!*
📍 *Clinic:* ${clinic.name}
🎟️ *Token Number:* #${token}
👤 *Patient:* ${patientText}
🗓️ *Date:* ${formattedDate}
⏰ *Slot:* ${appt.slot}
${clinic.address ? `📍 *Address:* ${clinic.address}\n` : ''}${clinic.phone ? `📞 *Phone:* ${clinic.phone}\n` : ''}
_Please arrive 10 minutes before your slot. Thank you!_`

    return `https://wa.me/?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* CLINIC HEADER CARD */}
        <div className="text-center space-y-3 pt-2">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl shadow-lg transform transition-transform hover:scale-105"
            style={{ backgroundColor: themeColor }}
          >
            {isVet ? <PawPrint className="w-9 h-9" /> : <Stethoscope className="w-9 h-9" />}
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {clinic.name}
              </h1>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge
                className={
                  isVet
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold'
                    : 'bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold'
                }
              >
                {isVet ? '🐾 Veterinary Hospital' : '🏥 Medical Clinic'}
              </Badge>
              <Badge variant="outline" className="text-xs text-gray-600 border-gray-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Clinic
              </Badge>
            </div>

            {clinic.address && (
              <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1 max-w-md mx-auto">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>{clinic.address}</span>
              </p>
            )}
          </div>
        </div>

        {/* CONFIRMATION SCREEN / DIGITAL APPOINTMENT PASS */}
        {confirmationData ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
            {/* PASS CARD */}
            <div className="rounded-3xl bg-white border-2 border-emerald-500 shadow-2xl overflow-hidden relative">
              {/* Top Banner */}
              <div
                className="p-6 text-white text-center relative"
                style={{ backgroundColor: themeColor }}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  Appointment Confirmed
                </div>
                <h2 className="text-xl font-bold">{clinic.name}</h2>
                <p className="text-xs opacity-90 mt-0.5">Official Digital Queue Pass</p>
              </div>

              {/* Middle: Big Token Number */}
              <div className="p-6 text-center bg-gradient-to-b from-emerald-50/50 to-white border-b border-dashed border-gray-300 relative">
                {/* Notches for boarding pass look */}
                <div className="w-6 h-6 rounded-full bg-slate-50 absolute -left-3 -bottom-3 border-r border-gray-300" />
                <div className="w-6 h-6 rounded-full bg-slate-50 absolute -right-3 -bottom-3 border-l border-gray-300" />

                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  YOUR TOKEN NUMBER
                </span>
                <div
                  className="text-7xl font-mono font-black my-2 tracking-tight"
                  style={{ color: themeColor }}
                >
                  #{String(confirmationData.tokenNumber).padStart(2, '0')}
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  Please show this token number at the reception desk upon arrival.
                </p>
              </div>

              {/* Pass Details */}
              <div className="p-6 space-y-4 bg-white text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {isVet ? 'Pet & Owner' : 'Patient Name'}
                    </span>
                    <p className="font-bold text-gray-900">
                      {isVet
                        ? `${confirmationData.appointment.patient.petName} (${confirmationData.appointment.patient.ownerName})`
                        : confirmationData.appointment.patient.ownerName}
                    </p>
                    {isVet && confirmationData.appointment.patient.petSpecies && (
                      <p className="text-xs text-emerald-700 font-medium">
                        {confirmationData.appointment.patient.petSpecies}
                        {confirmationData.appointment.patient.petBreed
                          ? ` · ${confirmationData.appointment.patient.petBreed}`
                          : ''}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Phone Number
                    </span>
                    <p className="font-bold text-gray-900 font-mono">
                      {confirmationData.appointment.patient.phone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Date
                    </span>
                    <p className="font-bold text-gray-900">
                      {new Date(confirmationData.appointment.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Time Slot
                    </span>
                    <p className="font-bold text-gray-900">
                      {confirmationData.appointment.slot}
                    </p>
                  </div>
                </div>

                {confirmationData.appointment.notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Reason for Visit
                    </span>
                    <p className="text-xs text-gray-700 mt-0.5">
                      {confirmationData.appointment.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <QrCode className="w-4 h-4 text-gray-400" /> PASS ID: {confirmationData.appointment.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-emerald-600 font-semibold">Active in Queue</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3">
              {/* WhatsApp Share Button */}
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
              >
                <Share2 className="w-4 h-4" />
                Share / Save to WhatsApp
              </a>

              {/* Book Another Appointment */}
              <Button
                variant="outline"
                onClick={handleResetForm}
                className="w-full h-11 text-xs font-semibold text-gray-700 hover:bg-gray-100 border-gray-300"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Book Another Appointment
              </Button>
            </div>
          </div>
        ) : (
          /* BOOKING FORM CARD */
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
              <CardTitle className="text-xl font-bold text-gray-900">
                Book an Appointment
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Fill in your details below to secure your instant queue token.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {errorMessage && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* HUMAN FIELDS */}
                {!isVet && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ownerName" className="text-xs font-semibold text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="ownerName"
                          placeholder="e.g. Ramesh Chandra"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="pl-9 h-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 00000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-9 h-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="age" className="text-xs font-semibold text-gray-700">
                            Age
                          </Label>
                          <Input
                            id="age"
                            type="number"
                            placeholder="32"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="gender" className="text-xs font-semibold text-gray-700">
                            Gender
                          </Label>
                          <select
                            id="gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full h-10 px-2 rounded-lg border border-input bg-background text-sm"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VET FIELDS */}
                {isVet && (
                  <div className="space-y-4">
                    {/* Owner Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="ownerName" className="text-xs font-semibold text-gray-700">
                          Pet Parent / Owner Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="ownerName"
                            placeholder="e.g. Rahul Singh"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            className="pl-9 h-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 00000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-9 h-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pet Details Card */}
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <PawPrint className="w-4 h-4 text-emerald-600" />
                        Pet Information
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="petName" className="text-xs font-semibold text-gray-700">
                            Pet Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="petName"
                            placeholder="e.g. Bruno, Whiskers"
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                            className="bg-white h-10"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="petSpecies" className="text-xs font-semibold text-gray-700">
                            Species
                          </Label>
                          <select
                            id="petSpecies"
                            value={petSpecies}
                            onChange={(e) => setPetSpecies(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm"
                          >
                            {SPECIES_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="petBreed" className="text-xs font-semibold text-gray-700">
                            Breed
                          </Label>
                          <Input
                            id="petBreed"
                            placeholder="e.g. Retriever, Persian"
                            value={petBreed}
                            onChange={(e) => setPetBreed(e.target.value)}
                            className="bg-white h-10"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="petAge" className="text-xs font-semibold text-gray-700">
                            Age (Yrs)
                          </Label>
                          <Input
                            id="petAge"
                            type="number"
                            placeholder="e.g. 3"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="bg-white h-10"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="petWeight" className="text-xs font-semibold text-gray-700">
                            Weight (kg)
                          </Label>
                          <Input
                            id="petWeight"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 15.5"
                            value={petWeight}
                            onChange={(e) => setPetWeight(e.target.value)}
                            className="bg-white h-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DATE & TIME SLOTS */}
                <div className="space-y-3.5 pt-2 border-t border-gray-100">
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs font-semibold text-gray-700">
                      Preferred Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="date"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pl-9 h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                      <span>Select Time Slot</span>
                      <span className="text-[11px] font-normal text-gray-400 font-mono">
                        Selected: {slot}
                      </span>
                    </Label>

                    {/* Slots selection */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Morning
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {MORNING_SLOTS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSlot(s)}
                            className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-center border ${
                              slot === s
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">
                        Evening
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {EVENING_SLOTS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSlot(s)}
                            className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-center border ${
                              slot === s
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="notes" className="text-xs font-semibold text-gray-700">
                      Reason for Visit (Optional)
                    </Label>
                    <textarea
                      id="notes"
                      rows={2}
                      placeholder={
                        isVet
                          ? 'e.g. Annual vaccination, deworming, lethargic, skin rash...'
                          : 'e.g. Toothache, routine checkup, skin consultation...'
                      }
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-background outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-white font-bold text-base rounded-2xl shadow-lg transition-transform active:scale-[0.99]"
                    style={{ backgroundColor: themeColor }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Confirming & Assigning Token...
                      </>
                    ) : (
                      <>
                        Confirm Booking & Get Token Pass
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-[11px] text-gray-400">
                  Instant confirmation · Token generated automatically in live clinic queue
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* FOOTER */}
        <div className="text-center text-xs text-gray-400 space-y-1 pt-4 pb-6">
          <p>© {new Date().getFullYear()} {clinic.name}. Powered by SparkNexz Clinic & Vet OS.</p>
          <p className="text-[11px] text-gray-400">Safe, secure & HIPAA-compliant medical data encryption.</p>
        </div>
      </div>
    </div>
  )
}
