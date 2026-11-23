'use client'

import React, { useState } from 'react'
import {
  BellRing,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  RefreshCw,
  Search,
  Users,
  PawPrint,
  Syringe,
  FileText,
  Smartphone,
  ExternalLink,
  Sparkles,
  Check,
  Send,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  formatFollowUpReminderMessage,
  formatVaccineReminderMessage,
  getWhatsAppDirectLink,
} from '@/lib/whatsapp'

export interface FollowUpItem {
  id: string
  clinicId: string
  patientId: string
  appointmentId: string
  symptoms?: string | null
  diagnosis?: string | null
  nextVisitDate: string | Date
  createdAt: string | Date
  patient: {
    id: string
    ownerName: string
    phone: string
    age?: number | null
    gender?: string | null
    petName?: string | null
    petSpecies?: string | null
    petBreed?: string | null
  }
  clinic: {
    name: string
    slug: string
    type: 'HUMAN' | 'VET'
    phone?: string | null
    themeColor?: string | null
  }
}

export interface VaccinationItem {
  id: string
  clinicId: string
  patientId: string
  vaccineName: string
  administeredDate: string | Date
  nextDueDate: string | Date
  reminderSent: boolean
  createdAt: string | Date
  patient: {
    id: string
    ownerName: string
    phone: string
    petName?: string | null
    petSpecies?: string | null
    petBreed?: string | null
  }
  clinic: {
    name: string
    slug: string
    type: 'HUMAN' | 'VET'
    phone?: string | null
    themeColor?: string | null
  }
}

export interface NotificationLogItem {
  id: string
  clinicId: string
  patientId?: string | null
  phone: string
  type: string
  message: string
  status: string
  createdAt: string | Date
  patient?: {
    ownerName: string
    petName?: string | null
  } | null
}

interface ReminderCenterProps {
  initialFollowUps: FollowUpItem[]
  initialVaccinations: VaccinationItem[]
  initialLogs: NotificationLogItem[]
  clinicSlug: string
  clinicType: 'HUMAN' | 'VET'
  clinicName: string
  clinicThemeColor?: string
}

