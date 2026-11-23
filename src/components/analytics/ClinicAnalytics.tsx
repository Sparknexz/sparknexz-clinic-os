'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  BarChart3,
  Users,
  IndianRupee,
  Calendar,
  Smartphone,
  Banknote,
  CreditCard,
  CheckCircle2,
  Clock,
  PawPrint,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart,
  Activity,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface DailyVisitMetric {
  date: string
  dayName: string
  shortDate: string
  totalVisits: number
  completed: number
  inProgress: number
  waiting: number
  cancelled: number
  revenue: number
}

export interface PaymentModeSplit {
  mode: 'UPI' | 'Cash' | 'Card'
  amount: number
  count: number
  percentage: number
}

export interface SpeciesDistribution {
  species: string
  count: number
  percentage: number
  icon: string
}

export interface DemographicDistribution {
  label: string
  count: number
  percentage: number
}

interface ClinicAnalyticsProps {
  clinicName: string
  clinicSlug: string
  clinicType: 'HUMAN' | 'VET'
  clinicThemeColor?: string
  last7DaysVisits: DailyVisitMetric[]
  paymentSplit: PaymentModeSplit[]
  totalRevenue7Days: number
  totalVisits7Days: number
  totalPaidCount7Days: number
  averageRevenuePerVisit: number
  speciesData?: SpeciesDistribution[]
  demographicData?: DemographicDistribution[]
}

const MODE_COLORS: Record<string, { bg: string; bar: string; text: string; icon: any }> = {
  UPI: {
    bg: 'bg-emerald-50',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
    icon: Smartphone,
  },
  Cash: {
    bg: 'bg-amber-50',
    bar: 'bg-amber-500',
    text: 'text-amber-700',
    icon: Banknote,
  },
  Card: {
    bg: 'bg-blue-50',
    bar: 'bg-blue-500',
    text: 'text-blue-700',
    icon: CreditCard,
  },
}

