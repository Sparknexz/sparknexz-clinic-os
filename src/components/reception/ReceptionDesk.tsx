'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Phone,
  PawPrint,
  ArrowRight,
  Filter,
  Volume2,
  XCircle,
  FileText,
  Building2,
  Sparkles,
  Tv,
  Link2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NewAppointmentModal } from '@/components/reception/NewAppointmentModal'
import { GenerateInvoiceModal } from '@/components/invoices/GenerateInvoiceModal'
import { PrintableReceiptModal } from '@/components/invoices/PrintableReceiptModal'

interface Patient {
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

interface Appointment {
  id: string
  clinicId: string
  patientId: string
  date: string
  slot: string
  tokenNumber: number
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  notes?: string | null
  patient: Patient
}

interface ReceptionDeskProps {
  initialAppointments: Appointment[]
  initialStats: {
    total: number
    waiting: number
    inProgress: number
    completed: number
    cancelled: number
  }
  clinicSlug: string
  clinicType: 'HUMAN' | 'VET'
  clinicName: string
  clinicThemeColor?: string
  userRole: string
  userName: string
}

const SPECIES_ICONS: Record<string, string> = {
  Dog: '🐶',
  Cat: '🐱',
  Bird: '🦜',
  Rabbit: '🐰',
  Other: '🐾',
}

export function ReceptionDesk({
  initialAppointments,
  initialStats,
  clinicSlug,
  clinicType,
  clinicName,
  clinicThemeColor = '#0ea5e9',
  userRole,
  userName,
}: ReceptionDeskProps) {
  const isVet = clinicType === 'VET'

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [stats, setStats] = useState(initialStats)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [billingApptId, setBillingApptId] = useState<string | null>(null)
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  const handleCopyBookingLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const bookingUrl = `${origin}/book/${clinicSlug}`
    navigator.clipboard.writeText(bookingUrl)
    setCopiedLink(true)
    setSuccessBanner(`🔗 Public Booking Link copied to clipboard: ${bookingUrl}`)
    setTimeout(() => setCopiedLink(false), 2500)
    setTimeout(() => setSuccessBanner(null), 6000)
  }

