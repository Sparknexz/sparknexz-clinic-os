'use client'

import React, { useState, useEffect } from 'react'
import {
  Receipt,
  IndianRupee,
  Smartphone,
  Banknote,
  CreditCard,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  User,
  PawPrint,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  PrintableReceiptModal,
  InvoiceData,
} from './PrintableReceiptModal'
import {
  GenerateInvoiceModal,
  SelectableAppointment,
} from './GenerateInvoiceModal'

interface BillingDeskProps {
  initialInvoices: InvoiceData[]
  initialAppointments: SelectableAppointment[]
  clinicSlug: string
  clinicType: 'HUMAN' | 'VET'
  clinicName: string
  clinicThemeColor?: string
  userName: string
  userRole: string
}

export function BillingDesk({
  initialInvoices,
  initialAppointments,
  clinicSlug,
  clinicType,
  clinicName,
  clinicThemeColor = '#0ea5e9',
  userName,
  userRole,
}: BillingDeskProps) {
  const isVet = clinicType === 'VET'

  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices)
  const [appointments, setAppointments] = useState<SelectableAppointment[]>(initialAppointments)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [modeFilter, setModeFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false)
  const [selectedReceipt, setSelectedReceipt] = useState<InvoiceData | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false)

  // Fetch updated invoices & stats
  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/invoices')
      if (res.ok) {
        const data = await res.json()
        if (data.invoices) {
          setInvoices(data.invoices)
        }
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate Real-Time Stats for Today
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const todayInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.createdAt)
    return invDate >= startOfToday && invDate <= endOfToday
  })

  const todayPaidInvoices = todayInvoices.filter((i) => i.status === 'PAID')
  const todayCollection = todayPaidInvoices.reduce((sum, i) => sum + i.totalAmount, 0)
  const paidCount = todayPaidInvoices.length
  const pendingInvoices = todayInvoices.filter((i) => i.status === 'PENDING')
  const pendingCount = pendingInvoices.length
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0)

  // Payment Mode Breakdown
  const paymentBreakdown = {
    UPI: { amount: 0, count: 0 },
    Cash: { amount: 0, count: 0 },
    Card: { amount: 0, count: 0 },
  }

  todayPaidInvoices.forEach((i) => {
    const mode = (i.paymentMode || 'UPI').toUpperCase()
    if (mode === 'UPI') {
      paymentBreakdown.UPI.amount += i.totalAmount
      paymentBreakdown.UPI.count += 1
    } else if (mode === 'CASH') {
      paymentBreakdown.Cash.amount += i.totalAmount
      paymentBreakdown.Cash.count += 1
    } else if (mode === 'CARD') {
      paymentBreakdown.Card.amount += i.totalAmount
      paymentBreakdown.Card.count += 1
    }
  })

  // Handle Mark as Paid
  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: 'PAID' } : inv
          )
        )
      }
    } catch (err) {
      console.error('Error marking as paid:', err)
    }
  }

  // Handle New Invoice Generated
  const handleInvoiceCreated = (newInvoice: InvoiceData) => {
    setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.id !== newInvoice.id)])
    setSelectedReceipt(newInvoice)
    setIsReceiptModalOpen(true)
  }

  // Filtered Invoices List
  const filteredInvoices = invoices.filter((inv) => {
    const pt = inv.appointment?.patient
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      pt?.ownerName?.toLowerCase().includes(search) ||
      pt?.phone?.includes(search) ||
      (pt?.petName && pt.petName.toLowerCase().includes(search)) ||
      String(inv.appointment?.tokenNumber).includes(search) ||
      inv.id.toLowerCase().includes(search)

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter
    const matchesMode =
      modeFilter === 'ALL' ||
      inv.paymentMode?.toUpperCase() === modeFilter.toUpperCase()

    return matchesSearch && matchesStatus && matchesMode
  })

  return (
    <div className="space-y-6">
      {/* DESK HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Billing & Digital Receipt Desk
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
              {isVet ? 'Vet Billing' : 'Clinic Billing'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time revenue tracking, fast invoice creation, and printable digital receipts with WhatsApp sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvoices}
            disabled={isLoading}
            className="text-xs bg-white text-gray-700 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsGenerateModalOpen(true)}
            className="text-xs font-bold text-white shadow-sm h-9 px-4"
            style={{ backgroundColor: clinicThemeColor }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Generate Invoice
          </Button>
        </div>
      </div>

      {/* TOP REVENUE STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Total Collection */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
          <div className="absolute right-2 -bottom-2 opacity-15">
            <IndianRupee className="w-24 h-24" />
          </div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between text-emerald-100 text-xs font-medium uppercase tracking-wider">
              <span>Today&apos;s Collection</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Paid</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black tracking-tight">
                ₹{todayCollection.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{paidCount} paid invoice{paidCount !== 1 ? 's' : ''} today</span>
            </p>
          </CardContent>
        </Card>

        {/* 2. Paid Invoices Count */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
              <span>Paid Invoices</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-gray-900">{paidCount}</span>
              <span className="text-xs text-gray-400 ml-1">/ {todayInvoices.length} today</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {todayInvoices.length > 0
                ? `${Math.round((paidCount / todayInvoices.length) * 100)}% payment clearance rate`
                : '100% cleared'}
            </p>
          </CardContent>
        </Card>

        {/* 3. Pending Payments */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
              <span>Pending Payments</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">{pendingCount}</span>
              <span className="text-xs font-bold text-gray-500">
                (₹{pendingAmount.toLocaleString('en-IN')})
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {pendingCount > 0 ? 'Awaiting patient settlement' : 'All clear! No pending payments'}
            </p>
          </CardContent>
        </Card>

        {/* 4. Payment Mode Breakdown */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Payment Breakdown</span>
              <Badge variant="outline" className="text-[10px] font-mono">Today</Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              {/* UPI */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  UPI ({paymentBreakdown.UPI.count})
                </span>
                <span className="font-bold text-gray-900">
                  ₹{paymentBreakdown.UPI.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Cash */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                  Cash ({paymentBreakdown.Cash.count})
                </span>
                <span className="font-bold text-gray-900">
                  ₹{paymentBreakdown.Cash.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Card */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  Card ({paymentBreakdown.Card.count})
                </span>
                <span className="font-bold text-gray-900">
                  ₹{paymentBreakdown.Card.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={
                  isVet
                    ? 'Search by pet name, owner, phone, or token #...'
                    : 'Search by patient name, phone, or token #...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs bg-gray-50 border-gray-200 h-9"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: 'All Invoices', value: 'ALL', count: invoices.length },
                {
                  label: 'Paid',
                  value: 'PAID',
                  count: invoices.filter((i) => i.status === 'PAID').length,
                },
                {
                  label: 'Pending',
                  value: 'PENDING',
                  count: invoices.filter((i) => i.status === 'PENDING').length,
                },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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

            {/* Mode Filter Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 font-medium">Mode:</span>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-hidden"
              >
                <option value="ALL">All Modes</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INVOICES LIST & TABLE */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-gray-900">
              Invoices & Digital Receipts
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {filteredInvoices.length} record{filteredInvoices.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="text-base font-semibold text-gray-700">No invoices found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                  ? 'No invoices match your selected search or filter criteria.'
                  : 'No invoices generated yet. Click "+ Generate Invoice" to create an invoice for today\'s completed visits.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGenerateModalOpen(true)}
                className="mt-4 text-xs font-semibold"
              >
                + Generate First Invoice
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredInvoices.map((inv) => {
                const pt = inv.appointment?.patient
                const invDate = new Date(inv.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                const invTime = new Date(inv.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div
                    key={inv.id}
                    className="p-4 transition-colors hover:bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Token Number + Patient Details */}
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      {/* Token Badge */}
                      <div
                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-extrabold flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: clinicThemeColor }}
                      >
                        <span className="text-[8px] uppercase tracking-wider opacity-85">Token</span>
                        <span className="text-lg leading-none font-bold mt-0.5">
                          #{inv.appointment?.tokenNumber ?? '-'}
                        </span>
                      </div>

                      {/* Patient & Invoice info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isVet ? (
                            <>
                              <span className="text-sm font-bold text-gray-900">
                                {pt?.petName || 'Unnamed Pet'}
                              </span>
                              <Badge className="bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200">
                                {pt?.petSpecies || 'Pet'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                · Owner: {pt?.ownerName}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-gray-900">
                                {pt?.ownerName}
                              </span>
                              {pt?.phone && (
                                <span className="text-xs font-mono text-gray-500">
                                  ({pt.phone})
                                </span>
                              )}
                            </>
                          )}

                          {/* Status Badge */}
                          {inv.status === 'PAID' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              PAID
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] font-bold border border-amber-200">
                              PENDING
                            </Badge>
                          )}
                        </div>

                        {/* Charges itemization & date */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span>
                            Consultation: <strong className="text-gray-700">₹{inv.consultationFee}</strong>
                          </span>
                          {inv.extraCharges > 0 && (
                            <span>
                              Extra: <strong className="text-gray-700">₹{inv.extraCharges}</strong>
                            </span>
                          )}
                          <span>·</span>
                          <span className="font-mono text-gray-400">
                            {invDate} at {invTime}
                          </span>
                          {inv.paymentMode && (
                            <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md text-[10px]">
                              via {inv.paymentMode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Total Amount & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-medium">
                          Total Amount
                        </span>
                        <span className="text-xl font-black text-gray-900">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                        {inv.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(inv.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold h-8"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Mark Paid
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReceipt(inv)
                            setIsReceiptModalOpen(true)
                          }}
                          className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold h-8"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-gray-500" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GENERATE INVOICE MODAL */}
      <GenerateInvoiceModal
        open={isGenerateModalOpen}
        onOpenChange={setIsGenerateModalOpen}
        clinicType={clinicType}
        clinicThemeColor={clinicThemeColor}
        appointments={appointments}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* PRINTABLE DIGITAL RECEIPT MODAL */}
      <PrintableReceiptModal
        open={isReceiptModalOpen}
        onOpenChange={setIsReceiptModalOpen}
        invoice={selectedReceipt}
        doctorName={userName}
      />
    </div>
  )
}