export function ClinicAnalytics({
  clinicName,
  clinicSlug,
  clinicType,
  clinicThemeColor = '#0ea5e9',
  last7DaysVisits,
  paymentSplit,
  totalRevenue7Days,
  totalVisits7Days,
  totalPaidCount7Days,
  averageRevenuePerVisit,
  speciesData = [],
  demographicData = [],
}: ClinicAnalyticsProps) {
  const isVet = clinicType === 'VET'
  const [activeTab, setActiveTab] = useState<'VISITS' | 'REVENUE'>('VISITS')

  // Calculate highest values for relative bar heights
  const maxVisits = Math.max(...last7DaysVisits.map((d) => d.totalVisits), 1)
  const maxRevenue = Math.max(...last7DaysVisits.map((d) => d.revenue), 1)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Clinic & Revenue Analytics
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
              {isVet ? '🐾 Vet Insights' : '🏥 Medical Insights'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Performance overview for the last 7 days: patient footfall, daily revenue, and payment channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs px-3 py-1 font-medium">
            <Calendar className="w-3.5 h-3.5 mr-1 text-gray-500" />
            Last 7 Days Rolling Window
          </Badge>
        </div>
      </div>

      {/* TOP SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total 7-Day Revenue */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
          <div className="absolute right-1 -bottom-2 opacity-15">
            <IndianRupee className="w-24 h-24 text-emerald-400" />
          </div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between text-gray-400 text-xs uppercase tracking-wider font-semibold">
              <span>7-Day Total Revenue</span>
              <span className="text-emerald-400 flex items-center gap-0.5 text-[11px] font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Live
              </span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-emerald-400 tracking-tight">
                ₹{totalRevenue7Days.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Across {totalPaidCount7Days} settled invoices
            </p>
          </CardContent>
        </Card>

        {/* Total Patient Visits */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <span>{isVet ? '7-Day Pet Visits' : '7-Day Patient Visits'}</span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: clinicThemeColor }}
              >
                {isVet ? <PawPrint className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-gray-900">{totalVisits7Days}</span>
              <span className="text-xs text-gray-400 ml-1.5 font-medium">appointments</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Avg. {Math.round(totalVisits7Days / 7)} visits per day</span>
            </p>
          </CardContent>
        </Card>

        {/* Average Ticket Size / Revenue per Visit */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <span>Avg. Fee Per Visit</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-gray-900">
                ₹{Math.round(averageRevenuePerVisit).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Consultation + extras blended average
            </p>
          </CardContent>
        </Card>

        {/* Primary Payment Mode */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <span>Top Payment Method</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-gray-900">
                {paymentSplit[0]?.mode || 'UPI'}
              </span>
              <span className="text-xs text-emerald-600 font-bold ml-1.5">
                {paymentSplit[0]?.percentage || 0}% share
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              ₹{(paymentSplit[0]?.amount || 0).toLocaleString('en-IN')} collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 7-DAY VISITS & REVENUE TREND CHART */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base font-bold text-gray-900">
              Last 7 Days Activity & Volume Trends
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Daily breakdown of completed visits and revenue inflow
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('VISITS')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'VISITS'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Patient Visits ({totalVisits7Days})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REVENUE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'REVENUE'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Revenue (₹{totalRevenue7Days.toLocaleString('en-IN')})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-6">
          {/* VISUAL BAR CHART */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end min-h-[220px] pt-8 border-b border-gray-100 pb-4">
            {last7DaysVisits.map((item, idx) => {
              const isToday = idx === last7DaysVisits.length - 1
              const val = activeTab === 'VISITS' ? item.totalVisits : item.revenue
              const maxVal = activeTab === 'VISITS' ? maxVisits : maxRevenue
              const barHeightPct = Math.max(12, Math.round((val / maxVal) * 100))

              return (
                <div key={item.date} className="flex flex-col items-center gap-2 group">
                  {/* Tooltip Value */}
                  <span className="text-[11px] font-bold text-gray-700 transition-transform group-hover:-translate-y-1">
                    {activeTab === 'VISITS' ? val : `₹${val.toLocaleString('en-IN')}`}
                  </span>

                  {/* Visual Bar */}
                  <div className="w-full max-w-[48px] bg-gray-100 rounded-xl h-44 flex flex-col justify-end p-1 overflow-hidden relative">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-xs'
                          : 'bg-gradient-to-t from-blue-600 to-sky-400 group-hover:brightness-110'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    />
                  </div>

                  {/* Date & Day Label */}
                  <div className="text-center">
                    <p className={`text-[11px] font-bold ${isToday ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {isToday ? 'Today' : item.dayName}
                    </p>
                    <p className="text-[10px] text-gray-400">{item.shortDate}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Chart Footer Highlights */}
          <div className="pt-4 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Historical Days
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Today (Current)
              </span>
            </div>
            <p className="text-gray-400 text-[11px]">
              Peak activity: {Math.max(...last7DaysVisits.map((d) => d.totalVisits))} visits in a single day
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LOWER SECTION: PAYMENT MODE SPLIT & DEMOGRAPHICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PAYMENT MODE SPLIT CARDS */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                Payment Mode Breakdown
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                7-Day Split
              </Badge>
            </div>
            <CardDescription className="text-xs text-gray-500">
              Volume and revenue share across UPI, Cash, and Card
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Stacked Progress Bar */}
            <div className="w-full h-4 rounded-full bg-gray-100 flex overflow-hidden p-0.5">
              {paymentSplit.map((split) => {
                const conf = MODE_COLORS[split.mode] || MODE_COLORS.UPI
                return (
                  <div
                    key={split.mode}
                    className={`${conf.bar} h-full first:rounded-l-full last:rounded-r-full transition-all`}
                    style={{ width: `${Math.max(2, split.percentage)}%` }}
                    title={`${split.mode}: ${split.percentage}%`}
                  />
                )
              })}
            </div>

            {/* Mode Cards */}
            <div className="space-y-3 pt-1">
              {paymentSplit.map((split) => {
                const conf = MODE_COLORS[split.mode] || MODE_COLORS.UPI
                const Icon = conf.icon
                return (
                  <div
                    key={split.mode}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${conf.bg} ${conf.text} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{split.mode}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            ({split.count} transactions)
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {split.percentage}% of platform revenue
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ₹{split.amount.toLocaleString('en-IN')}
                      </p>
                      <Badge className={`text-[10px] ${conf.bg} ${conf.text} hover:${conf.bg}`}>
                        {split.percentage}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* CLINIC DEMOGRAPHICS / PET SPECIES BREAKDOWN */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                {isVet ? (
                  <>
                    <PawPrint className="w-4 h-4 text-emerald-600" />
                    Pet Species Distribution
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-blue-600" />
                    Patient Demographics
                  </>
                )}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {isVet ? 'Species' : 'Gender & Age'}
              </Badge>
            </div>
            <CardDescription className="text-xs text-gray-500">
              {isVet
                ? 'Breakdown of pets treated at Paws & Care'
                : 'Patient distribution across consultations'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {isVet ? (
              <div className="space-y-3">
                {speciesData.map((sp) => (
                  <div key={sp.species} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="text-sm">{sp.icon}</span>
                        <span>{sp.species}</span>
                      </span>
                      <span className="font-semibold text-gray-600">
                        {sp.count} pet{sp.count !== 1 ? 's' : ''} ({sp.percentage}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(5, sp.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {demographicData.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800">{item.label}</span>
                      <span className="font-semibold text-gray-600">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.max(5, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
