'use client'

import React, { useState, useEffect } from 'react'
import {
  Stethoscope,
  PawPrint,
  Clock,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  Syringe,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Printer,
  Share2,
  History,
  Activity,
  Pill,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PrintablePrescriptionModal } from '@/components/doctor/PrintablePrescriptionModal'

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
  prescription?: any
}

interface MedicineRow {
  name: string
  dosage: string
  timing: string
  duration: string
}

interface DoctorWorkspaceProps {
  initialAppointments: Appointment[]
  clinic: {
    id: string
    name: string
    slug: string
    type: 'HUMAN' | 'VET'
    address?: string | null
    phone?: string | null
    themeColor?: string | null
  }
  doctorName: string
  userRole: string
}

const HUMAN_MEDICINE_PRESETS = [
  'Amoxicillin 500mg',
  'Ibuprofen 400mg',
  'Paracetamol 650mg',
  'Pantoprazole 40mg',
  'Cetirizine 10mg',
  'Chlorhexidine 0.2% Rinse',
]

const VET_MEDICINE_PRESETS = [
  'Drontal Plus (dewormer)',
  'Amoxyclav 250mg',
  'Meloxicam Oral Suspension',
  'Simparica Trio Chewable',
  'Cephalexin 300mg',
  'Probiotic Enteric Paste',
]

const VET_VACCINE_PRESETS = [
  { name: 'Anti-Rabies (Defensor 3)', intervalDays: 365 },
  { name: 'DHPP 5-in-1 Canine Combo', intervalDays: 365 },
  { name: 'Feline FVRCP Tricat Trio', intervalDays: 365 },
  { name: 'Kennel Cough (Bordetella)', intervalDays: 180 },
  { name: 'Drontal Deworming Schedule', intervalDays: 90 },
]

const SPECIES_ICONS: Record<string, string> = {
  Dog: '🐶',
  Cat: '🐱',
  Bird: '🦜',
  Rabbit: '🐰',
  Other: '🐾',
}

const DOSAGE_PRESETS = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'SOS']
const TIMING_PRESETS = ['After Food', 'Before Food']
const DURATION_PRESETS = ['3 Days', '5 Days', '7 Days', '15 Days']

