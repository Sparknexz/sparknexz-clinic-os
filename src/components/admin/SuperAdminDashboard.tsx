'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Building2,
  Stethoscope,
  PawPrint,
  Users,
  Calendar,
  IndianRupee,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Tv,
  Link2,
  CheckCircle2,
  Sparkles,
  LogOut,
  LayoutDashboard,
  KeyRound,
  Phone,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OnboardClinicModal } from './OnboardClinicModal'

export interface AdminClinic {
  id: string
  name: string
  slug: string
  type: 'HUMAN' | 'VET'
  address?: string | null
  phone?: string | null
  themeColor?: string | null
  createdAt: string | Date
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string | Date
  }>
  _count: {
    patients: number
    appointments: number
    invoices: number
  }
}

interface SuperAdminDashboardProps {
  initialStats: {
    totalClinics: number
    humanClinics: number
    vetClinics: number
    totalPatients: number
    totalAppointments: number
    totalRevenue: number
  }
  initialClinics: AdminClinic[]
  adminUser: {
    name?: string | null
    email?: string | null
  }
}

export function SuperAdminDashboard({
  initialStats,
  initialClinics,
  adminUser,
}: SuperAdminDashboardProps) {
  const [stats, setStats] = useState(initialStats)
  const [clinics, setClinics] = useState<AdminClinic[]>(initialClinics)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'HUMAN' | 'VET'>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchClinics = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/clinics')
      if (res.ok) {
        const data = await res.json()
        if (data.stats) setStats(data.stats)
        if (data.clinics) setClinics(data.clinics)
      }
    } catch (err) {
      console.error('Error refreshing admin clinics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleCopyStaffCredentials = (clinic: AdminClinic) => {
    const doctor = clinic.users.find((u) => u.role === 'DOCTOR')
    const receptionist = clinic.users.find((u) => u.role === 'RECEPTIONIST')

    const text = `🏥 *SparkNexz Staff Login - ${clinic.name}*
URL Slug: ${clinic.slug}
Type: ${clinic.type}

👨‍⚕️ Doctor: ${doctor?.email || 'N/A'} (Default pass: password123)
📋 Receptionist: ${receptionist?.email || 'N/A'} (Default pass: password123)`

    navigator.clipboard.writeText(text)
    setCopiedId(clinic.id)
    showToast(`Copied staff logins for ${clinic.name}!`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const filteredClinics = clinics.filter((c) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(search) ||
      c.slug.toLowerCase().includes(search) ||
      c.address?.toLowerCase().includes(search) ||
      c.phone?.includes(search) ||
      c.users.some((u) => u.email.toLowerCase().includes(search))

    const matchesType = typeFilter === 'ALL' || c.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP SAAS SUPER ADMIN HEADER */}
      <header className="bg-gradient-to-r from-gray-950 via-purple-950 to-indigo-950 text-white border-b border-purple-900/40 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-black shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  SparkNexz
                </span>
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] uppercase font-bold tracking-wider">
                  Super Admin SaaS
                </Badge>
              </div>
              <p className="text-[10px] text-purple-300/70">
                Multi-Tenant Clinic & Vet Management Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 h-8"
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                Clinic Dashboard
              </Button>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-xs">
              <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="text-gray-300 font-mono text-[11px]">
                {adminUser.email || 'admin@sparknexz.com'}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 h-8 px-2"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* PLATFORM HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Onboarded Clinics & Tenants Directory
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Provision new clinic workspaces, manage doctor & receptionist logins, and monitor platform-wide traffic.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClinics}
              disabled={isLoading}
              className="text-xs bg-white text-gray-700 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setIsOnboardModalOpen(true)}
              className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + Onboard New Clinic
            </Button>
          </div>
        </div>

        {/* PLATFORM STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Clinics */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-600 to-indigo-700 text-white relative overflow-hidden">
            <div className="absolute right-2 -bottom-2 opacity-15">
              <Building2 className="w-24 h-24" />
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between text-purple-200 text-xs uppercase tracking-wider font-semibold">
                <span>Total Onboarded Clinics</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  SaaS Tenancy
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black">{stats.totalClinics}</span>
                <span className="text-xs text-purple-200">clinics live</span>
              </div>
              <p className="text-[11px] text-purple-200 mt-1">
                {stats.humanClinics} Human · {stats.vetClinics} Veterinary
              </p>
            </CardContent>
          </Card>

          {/* Total Patients / Pets */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <span>Managed Patients / Pets</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-gray-900">{stats.totalPatients}</span>
                <span className="text-xs text-gray-400 ml-1.5 font-medium">registered</span>
              </div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                <span>Aggregated across all clinics</span>
              </p>
            </CardContent>
          </Card>

          {/* Total Appointments */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <span>Total Appointments</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-gray-900">{stats.totalAppointments}</span>
                <span className="text-xs text-gray-400 ml-1.5 font-medium">consultations</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                Walk-ins & Online bookings
              </p>
            </CardContent>
          </Card>

          {/* Platform Revenue */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <span>Platform Billing Volume</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-gray-900">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Total paid fees processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SEARCH & FILTER BAR */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search clinics by name, slug, phone, doctor email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs bg-gray-50 border-gray-200 h-9"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { label: 'All Clinics', value: 'ALL', count: clinics.length },
                  {
                    label: 'Human Clinics',
                    value: 'HUMAN',
                    count: clinics.filter((c) => c.type === 'HUMAN').length,
                  },
                  {
                    label: 'Vet Hospitals',
                    value: 'VET',
                    count: clinics.filter((c) => c.type === 'VET').length,
                  },
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setTypeFilter(f.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      typeFilter === f.value
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        typeFilter === f.value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
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

        {/* CLINICS DIRECTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Active Clinics ({filteredClinics.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredClinics.map((clinic) => {
              const isVet = clinic.type === 'VET'
              const themeColor = clinic.themeColor || (isVet ? '#10b981' : '#0ea5e9')
              const doctor = clinic.users.find((u) => u.role === 'DOCTOR')
              const receptionist = clinic.users.find((u) => u.role === 'RECEPTIONIST')

              return (
                <Card
                  key={clinic.id}
                  className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Clinic Identity & Details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-xs flex-shrink-0"
                            style={{ backgroundColor: themeColor }}
                          >
                            {isVet ? '🐾' : '🏥'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-gray-900">
                                {clinic.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  isVet
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}
                              >
                                {isVet ? '🐾 VET MODE' : '🏥 HUMAN MODE'}
                              </Badge>
                              <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-mono">
                                slug: {clinic.slug}
                              </code>
                            </div>

                            {/* Address & Phone */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                              {clinic.address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="truncate max-w-xs">{clinic.address}</span>
                                </span>
                              )}
                              {clinic.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{clinic.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Staff Credentials Preview */}
                        <div className="pt-2 flex items-center gap-3 flex-wrap text-xs text-gray-600">
                          <span className="font-semibold text-gray-500">Staff Accounts:</span>
                          {doctor && (
                            <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5 font-mono text-[11px]">
                              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                              {doctor.email}
                            </span>
                          )}
                          {receptionist && (
                            <span className="bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-100 flex items-center gap-1.5 font-mono text-[11px]">
                              <Users className="w-3.5 h-3.5 text-teal-600" />
                              {receptionist.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Live Stats counts */}
                      <div className="flex items-center gap-4 sm:gap-6 border-y sm:border-y-0 sm:border-x border-gray-100 py-3 sm:py-0 sm:px-6 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 font-medium">Patients</p>
                          <p className="text-xl font-black text-gray-900 mt-0.5">
                            {clinic._count.patients}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 font-medium">Appts</p>
                          <p className="text-xl font-black text-gray-900 mt-0.5">
                            {clinic._count.appointments}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 font-medium">Invoices</p>
                          <p className="text-xl font-black text-gray-900 mt-0.5">
                            {clinic._count.invoices}
                          </p>
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0 justify-center">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/queue/${clinic.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-semibold bg-white hover:bg-gray-100 h-8 text-gray-700"
                            >
                              <Tv className="w-3.5 h-3.5 mr-1 text-gray-500" />
                              TV Screen
                            </Button>
                          </a>

                          <a
                            href={`/book/${clinic.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-semibold bg-white hover:bg-gray-100 h-8 text-gray-700"
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1 text-gray-500" />
                              Booking Form
                            </Button>
                          </a>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyStaffCredentials(clinic)}
                          className="w-full text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 h-8"
                        >
                          {copiedId === clinic.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Copied Logins!
                            </>
                          ) : (
                            <>
                              <KeyRound className="w-3.5 h-3.5 mr-1 text-purple-600" />
                              Copy Staff Logins
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filteredClinics.length === 0 && (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-base font-semibold text-gray-700">No clinics match</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try adjusting your search or click &quot;+ Onboard New Clinic&quot; to register a tenant.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ONBOARD CLINIC MODAL */}
      <OnboardClinicModal
        open={isOnboardModalOpen}
        onOpenChange={setIsOnboardModalOpen}
        onSuccess={fetchClinics}
      />
    </div>
  )
}