  // Fetch latest today appointments
  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/appointments/today')
      const data = await res.json()
      if (data.appointments && data.stats) {
        setAppointments(data.appointments)
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to refresh appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Update status of an appointment
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ) => {
    setUpdatingId(id)

    // Optimistic UI Update
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, status: newStatus } : appt))
    )

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        // Rollback on error
        fetchAppointments()
      } else {
        // Recalculate stats based on updated appointments
        recalculateStats()
      }
    } catch (err) {
      console.error('Error updating status:', err)
      fetchAppointments()
    } finally {
      setUpdatingId(null)
    }
  }

  const recalculateStats = () => {
    fetchAppointments()
  }

  const handleNewAppointmentSuccess = (newAppt: Appointment) => {
    setSuccessBanner(
      `🎉 Token #${newAppt.tokenNumber} created for ${
        isVet
          ? `${newAppt.patient.petName || 'Pet'} (${newAppt.patient.ownerName})`
          : newAppt.patient.ownerName
      } (${newAppt.slot})`
    )
    fetchAppointments()
    setTimeout(() => {
      setSuccessBanner(null)
    }, 6000)
  }

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    // Status filter
    if (statusFilter !== 'ALL' && appt.status !== statusFilter) {
      return false
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const patient = appt.patient
      const matchToken = String(appt.tokenNumber).includes(term)
      const matchOwner = patient.ownerName.toLowerCase().includes(term)
      const matchPhone = patient.phone.toLowerCase().includes(term)
      const matchPet = patient.petName ? patient.petName.toLowerCase().includes(term) : false
      const matchBreed = patient.petBreed ? patient.petBreed.toLowerCase().includes(term) : false
      const matchNotes = appt.notes ? appt.notes.toLowerCase().includes(term) : false

      return matchToken || matchOwner || matchPhone || matchPet || matchBreed || matchNotes
    }

    return true
  })

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'WAITING':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-300 font-semibold text-xs px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
            Waiting
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-300 font-semibold text-xs px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 animate-ping" />
            In Consultation
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold text-xs px-2.5 py-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Completed
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border border-rose-300 font-semibold text-xs px-2.5 py-0.5">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Cancelled
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Reception & Live Queue Desk
            </h1>
            <Badge
              className={
                isVet
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs'
              }
            >
              {isVet ? '🐾 VET CLINIC' : '🏥 HUMAN CLINIC'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span>·</span>
            <span className="font-medium text-gray-700">{clinicName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Public TV Queue Screen Button */}
          <a
            href={`/queue/${clinicSlug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-gray-700 hover:text-gray-900 border-gray-300 font-medium"
            >
              <Tv className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              📺 Open TV Queue Screen
              <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
            </Button>
          </a>

          {/* Copy Online Booking Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBookingLink}
            className="text-gray-700 hover:text-gray-900 border-gray-300 font-medium"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                🔗 Copy Online Booking Link
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-white shadow-sm font-semibold hover:opacity-95"
            style={{ backgroundColor: clinicThemeColor }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + New Walk-in / Appointment
          </Button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Today */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Today
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Booked & walk-in visits</p>
          </CardContent>
        </Card>

        {/* Waiting in Queue */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Waiting in Queue
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-700">{stats.waiting}</div>
            <p className="text-xs text-amber-600/80 mt-1">Ready to be called in</p>
          </CardContent>
        </Card>

        {/* In Consultation */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/40 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                In Consultation
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-blue-700">{stats.inProgress}</div>
            <p className="text-xs text-blue-600/80 mt-1">Currently with the doctor</p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Completed Today
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">{stats.completed}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Consultation completed</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={
                  isVet
                    ? 'Search by Token #, Pet name, Owner name, Phone, Breed...'
                    : 'Search by Token #, Patient name, Phone number...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: 'All', value: 'ALL', count: appointments.length },
                { label: 'Waiting', value: 'WAITING', count: stats.waiting },
                { label: 'In Consultation', value: 'IN_PROGRESS', count: stats.inProgress },
                { label: 'Completed', value: 'COMPLETED', count: stats.completed },
                { label: 'Cancelled', value: 'CANCELLED', count: stats.cancelled },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === f.value
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TODAY'S LIVE QUEUE TABLE */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-gray-900">
                Live Queue & Appointments List
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredAppointments.length} patient{filteredAppointments.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Status Synchronization
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="text-base font-semibold text-gray-700">No appointments found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No appointments match your search or filter criteria.'
                  : 'No appointments in the queue for today yet. Click "+ New Walk-in / Appointment" above to register a patient.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="mt-4"
              >
                + Register First Patient
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAppointments.map((appt) => {
                const patient = appt.patient
                const isUpdating = updatingId === appt.id

                return (
                  <div
                    key={appt.id}
                    className={`p-4 transition-colors hover:bg-gray-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      appt.status === 'IN_PROGRESS'
                        ? 'bg-blue-50/30 border-l-4 border-l-blue-600'
                        : appt.status === 'WAITING'
                        ? 'border-l-4 border-l-amber-400'
                        : appt.status === 'COMPLETED'
                        ? 'border-l-4 border-l-emerald-500'
                        : 'opacity-70 border-l-4 border-l-gray-300'
                    }`}
                  >
                    {/* Left: Token Number + Patient Details */}
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      {/* Big Token Number Badge */}
                      <div
                        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-extrabold shadow-sm flex-shrink-0"
                        style={{ backgroundColor: clinicThemeColor }}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 leading-none">
                          Token
                        </span>
                        <span className="text-xl leading-none mt-0.5">#{appt.tokenNumber}</span>
                      </div>

                      {/* Patient & Pet Information */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isVet ? (
                            <>
                              <span className="text-lg font-bold text-gray-900 truncate">
                                {patient.petName || 'Unnamed Pet'}
                              </span>
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs border border-emerald-200">
                                {SPECIES_ICONS[patient.petSpecies || 'Other'] || '🐾'}{' '}
                                {patient.petSpecies || 'Pet'}
                              </Badge>
                              {patient.petBreed && (
                                <span className="text-xs text-gray-500">· {patient.petBreed}</span>
                              )}
                              {patient.petWeight && (
                                <span className="text-xs text-gray-400">({patient.petWeight}kg)</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-base font-bold text-gray-900 truncate">
                                {patient.ownerName}
                              </span>
                              {(patient.age || patient.gender) && (
                                <Badge variant="outline" className="text-xs">
                                  {patient.age ? `${patient.age} yrs` : ''}
                                  {patient.age && patient.gender ? ' · ' : ''}
                                  {patient.gender || ''}
                                </Badge>
                              )}
                            </>
                          )}

                          <div className="ml-auto md:hidden">{getStatusBadge(appt.status)}</div>
                        </div>

                        {/* Owner & Phone details */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          {isVet && (
                            <span className="text-gray-700 font-medium">
                              Owner: {patient.ownerName}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {patient.phone}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {appt.slot}
                          </span>
                        </div>

                        {/* Reason / Notes */}
                        {appt.notes && (
                          <p className="text-xs text-gray-600 bg-gray-100/70 px-2.5 py-1 rounded-md inline-block max-w-xl truncate mt-1">
                            <span className="font-semibold text-gray-700">Reason:</span> {appt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Badge & Quick Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <div className="hidden md:block">{getStatusBadge(appt.status)}</div>

                      {/* QUICK ACTION BUTTONS */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        {/* When WAITING: "Call In" or "Cancel" */}
                        {appt.status === 'WAITING' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3"
                            >
                              <Volume2 className="w-3.5 h-3.5 mr-1" />
                              Call In
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-8 px-2"
                              title="Cancel Appointment"
                            >
                              Cancel
                            </Button>
                          </>
                        )}

                        {/* When IN_PROGRESS: "Complete" or "Return to Queue" */}
                        {appt.status === 'IN_PROGRESS' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(appt.id, 'WAITING')}
                              className="text-amber-700 hover:bg-amber-50 text-xs h-8 px-2"
                              title="Put back in waiting queue"
                            >
                              Re-queue
                            </Button>
                          </>
                        )}

                        {/* When COMPLETED: Show completed mark and Collect Fee button */}
                        {appt.status === 'COMPLETED' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Done
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setBillingApptId(appt.id)
                                setIsBillingModalOpen(true)
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 text-xs h-8 px-2.5 font-bold shadow-2xs"
                              title="Collect consultation fee & issue digital receipt"
                            >
                              💰 Collect Fee
                            </Button>
                          </div>
                        )}

                        {/* When CANCELLED: Option to reopen */}
                        {appt.status === 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(appt.id, 'WAITING')}
                            className="text-gray-500 hover:text-gray-800 text-xs h-7 px-2"
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW APPOINTMENT MODAL */}
      <NewAppointmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        clinicType={clinicType}
        clinicThemeColor={clinicThemeColor}
        onSuccess={handleNewAppointmentSuccess}
      />

      {/* GENERATE INVOICE MODAL (OPENED VIA 'COLLECT FEE') */}
      <GenerateInvoiceModal
        open={isBillingModalOpen}
        onOpenChange={setIsBillingModalOpen}
        clinicType={clinicType}
        clinicThemeColor={clinicThemeColor}
        appointments={appointments}
        preselectedAppointmentId={billingApptId}
        onInvoiceCreated={(invoice) => {
          setGeneratedReceipt(invoice)
          setIsReceiptModalOpen(true)
        }}
      />

      {/* DIGITAL RECEIPT MODAL */}
      <PrintableReceiptModal
        open={isReceiptModalOpen}
        onOpenChange={setIsReceiptModalOpen}
        invoice={generatedReceipt}
        doctorName={userName}
      />
    </div>
  )
}