export function ReminderCenter({
  initialFollowUps,
  initialVaccinations,
  initialLogs,
  clinicSlug,
  clinicType,
  clinicName,
  clinicThemeColor = '#0ea5e9',
}: ReminderCenterProps) {
  const isVet = clinicType === 'VET'

  const [activeTab, setActiveTab] = useState<'FOLLOWUPS' | 'VACCINES' | 'LOGS'>(
    isVet ? 'VACCINES' : 'FOLLOWUPS'
  )
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(initialFollowUps)
  const [vaccinations, setVaccinations] = useState<VaccinationItem[]>(initialVaccinations)
  const [logs, setLogs] = useState<NotificationLogItem[]>(initialLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [cronRunning, setCronRunning] = useState(false)
  const [cronBanner, setCronBanner] = useState<string | null>(null)

  const fetchReminders = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/reminders')
      if (res.ok) {
        const data = await res.json()
        if (data.followUps) setFollowUps(data.followUps)
        if (data.vaccinations) setVaccinations(data.vaccinations)
        if (data.notificationLogs) setLogs(data.notificationLogs)
      }
    } catch (err) {
      console.error('Error fetching reminders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger Cron Engine Manually
  const handleRunCron = async () => {
    setCronRunning(true)
    setCronBanner(null)
    try {
      const res = await fetch('/api/cron/reminders')
      const data = await res.json()
      if (res.ok) {
        setCronBanner(
          `⚡ Automated Engine Dispatched ${data.totalSent} reminders (${data.summary.triggeredFollowUps} follow-ups, ${data.summary.triggeredVaccines} vaccines)!`
        )
        fetchReminders()
        setTimeout(() => setCronBanner(null), 8000)
      }
    } catch (err) {
      console.error('Cron run error:', err)
    } finally {
      setCronRunning(false)
    }
  }

  // Calculate Due Status (Overdue, Due Today, In X Days)
  const getDueStatus = (dueDateRaw: string | Date) => {
    const due = new Date(dueDateRaw)
    due.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)} Day${Math.abs(diffDays) > 1 ? 's' : ''} Overdue`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        isOverdue: true,
      }
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse',
        isOverdue: false,
      }
    } else if (diffDays === 1) {
      return {
        label: 'Due Tomorrow',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        isOverdue: false,
      }
    } else {
      return {
        label: `In ${diffDays} Days`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        isOverdue: false,
      }
    }
  }

  // Send Follow-up Reminder
  const handleSendFollowUp = async (item: FollowUpItem) => {
    setSendingId(item.id)
    const formattedDate = new Date(item.nextVisitDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const message = formatFollowUpReminderMessage({
      clinicName: item.clinic.name || clinicName,
      patientName: item.patient.ownerName,
      dueDate: formattedDate,
      isVet: item.clinic.type === 'VET',
      petName: item.patient.petName,
    })

    // Open WhatsApp link immediately in new tab
    const waUrl = getWhatsAppDirectLink(item.patient.phone, message)
    window.open(waUrl, '_blank')

    // Record notification log via API
    try {
      await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VISIT_REMINDER',
          id: item.id,
          patientId: item.patientId,
          phone: item.patient.phone,
          message,
        }),
      })
      fetchReminders()
    } catch (err) {
      console.error('Error logging reminder:', err)
    } finally {
      setSendingId(null)
    }
  }

  // Send Vaccine Reminder
  const handleSendVaccine = async (item: VaccinationItem) => {
    setSendingId(item.id)
    const formattedDate = new Date(item.nextDueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const message = formatVaccineReminderMessage({
      clinicName: item.clinic.name || clinicName,
      petName: item.patient.petName || 'Pet',
      ownerName: item.patient.ownerName,
      vaccineName: item.vaccineName,
      dueDate: formattedDate,
    })

    // Open WhatsApp link
    const waUrl = getWhatsAppDirectLink(item.patient.phone, message)
    window.open(waUrl, '_blank')

    try {
      await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VACCINE_REMINDER',
          id: item.id,
          patientId: item.patientId,
          phone: item.patient.phone,
          message,
        }),
      })
      // Mark local reminderSent to true immediately
      setVaccinations((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, reminderSent: true } : v))
      )
      fetchReminders()
    } catch (err) {
      console.error('Error logging vaccine reminder:', err)
    } finally {
      setSendingId(null)
    }
  }

  // Filtered Lists
  const filteredFollowUps = followUps.filter((f) => {
    const s = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      f.patient.ownerName.toLowerCase().includes(s) ||
      f.patient.phone.includes(s) ||
      (f.patient.petName && f.patient.petName.toLowerCase().includes(s)) ||
      (f.diagnosis && f.diagnosis.toLowerCase().includes(s))
    )
  })

  const filteredVaccinations = vaccinations.filter((v) => {
    const s = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      v.patient.ownerName.toLowerCase().includes(s) ||
      v.patient.phone.includes(s) ||
      (v.patient.petName && v.patient.petName.toLowerCase().includes(s)) ||
      v.vaccineName.toLowerCase().includes(s)
    )
  })

  const filteredLogs = logs.filter((l) => {
    const s = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      l.phone.includes(s) ||
      l.message.toLowerCase().includes(s) ||
      (l.patient?.ownerName && l.patient.ownerName.toLowerCase().includes(s))
    )
  })

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Automated WhatsApp & Reminder Center
            </h1>
            <Badge
              variant="outline"
              className="text-xs font-semibold"
              style={{
                borderColor: `${clinicThemeColor}50`,
                color: clinicThemeColor,
                backgroundColor: `${clinicThemeColor}10`,
              }}
            >
              📲 WhatsApp Engine
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Automated appointment confirmation, prescription summaries, follow-up recalls, and pet vaccination reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReminders}
            disabled={isLoading}
            className="text-xs bg-white text-gray-700 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleRunCron}
            disabled={cronRunning}
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm h-9 px-3.5"
          >
            <Zap className={`w-3.5 h-3.5 mr-1.5 ${cronRunning ? 'animate-spin' : ''}`} />
            {cronRunning ? 'Dispatching...' : 'Run Auto-Reminder Engine'}
          </Button>
        </div>
      </div>

      {/* CRON BANNER */}
      {cronBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{cronBanner}</span>
          </div>
          <Badge className="bg-emerald-200 text-emerald-900 border-0 text-[10px]">
            Automated Cron
          </Badge>
        </div>
      )}

      {/* TOP KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pet Vaccinations Due (Priority for Vet) */}
        <Card
          className={`border-0 shadow-sm relative overflow-hidden ${
            isVet
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
              : 'bg-white'
          }`}
        >
          <CardContent className="p-5">
            <div
              className={`flex items-center justify-between text-xs uppercase tracking-wider font-semibold ${
                isVet ? 'text-emerald-100' : 'text-gray-500'
              }`}
            >
              <span>Vaccinations Due</span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isVet ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <Syringe className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className={`text-3xl font-black ${isVet ? 'text-white' : 'text-gray-900'}`}>
                {vaccinations.length}
              </span>
              <span className={`text-xs ml-1.5 ${isVet ? 'text-emerald-200' : 'text-gray-400'}`}>
                pets due / overdue
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${isVet ? 'text-emerald-100' : 'text-emerald-600'}`}>
              {vaccinations.filter((v) => !v.reminderSent).length} pending reminders
            </p>
          </CardContent>
        </Card>

        {/* 2. Follow-Up Visits Due */}
        <Card
          className={`border-0 shadow-sm relative overflow-hidden ${
            !isVet
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
              : 'bg-white'
          }`}
        >
          <CardContent className="p-5">
            <div
              className={`flex items-center justify-between text-xs uppercase tracking-wider font-semibold ${
                !isVet ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              <span>Upcoming Follow-ups</span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  !isVet ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className={`text-3xl font-black ${!isVet ? 'text-white' : 'text-gray-900'}`}>
                {followUps.length}
              </span>
              <span className={`text-xs ml-1.5 ${!isVet ? 'text-blue-200' : 'text-gray-400'}`}>
                patients scheduled
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${!isVet ? 'text-blue-100' : 'text-blue-600'}`}>
              Recall window: next 7 days
            </p>
          </CardContent>
        </Card>

        {/* 3. WhatsApp Messages Logged */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <span>WhatsApp Dispatches</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-gray-900">{logs.length}</span>
              <span className="text-xs text-gray-400 ml-1.5 font-medium">audited logs</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Zero-cost direct WhatsApp API
            </p>
          </CardContent>
        </Card>

        {/* 4. Automated Cron Status */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <span>Cron Scheduler</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-lg font-bold text-gray-900">Active & Ready</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">
              /api/cron/reminders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & TABS */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by patient name, pet name, vaccine, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs bg-gray-50 border-gray-200 h-9"
              />
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('VACCINES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'VACCINES'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>Pet Vaccinations</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {vaccinations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('FOLLOWUPS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'FOLLOWUPS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Follow-Up Visits</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {followUps.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('LOGS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'LOGS'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>WhatsApp Logs</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {logs.length}
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONTENT SECTIONS */}
      {/* 1. PET VACCINATIONS TAB */}
      {activeTab === 'VACCINES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Syringe className="w-4 h-4 text-emerald-600" />
              Pet Vaccinations Due & Overdue ({filteredVaccinations.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVaccinations.map((vac) => {
              const dueInfo = getDueStatus(vac.nextDueDate)
              const dueDateStr = new Date(vac.nextDueDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              const isSending = sendingId === vac.id

              return (
                <Card
                  key={vac.id}
                  className={`border shadow-xs hover:shadow-md transition-shadow ${
                    dueInfo.isOverdue ? 'border-rose-200 bg-rose-50/20' : 'border-gray-200 bg-white'
                  }`}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              {vac.patient.petName || 'Pet'}
                            </span>
                            <Badge className="bg-emerald-50 text-emerald-800 text-[10px] border border-emerald-200">
                              {vac.patient.petSpecies || 'Pet'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Parent: <strong>{vac.patient.ownerName}</strong> ·{' '}
                            <span className="font-mono">{vac.patient.phone}</span>
                          </p>
                        </div>

                        <Badge className={`text-[10px] border ${dueInfo.badgeClass}`}>
                          {dueInfo.label}
                        </Badge>
                      </div>

                      {/* Vaccine Details */}
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-medium">Vaccine:</span>
                          <span className="font-bold text-gray-900">{vac.vaccineName}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Target Due Date:</span>
                          <span className="font-medium text-gray-700">{dueDateStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        {vac.reminderSent ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Reminder Sent
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                            Pending Dispatch
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        disabled={isSending}
                        onClick={() => handleSendVaccine(vac)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-3"
                      >
                        <Smartphone className="w-3.5 h-3.5 mr-1" />
                        {isSending ? 'Dispatching...' : '📲 Send WhatsApp Reminder'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filteredVaccinations.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <Syringe className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-base font-semibold text-gray-700">No vaccination reminders due</p>
                <p className="text-xs text-gray-400 mt-1">
                  All pet vaccinations are up-to-date or no upcoming immunization schedules within this window.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FOLLOW-UP VISITS TAB */}
      {activeTab === 'FOLLOWUPS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Upcoming Follow-Up Consultations ({filteredFollowUps.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFollowUps.map((rx) => {
              const dueInfo = getDueStatus(rx.nextVisitDate)
              const dueDateStr = new Date(rx.nextVisitDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              const isSending = sendingId === rx.id

              return (
                <Card
                  key={rx.id}
                  className={`border shadow-xs hover:shadow-md transition-shadow ${
                    dueInfo.isOverdue ? 'border-rose-200 bg-rose-50/20' : 'border-gray-200 bg-white'
                  }`}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              {rx.clinic.type === 'VET' && rx.patient.petName
                                ? `${rx.patient.petName} (${rx.patient.ownerName})`
                                : rx.patient.ownerName}
                            </span>
                            {rx.clinic.type === 'VET' && (
                              <Badge className="bg-emerald-50 text-emerald-800 text-[10px] border border-emerald-200">
                                {rx.patient.petSpecies || 'Pet'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {rx.patient.phone}
                          </p>
                        </div>

                        <Badge className={`text-[10px] border ${dueInfo.badgeClass}`}>
                          {dueInfo.label}
                        </Badge>
                      </div>

                      {/* Clinical Follow-up Summary */}
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1 text-xs">
                        {rx.diagnosis && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Diagnosis:</span>
                            <span className="font-bold text-gray-900 truncate max-w-[200px]">
                              {rx.diagnosis}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Follow-up Date:</span>
                          <span className="font-semibold text-gray-800">{dueDateStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 flex-wrap">
                      <span className="text-xs text-gray-400">
                        Prescribed on {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>

                      <Button
                        size="sm"
                        disabled={isSending}
                        onClick={() => handleSendFollowUp(rx)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 px-3"
                      >
                        <Smartphone className="w-3.5 h-3.5 mr-1" />
                        {isSending ? 'Dispatching...' : '📲 Send Follow-up WhatsApp'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filteredFollowUps.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-base font-semibold text-gray-700">No follow-ups due</p>
                <p className="text-xs text-gray-400 mt-1">
                  No upcoming follow-up appointments scheduled within the current 7-day recall window.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. WHATSAPP LOGS TAB */}
      {activeTab === 'LOGS' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-gray-900">
                WhatsApp Activity & Dispatch Audit Trail
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredLogs.length} logged
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-base font-semibold text-gray-700">No notifications logged yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  All automated booking confirmations, prescriptions, and reminders will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {filteredLogs.map((log) => {
                  const logDate = new Date(log.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                  const logTime = new Date(log.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  const getTypeBadge = (type: string) => {
                    switch (type) {
                      case 'BOOKING_CONFIRMATION':
                        return <Badge className="bg-blue-100 text-blue-800 text-[10px]">Booking Confirm</Badge>
                      case 'PRESCRIPTION_READY':
                        return <Badge className="bg-purple-100 text-purple-800 text-[10px]">Rx Summary</Badge>
                      case 'VACCINE_REMINDER':
                        return <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Vaccine Due</Badge>
                      case 'VISIT_REMINDER':
                      default:
                        return <Badge className="bg-amber-100 text-amber-800 text-[10px]">Follow-up</Badge>
                    }
                  }

                  return (
                    <div key={log.id} className="p-4 hover:bg-gray-50/60 transition-colors space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {getTypeBadge(log.type)}
                          <span className="font-mono font-bold text-gray-800">{log.phone}</span>
                          {log.patient && (
                            <span className="text-gray-500">
                              ({log.patient.petName ? `${log.patient.petName} · ` : ''}{log.patient.ownerName})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-mono text-[11px]">
                            {logDate} at {logTime}
                          </span>
                          <Badge
                            className={`text-[10px] ${
                              log.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[11px] text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {log.message}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
