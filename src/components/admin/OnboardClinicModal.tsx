'use client'

import React, { useState } from 'react'
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
  Building2,
  Stethoscope,
  PawPrint,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  User,
  Lock,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react'

interface OnboardClinicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function OnboardClinicModal({
  open,
  onOpenChange,
  onSuccess,
}: OnboardClinicModalProps) {
  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [type, setType] = useState<'HUMAN' | 'VET'>('HUMAN')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [themeColor, setThemeColor] = useState('#0ea5e9')

  // Doctor state
  const [doctorName, setDoctorName] = useState('')
  const [doctorEmail, setDoctorEmail] = useState('')
  const [doctorPassword, setDoctorPassword] = useState('password123')

  // Receptionist state
  const [receptionistName, setReceptionistName] = useState('')
  const [receptionistEmail, setReceptionistEmail] = useState('')
  const [receptionistPassword, setReceptionistPassword] = useState('password123')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdSummary, setCreatedSummary] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Auto-generate slug and default emails when clinic name changes
  const handleNameChange = (val: string) => {
    setName(val)
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(generatedSlug)

    if (generatedSlug) {
      if (!doctorEmail || doctorEmail.endsWith('.com')) {
        setDoctorEmail(`doctor@${generatedSlug}.com`)
      }
      if (!receptionistEmail || receptionistEmail.endsWith('.com')) {
        setReceptionistEmail(`reception@${generatedSlug}.com`)
      }
    }
  }

  const handleTypeChange = (newType: 'HUMAN' | 'VET') => {
    setType(newType)
    if (newType === 'VET') {
      setThemeColor('#10b981')
      if (!doctorName) setDoctorName('Dr. Vet Surgeon')
      if (!receptionistName) setReceptionistName('Vet Reception')
    } else {
      setThemeColor('#0ea5e9')
      if (!doctorName) setDoctorName('Dr. Senior Consultant')
      if (!receptionistName) setReceptionistName('Front Desk Reception')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          type,
          address,
          phone,
          themeColor,
          doctor: {
            name: doctorName || (type === 'VET' ? 'Vet Doctor' : 'Doctor'),
            email: doctorEmail,
            password: doctorPassword,
          },
          receptionist: {
            name: receptionistName || 'Reception Desk',
            email: receptionistEmail,
            password: receptionistPassword,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to onboard clinic')
      }

      setCreatedSummary(data)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!createdSummary) return
    const text = `🏥 *SparkNexz Onboarding - ${createdSummary.clinic.name}*
----------------------------------------
*Clinic Slug:* ${createdSummary.clinic.slug}
*Mode:* ${createdSummary.clinic.type}
*Public TV Display:* /queue/${createdSummary.clinic.slug}
*Public Online Booking:* /book/${createdSummary.clinic.slug}

*DOCTOR LOGIN:*
Email: ${createdSummary.doctor.email}
Password: ${createdSummary.doctor.plainPassword}

*RECEPTIONIST LOGIN:*
Email: ${createdSummary.receptionist.email}
Password: ${createdSummary.receptionist.plainPassword}
----------------------------------------`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleReset = () => {
    setName('')
    setSlug('')
    setAddress('')
    setPhone('')
    setDoctorName('')
    setDoctorEmail('')
    setReceptionistName('')
    setReceptionistEmail('')
    setCreatedSummary(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Onboard New Clinic to SparkNexz
              </DialogTitle>
              <DialogDescription className="text-purple-200 text-xs mt-0.5">
                Creates the clinic workspace, database partition, and initial staff credentials in 1 click
              </DialogDescription>
            </div>
          </div>

          <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
            ⚡ Multi-Tenant SaaS
          </Badge>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto p-6 flex-1">
          {createdSummary ? (
            /* SUCCESS ONBOARDING SUMMARY */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-900">
                    Clinic Onboarded Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700">
                    {createdSummary.clinic.name} is now live on SparkNexz with dedicated Doctor and Receptionist credentials.
                  </p>
                </div>
              </div>

              {/* CREDENTIALS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Doctor Account Card */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Doctor Account
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>
                      <strong>Name:</strong> {createdSummary.doctor.name}
                    </p>
                    <p className="font-mono bg-white p-1.5 rounded-md border border-blue-100 text-[11px]">
                      {createdSummary.doctor.email}
                    </p>
                    <p className="text-gray-500">
                      <strong>Password:</strong>{' '}
                      <code className="text-gray-900 font-bold font-mono">
                        {createdSummary.doctor.plainPassword}
                      </code>
                    </p>
                  </div>
                </div>

                {/* Receptionist Account Card */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-teal-600" />
                    Receptionist Account
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>
                      <strong>Name:</strong> {createdSummary.receptionist.name}
                    </p>
                    <p className="font-mono bg-white p-1.5 rounded-md border border-teal-100 text-[11px]">
                      {createdSummary.receptionist.email}
                    </p>
                    <p className="text-gray-500">
                      <strong>Password:</strong>{' '}
                      <code className="text-gray-900 font-bold font-mono">
                        {createdSummary.receptionist.plainPassword}
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              {/* PUBLIC LINKS */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <p className="font-bold text-gray-800">Public Live Links:</p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-gray-600">TV Waiting Queue Display:</span>
                  <a
                    href={`/queue/${createdSummary.clinic.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-mono font-medium hover:underline inline-flex items-center gap-1"
                  >
                    /queue/{createdSummary.clinic.slug}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-gray-600">Patient Online Booking:</span>
                  <a
                    href={`/book/${createdSummary.clinic.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-mono font-medium hover:underline inline-flex items-center gap-1"
                  >
                    /book/{createdSummary.clinic.slug}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCopyCredentials}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold h-10"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5 text-emerald-300" />
                      Copied All Credentials to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy All Credentials to Clipboard
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="text-xs font-semibold h-10 px-6"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* ONBOARDING FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECTION 1: CLINIC DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    1. Clinic Details
                  </h3>
                </div>

                {/* Mode Selector (Human vs Vet) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('HUMAN')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      type === 'HUMAN'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      🏥
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Human Clinic</p>
                      <p className="text-[10px] text-gray-500">Dental, Skin, General OPD</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('VET')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      type === 'VET'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      🐾
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Veterinary Hospital</p>
                      <p className="text-[10px] text-gray-500">Pets, Dogs, Cats, Animals</p>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Clinic Name *</Label>
                    <Input
                      placeholder={type === 'VET' ? 'e.g. Pet Care Super Speciality' : 'e.g. City Dental & Wellness'}
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">URL Slug *</Label>
                    <div className="relative">
                      <Input
                        placeholder="city-dental"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        className="text-xs font-mono"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Public portals will be at /queue/{slug || '...'} and /book/{slug || '...'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Phone Number</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Theme Brand Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                      />
                      <Input
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="text-xs font-mono flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Physical Address</Label>
                  <Input
                    placeholder="Suite 101, Main Road, Indiranagar, Bengaluru, 560038"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* SECTION 2: INITIAL STAFF ACCOUNTS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    2. Initial Staff Accounts (Auto-Created)
                  </h3>
                </div>

                {/* DOCTOR CREDENTIALS */}
                <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    Doctor Account (Consultation Workspace)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Doctor Name"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="text-xs bg-white"
                    />
                    <Input
                      placeholder="doctor@clinic.com"
                      value={doctorEmail}
                      onChange={(e) => setDoctorEmail(e.target.value)}
                      className="text-xs bg-white font-mono"
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={doctorPassword}
                      onChange={(e) => setDoctorPassword(e.target.value)}
                      className="text-xs bg-white"
                      required
                    />
                  </div>
                </div>

                {/* RECEPTIONIST CREDENTIALS */}
                <div className="p-3.5 rounded-xl border border-teal-100 bg-teal-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    Receptionist Account (Queue Desk & Billing)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Receptionist Name"
                      value={receptionistName}
                      onChange={(e) => setReceptionistName(e.target.value)}
                      className="text-xs bg-white"
                    />
                    <Input
                      placeholder="reception@clinic.com"
                      value={receptionistEmail}
                      onChange={(e) => setReceptionistEmail(e.target.value)}
                      className="text-xs bg-white font-mono"
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={receptionistPassword}
                      onChange={(e) => setReceptionistPassword(e.target.value)}
                      className="text-xs bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={isLoading || !name || !slug}
                  className="w-full h-11 text-xs font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Clinic & Provisioning Accounts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      + Onboard Clinic & Generate Staff Logins
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