export function DoctorWorkspace({
  initialAppointments,
  clinic,
  doctorName,
  userRole,
}: DoctorWorkspaceProps) {
  const isVet = clinic.type === 'VET'
  const themeColor = clinic.themeColor || (isVet ? '#10b981' : '#0ea5e9')

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    initialAppointments.find((a) => a.status === 'IN_PROGRESS')?.id ||
      initialAppointments[0]?.id ||
      ''
  )

  // Active appointment and patient
  const selectedAppointment = appointments.find((a) => a.id === selectedAppointmentId)
  const selectedPatient = selectedAppointment?.patient

  // Patient History State
  const [patientHistory, setPatientHistory] = useState<{
    appointments: any[]
    vaccinations: any[]
  }>({ appointments: [], vaccinations: [] })
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [middleTab, setMiddleTab] = useState<'HISTORY' | 'VACCINES'>('HISTORY')

  // New Vaccine Form State
  const [showAddVaccine, setShowAddVaccine] = useState(false)
  const [vaccineName, setVaccineName] = useState('Anti-Rabies (Defensor 3)')
  const [vaccineAdminDate, setVaccineAdminDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  )
  const [vaccineDueDate, setVaccineDueDate] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  })
  const [submittingVaccine, setSubmittingVaccine] = useState(false)

  // Prescription Form State
  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    {
      name: isVet ? 'Drontal Plus (dewormer)' : 'Amoxicillin 500mg',
      dosage: '1-0-1',
      timing: 'After Food',
      duration: '5 Days',
    },
  ])
  const [nextVisitDate, setNextVisitDate] = useState('')
  const [submittingRx, setSubmittingRx] = useState(false)
  const [rxError, setRxError] = useState('')

  // Printable Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [lastGeneratedRx, setLastGeneratedRx] = useState<any>(null)

  // Fetch patient medical & vaccination history when selected patient changes
  useEffect(() => {
    if (!selectedPatient?.id) return

    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const res = await fetch(`/api/patients/${selectedPatient.id}/history`)
        if (res.ok) {
          const data = await res.json()
          setPatientHistory({
            appointments: data.appointments || [],
            vaccinations: data.vaccinations || [],
          })
        }
      } catch (err) {
        console.error('Error fetching patient history:', err)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()

    // Pre-fill symptoms if appointment has notes
    if (selectedAppointment?.notes) {
      setSymptoms(selectedAppointment.notes)
    } else {
      setSymptoms('')
    }
    setDiagnosis('')
    setNextVisitDate('')
  }, [selectedPatient?.id, selectedAppointment?.id])

  // Change appointment status (e.g. Start Consultation)
  const handleUpdateStatus = async (
    apptId: string,
    newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a))
        )
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  // Refresh Queue from server
  const handleRefreshQueue = async () => {
    try {
      const res = await fetch('/api/appointments/today')
      if (res.ok) {
        const data = await res.json()
        if (data.appointments) {
          setAppointments(data.appointments)
        }
      }
    } catch (err) {
      console.error('Failed to refresh queue:', err)
    }
  }

  // Quick preset follow-up date calculation
  const setFollowupDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setNextVisitDate(d.toISOString().split('T')[0])
  }

  // Quick preset vaccine selection
  const selectVaccinePreset = (preset: { name: string; intervalDays: number }) => {
    setVaccineName(preset.name)
    const due = new Date()
    due.setDate(due.getDate() + preset.intervalDays)
    setVaccineDueDate(due.toISOString().split('T')[0])
  }

  // Add new vaccine
  const handleSaveVaccine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient?.id || !vaccineName) return

    setSubmittingVaccine(true)
    try {
      const res = await fetch('/api/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          vaccineName,
          administeredDate: vaccineAdminDate,
          nextDueDate: vaccineDueDate,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPatientHistory((prev) => ({
          ...prev,
          vaccinations: [data.vaccination, ...prev.vaccinations],
        }))
        setShowAddVaccine(false)
      }
    } catch (err) {
      console.error('Failed to add vaccine:', err)
    } finally {
      setSubmittingVaccine(false)
    }
  }

  // Medicine Rows Management
  const addMedicineRow = (medName?: string) => {
    setMedicines((prev) => [
      ...prev,
      {
        name: medName || '',
        dosage: '1-0-1',
        timing: 'After Food',
        duration: '5 Days',
      },
    ])
  }

  const updateMedicineRow = (index: number, field: keyof MedicineRow, value: string) => {
    setMedicines((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeMedicineRow = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index))
  }

  // SUBMIT CONSULTATION & GENERATE PRESCRIPTION
  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment || !selectedPatient) return

    setRxError('')
    setSubmittingRx(true)

    try {
      const payload = {
        appointmentId: selectedAppointment.id,
        patientId: selectedPatient.id,
        symptoms: symptoms.trim(),
        diagnosis: diagnosis.trim(),
        medicinesJson: JSON.stringify(medicines.filter((m) => m.name.trim() !== '')),
        nextVisitDate: nextVisitDate || null,
      }

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setRxError(data.error || 'Failed to save prescription.')
        return
      }

      // Mark appointment locally as COMPLETED
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === selectedAppointment.id ? { ...a, status: 'COMPLETED' } : a
        )
      )

      // Set printable prescription data & open modal
      setLastGeneratedRx({
        prescription: {
          symptoms,
          diagnosis,
          medicines: medicines.filter((m) => m.name.trim() !== ''),
          nextVisitDate: nextVisitDate || null,
        },
        appointment: {
          tokenNumber: selectedAppointment.tokenNumber,
          date: selectedAppointment.date,
          slot: selectedAppointment.slot,
        },
        patient: selectedPatient,
      })

      setPrintModalOpen(true)
    } catch (err) {
      console.error('Error generating Rx:', err)
      setRxError('Failed to save prescription. Please try again.')
    } finally {
      setSubmittingRx(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* TOP WORKSPACE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm"
            style={{ backgroundColor: themeColor }}
          >
            {isVet ? <PawPrint className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Doctor Consultation Desk
              </h1>
              <Badge
                className={
                  isVet
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold'
                    : 'bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-semibold'
                }
              >
                {isVet ? '🐾 VET CLINIC' : '🏥 HUMAN CLINIC'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Logged in as <span className="font-semibold text-gray-700">{doctorName}</span> · {clinic.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshQueue}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Sync Queue
          </Button>

          {lastGeneratedRx && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintModalOpen(true)}
              className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              View Last Rx
            </Button>
          )}
        </div>
      </div>

      {/* 3-COLUMN CLINICAL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ============================================================== */}
        {/* COLUMN 1 (3 Cols): TODAY'S PATIENT QUEUE */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="p-3.5 bg-gray-50/80 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <CardTitle className="text-sm font-bold text-gray-900">
                  Today's Queue
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                {appointments.filter((a) => a.status !== 'CANCELLED').length} Today
              </Badge>
            </CardHeader>

            <CardContent className="p-2 space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto">
              {appointments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No appointments today</p>
                </div>
              ) : (
                appointments.map((appt) => {
                  const isSelected = appt.id === selectedAppointmentId
                  const patient = appt.patient

                  return (
                    <div
                      key={appt.id}
                      onClick={() => setSelectedAppointmentId(appt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Token Badge */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black font-mono flex-shrink-0 ${
                            appt.status === 'IN_PROGRESS'
                              ? 'bg-blue-600'
                              : appt.status === 'COMPLETED'
                              ? 'bg-emerald-600'
                              : 'bg-amber-600'
                          }`}
                        >
                          #{appt.tokenNumber}
                        </div>

                        {/* Patient info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {isVet
                                ? `${patient.petName || 'Pet'} (${patient.ownerName})`
                                : patient.ownerName}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                appt.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-700'
                                  : appt.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {appt.status === 'IN_PROGRESS'
                                ? 'Active'
                                : appt.status === 'COMPLETED'
                                ? 'Done'
                                : 'Waiting'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            {isVet && patient.petSpecies && (
                              <span className="text-emerald-700 font-semibold">
                                {SPECIES_ICONS[patient.petSpecies] || '🐾'} {patient.petSpecies}
                              </span>
                            )}
                            <span>{appt.slot}</span>
                          </div>

                          {appt.notes && (
                            <p className="text-[10px] text-gray-500 truncate mt-1 bg-gray-100 px-1.5 py-0.5 rounded">
                              {appt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* If waiting and selected: quick Start button */}
                      {appt.status === 'WAITING' && isSelected && (
                        <div className="mt-2 pt-2 border-t border-blue-200 flex justify-end">
                          <Button
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(appt.id, 'IN_PROGRESS')
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold h-6 px-2.5 rounded-md"
                          >
                            <Play className="w-2.5 h-2.5 mr-1" />
                            Start Consultation
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 2 (4 Cols): MEDICAL HISTORY & VET VACCINATIONS */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 space-y-3">
          {selectedPatient ? (
            <Card className="border-0 shadow-sm overflow-hidden">
              {/* Patient Banner */}
              <div
                className="p-3.5 text-white flex items-center justify-between"
                style={{ backgroundColor: themeColor }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    {isVet
                      ? (selectedPatient.petName || 'P').charAt(0).toUpperCase()
                      : selectedPatient.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm truncate leading-tight">
                      {isVet
                        ? `${selectedPatient.petName || 'Pet'} (${selectedPatient.ownerName})`
                        : selectedPatient.ownerName}
                    </p>
                    <p className="text-[11px] opacity-90 truncate">
                      {isVet
                        ? `${selectedPatient.petSpecies || 'Pet'} · ${selectedPatient.petBreed || 'Mixed'} · ${selectedPatient.petWeight ? `${selectedPatient.petWeight}kg` : ''}`
                        : `${selectedPatient.age ? `${selectedPatient.age} yrs` : ''} ${selectedPatient.gender ? `· ${selectedPatient.gender}` : ''}`}
                    </p>
                  </div>
                </div>

                <Badge className="bg-white/20 hover:bg-white/25 text-white font-mono text-[10px]">
                  Token #{selectedAppointment?.tokenNumber}
                </Badge>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-gray-200 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setMiddleTab('HISTORY')}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                    middleTab === 'HISTORY'
                      ? 'border-blue-600 text-blue-700 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Past Visits ({patientHistory.appointments.length})
                </button>

                {isVet && (
                  <button
                    type="button"
                    onClick={() => setMiddleTab('VACCINES')}
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                      middleTab === 'VACCINES'
                        ? 'border-emerald-600 text-emerald-700 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Syringe className="w-3.5 h-3.5 text-emerald-600" />
                    Vaccines ({patientHistory.vaccinations.length})
                  </button>
                )}
              </div>

              {/* TAB 1: VISIT HISTORY */}
              {middleTab === 'HISTORY' && (
                <CardContent className="p-3 space-y-3 max-h-[calc(100vh-310px)] overflow-y-auto">
                  {loadingHistory ? (
                    <div className="text-center py-10 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <p className="text-xs">Loading patient records...</p>
                    </div>
                  ) : patientHistory.appointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold text-gray-600">First-time Visit</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        No previous consultation records for this patient.
                      </p>
                    </div>
                  ) : (
                    patientHistory.appointments.map((pastAppt) => {
                      const rx = pastAppt.prescription
                      const meds = rx?.medicinesJson ? JSON.parse(rx.medicinesJson) : []

                      return (
                        <div
                          key={pastAppt.id}
                          className="p-3 rounded-xl bg-gray-50/80 border border-gray-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-gray-500 text-[10px]">
                            <span className="font-semibold text-gray-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(pastAppt.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <Badge variant="outline" className="text-[9px]">
                              {pastAppt.status}
                            </Badge>
                          </div>

                          {rx?.diagnosis ? (
                            <p className="text-xs text-blue-900 font-bold">
                              🩺 {rx.diagnosis}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-600">
                              {pastAppt.notes || 'Routine consultation'}
                            </p>
                          )}

                          {rx?.symptoms && (
                            <p className="text-[11px] text-gray-500">
                              <span className="font-semibold text-gray-600">Symptoms:</span>{' '}
                              {rx.symptoms}
                            </p>
                          )}

                          {meds.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1">
                              {meds.map((m: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-mono"
                                >
                                  <Pill className="w-2.5 h-2.5" />
                                  {m.name} ({m.dosage})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </CardContent>
              )}

              {/* TAB 2: VET VACCINATIONS */}
              {isVet && middleTab === 'VACCINES' && (
                <CardContent className="p-3 space-y-3 max-h-[calc(100vh-310px)] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Immunization Record</span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setShowAddVaccine(!showAddVaccine)}
                      className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {showAddVaccine ? 'Cancel' : '+ Record Vaccine'}
                    </Button>
                  </div>

                  {/* Add Vaccine Form */}
                  {showAddVaccine && (
                    <form
                      onSubmit={handleSaveVaccine}
                      className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2.5 animate-in fade-in"
                    >
                      <p className="font-bold text-emerald-900">Record Vaccine for {selectedPatient.petName}</p>

                      {/* Presets Chips */}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500">Quick Presets</Label>
                        <div className="flex flex-wrap gap-1">
                          {VET_VACCINE_PRESETS.map((p) => (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => selectVaccinePreset(p)}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-medium"
                            >
                              {p.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px]">Vaccine Name</Label>
                        <Input
                          value={vaccineName}
                          onChange={(e) => setVaccineName(e.target.value)}
                          placeholder="e.g. Anti-Rabies"
                          className="h-8 text-xs bg-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Given Date</Label>
                          <Input
                            type="date"
                            value={vaccineAdminDate}
                            onChange={(e) => setVaccineAdminDate(e.target.value)}
                            className="h-8 text-xs bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Next Due Date</Label>
                          <Input
                            type="date"
                            value={vaccineDueDate}
                            onChange={(e) => setVaccineDueDate(e.target.value)}
                            className="h-8 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={submittingVaccine}
                        size="xs"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7"
                      >
                        {submittingVaccine ? 'Saving...' : 'Save Vaccine Record'}
                      </Button>
                    </form>
                  )}

                  {/* Existing Vaccines List */}
                  {patientHistory.vaccinations.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Syringe className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-600" />
                      <p className="text-xs">No vaccination records yet</p>
                    </div>
                  ) : (
                    patientHistory.vaccinations.map((vax) => {
                      const isOverdue = vax.nextDueDate && new Date(vax.nextDueDate) < new Date()

                      return (
                        <div
                          key={vax.id}
                          className="p-3 rounded-xl bg-white border border-gray-200 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{vax.vaccineName}</span>
                            {isOverdue ? (
                              <Badge className="bg-red-100 text-red-700 text-[9px] py-0">Overdue</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 text-[9px] py-0">Active</Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span>Administered: {new Date(vax.administeredDate).toLocaleDateString('en-IN')}</span>
                            {vax.nextDueDate && (
                              <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}>
                                Due: {new Date(vax.nextDueDate).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              )}
            </Card>
          ) : (
            <Card className="border-0 shadow-sm p-6 text-center text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Select a patient from the queue to view medical history.</p>
            </Card>
          )}
        </div>

        {/* ============================================================== */}
        {/* COLUMN 3 (5 Cols): FAST 1-CLICK PRESCRIPTION BUILDER */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-3">
          {selectedPatient ? (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="p-3.5 bg-gray-50/80 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-gray-900">
                    Prescription Builder (Rx)
                  </CardTitle>
                </div>
                <Badge
                  className="bg-blue-100 text-blue-800 text-[10px] font-mono"
                >
                  Consultation Room 1
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-4 max-h-[calc(100vh-230px)] overflow-y-auto">
                {rxError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{rxError}</span>
                  </div>
                )}

                <form onSubmit={handleCompleteConsultation} className="space-y-4">
                  {/* Symptoms & Diagnosis */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="symptoms" className="text-xs font-bold text-gray-700">
                        Symptoms / Chief Complaints
                      </Label>
                      <Input
                        id="symptoms"
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder={
                          isVet
                            ? 'e.g. Lethargic, fever, poor appetite, ear discharge'
                            : 'e.g. Throbbing toothache, sensitivity to hot & cold'
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="diagnosis" className="text-xs font-bold text-gray-700">
                        Diagnosis <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder={
                          isVet
                            ? 'e.g. Canine Parvovirus / Healthy Adult - Annual Vaccination'
                            : 'e.g. Acute Pulpitis - Tooth #47 / Dental Caries'
                        }
                        className="text-xs h-8 font-semibold text-blue-950"
                        required
                      />
                    </div>
                  </div>

                  {/* Medicines Table */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-blue-600" />
                        Medicines & Dosage
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => addMedicineRow()}
                        className="text-[11px] h-6 text-blue-700 border-blue-300"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        + Add Medicine
                      </Button>
                    </div>

                    {/* Quick Add Medicine Presets */}
                    <div className="space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Quick Add Common Medicines:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(isVet ? VET_MEDICINE_PRESETS : HUMAN_MEDICINE_PRESETS).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => addMedicineRow(preset)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 font-medium transition-colors"
                          >
                            + {preset.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Rows */}
                    <div className="space-y-3">
                      {medicines.map((med, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-gray-50/70 border border-gray-200 text-xs space-y-2 relative"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-400 font-bold text-[10px] w-4">
                              #{index + 1}
                            </span>
                            <Input
                              value={med.name}
                              onChange={(e) => updateMedicineRow(index, 'name', e.target.value)}
                              placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                              className="text-xs h-7 bg-white font-semibold flex-1"
                              required
                            />
                            {medicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMedicineRow(index)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* 1-Click Dosage Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 w-12">Dosage:</span>
                            {DOSAGE_PRESETS.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => updateMedicineRow(index, 'dosage', d)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                  med.dosage === d
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>

                          {/* 1-Click Timing & Duration Buttons */}
                          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-gray-200/60">
                            <div className="flex items-center gap-1">
                              {TIMING_PRESETS.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => updateMedicineRow(index, 'timing', t)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    med.timing === t
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-white border border-gray-200 text-gray-600'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-1">
                              {DURATION_PRESETS.map((dur) => (
                                <button
                                  key={dur}
                                  type="button"
                                  onClick={() => updateMedicineRow(index, 'duration', dur)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    med.duration === dur
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white border border-gray-200 text-gray-600'
                                  }`}
                                >
                                  {dur}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Follow-up Visit Date */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <Label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span>Next Follow-up Visit Date</span>
                      {nextVisitDate && (
                        <span className="text-[10px] font-mono text-emerald-700">
                          {new Date(nextVisitDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </Label>

                    {/* Quick Follow-up Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '+3 Days', days: 3 },
                        { label: '+7 Days', days: 7 },
                        { label: '+15 Days', days: 15 },
                        { label: '+1 Month', days: 30 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setFollowupDays(item.days)}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                          {item.label}
                        </button>
                      ))}
                      <Input
                        type="date"
                        value={nextVisitDate}
                        onChange={(e) => setNextVisitDate(e.target.value)}
                        className="text-xs h-6 px-1.5 w-32 ml-auto"
                      />
                    </div>
                  </div>

                  {/* BIG ACTION BUTTON */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submittingRx}
                      className="w-full h-11 text-white font-bold text-sm rounded-xl shadow-md transition-transform active:scale-[0.99]"
                      style={{ backgroundColor: themeColor }}
                    >
                      {submittingRx ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Finalizing Consultation...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Complete & Generate Prescription
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm p-6 text-center text-gray-400">
              <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Select a patient from the queue to start consultation.</p>
            </Card>
          )}
        </div>
      </div>

      {/* PRINTABLE A4 PRESCRIPTION MODAL */}
      {lastGeneratedRx && (
        <PrintablePrescriptionModal
          open={printModalOpen}
          onOpenChange={setPrintModalOpen}
          clinic={clinic}
          doctorName={doctorName}
          appointment={lastGeneratedRx.appointment}
          patient={lastGeneratedRx.patient}
          prescription={lastGeneratedRx.prescription}
        />
      )}
    </div>
  )
}
