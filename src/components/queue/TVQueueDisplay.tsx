'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Clock,
  MapPin,
  Phone,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Users,
  CheckCircle2,
  Sparkles,
  PawPrint,
  Stethoscope,
  Activity,
  ArrowRight,
  Shield,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

interface AppointmentItem {
  id: string
  tokenNumber: number
  slot: string
  status: string
  notes?: string | null
  patient: Patient
}

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

interface TVQueueDisplayProps {
  initialData: {
    clinic: ClinicData
    nowServing: AppointmentItem | null
    upNext: AppointmentItem[]
    stats: {
      total: number
      waiting: number
      inProgress: number
      completed: number
    }
  }
  slug: string
}

const SPECIES_ICONS: Record<string, string> = {
  Dog: '🐶',
  Cat: '🐱',
  Bird: '🦜',
  Rabbit: '🐰',
  Other: '🐾',
}

export function TVQueueDisplay({ initialData, slug }: TVQueueDisplayProps) {
  const [data, setData] = useState(initialData)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [justChanged, setJustChanged] = useState(false)

  const previousTokenRef = useRef<number | null>(initialData.nowServing?.tokenNumber ?? null)

  const clinic = data.clinic
  const isVet = clinic.type === 'VET'
  const themeColor = clinic.themeColor || (isVet ? '#10b981' : '#0ea5e9')

  // Digital Clock updating every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      )
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Play Web Audio synthetic chime on token change
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      // High gentle dual chime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3) // A5

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.8) // D6

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(ctx.currentTime)
      osc2.start(ctx.currentTime + 0.25)
      osc1.stop(ctx.currentTime + 0.8)
      osc2.stop(ctx.currentTime + 1.2)
    } catch (err) {
      console.log('Audio chime not allowed yet by user gesture:', err)
    }
  }

  // Poll queue every 5 seconds
  useEffect(() => {
    const pollQueue = async () => {
      try {
        const res = await fetch(`/api/public/queue/${slug}`)
        if (res.ok) {
          const fresh = await res.json()
          const newCurrentToken = fresh.nowServing?.tokenNumber ?? null

          if (previousTokenRef.current !== newCurrentToken) {
            previousTokenRef.current = newCurrentToken
            setJustChanged(true)
            if (soundEnabled && newCurrentToken !== null) {
              playChime()
            }
            setTimeout(() => setJustChanged(false), 2500)
          }

          setData(fresh)
        }
      } catch (err) {
        console.error('Queue poll error:', err)
      }
    }

    const interval = setInterval(pollQueue, 5000)
    return () => clearInterval(interval)
  }, [slug, soundEnabled])

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false))
    }
  }

  const nowServing = data.nowServing

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* TOP TV HEADER */}
      <header className="px-8 py-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md z-10 shadow-lg">
        {/* Left: Clinic Identity */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg text-2xl flex-shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            {isVet ? <PawPrint className="w-8 h-8" /> : <Stethoscope className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                {clinic.name}
              </h1>
              <Badge
                className={
                  isVet
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold px-3 py-1'
                }
              >
                {isVet ? '🐾 VET HOSPITAL' : '🏥 MEDICAL CLINIC'}
              </Badge>
            </div>
            {clinic.address && (
              <p className="text-xs lg:text-sm text-slate-400 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>{clinic.address}</span>
                {clinic.phone && (
                  <>
                    <span className="text-slate-600">·</span>
                    <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>{clinic.phone}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right: Clock & Controls */}
        <div className="flex items-center gap-6">
          {/* Digital Clock */}
          <div className="text-right">
            <div className="text-2xl lg:text-4xl font-mono font-bold tracking-tight text-cyan-400 drop-shadow-sm">
              {currentTime || '--:--:--'}
            </div>
            <div className="text-xs lg:text-sm font-medium text-slate-400 uppercase tracking-wider mt-0.5">
              {currentDate}
            </div>
          </div>

          {/* Quick TV Control Buttons */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DUAL DISPLAY BODY */}
      <div className="flex-1 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch overflow-hidden">
        {/* LEFT / HERO SECTION: NOW SERVING (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div
            className={`h-full rounded-3xl p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden transition-all duration-500 border-2 ${
              justChanged
                ? 'ring-8 ring-cyan-400/40 border-cyan-400 scale-[1.01]'
                : 'border-slate-800'
            } bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-2xl`}
          >
            {/* Background ambient glow */}
            <div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: themeColor }}
            />

            {/* Top Tag */}
            <div className="flex items-center justify-between relative z-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>NOW SERVING · CONSULTATION ROOM 1</span>
              </div>
              <div className="text-slate-400 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>LIVE QUEUE</span>
              </div>
            </div>

            {/* Central Token Content */}
            <div className="my-auto py-8 text-center relative z-10">
              {nowServing ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <p className="text-sm lg:text-base font-bold text-slate-400 uppercase tracking-widest">
                    PATIENT TOKEN NUMBER
                  </p>

                  {/* HUGE TOKEN NUMBER */}
                  <div className="inline-block relative">
                    <div
                      className="text-8xl sm:text-9xl lg:text-[11rem] font-black tracking-tight leading-none drop-shadow-2xl font-mono"
                      style={{ color: themeColor }}
                    >
                      #{String(nowServing.tokenNumber).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Patient / Pet Name */}
                  <div className="pt-2">
                    {isVet ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-4xl lg:text-5xl font-black text-white">
                            {nowServing.patient.petName || 'Patient Pet'}
                          </span>
                          <span className="text-3xl">
                            {SPECIES_ICONS[nowServing.patient.petSpecies || 'Other'] || '🐾'}
                          </span>
                        </div>
                        <p className="text-lg text-emerald-400 font-semibold">
                          {nowServing.patient.petSpecies || 'Pet'}
                          {nowServing.patient.petBreed ? ` · ${nowServing.patient.petBreed}` : ''}
                          {nowServing.patient.petWeight ? ` (${nowServing.patient.petWeight}kg)` : ''}
                        </p>
                        <p className="text-sm text-slate-400">
                          Owner: <span className="text-white font-medium">{nowServing.patient.ownerName}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                          {nowServing.patient.ownerName}
                        </h2>
                        <p className="text-sm lg:text-base text-slate-400">
                          {nowServing.patient.age ? `${nowServing.patient.age} yrs` : ''}
                          {nowServing.patient.age && nowServing.patient.gender ? ' · ' : ''}
                          {nowServing.patient.gender || ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400 border border-slate-700">
                    <Clock className="w-10 h-10 text-cyan-400 animate-pulse" />
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-200">
                    Ready for Next Token
                  </h3>
                  <p className="text-sm lg:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                    The doctor will call in the next patient shortly. Please relax and keep an eye on this screen.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Instruction Alert */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs lg:text-sm text-slate-300 relative z-10">
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                Please keep your token pass or SMS ready when your number appears
              </span>
              <span className="hidden sm:inline-block text-slate-400 font-mono text-xs">
                Auto-syncs every 5s
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT / QUEUE SECTION: UP NEXT (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="h-full rounded-3xl p-6 lg:p-8 bg-slate-900/70 border border-slate-800 flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg lg:text-xl font-bold text-white tracking-wide">
                  UP NEXT IN QUEUE
                </h3>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs px-2.5 py-0.5">
                {data.stats.waiting} Waiting
              </Badge>
            </div>

            {/* Next Patients List */}
            <div className="flex-1 my-4 space-y-3 overflow-y-auto pr-1">
              {data.upNext.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
                  <p className="text-base font-semibold text-slate-300">All Caught Up!</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    No patients currently waiting in queue.
                  </p>
                </div>
              ) : (
                data.upNext.slice(0, 5).map((item, idx) => {
                  const patient = item.patient
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        idx === 0
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Token Badge */}
                        <div
                          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-black text-lg flex-shrink-0 shadow-sm ${
                            idx === 0
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-white border border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-bold leading-none">Token</span>
                          <span className="leading-tight">#{item.tokenNumber}</span>
                        </div>

                        {/* Patient info */}
                        <div className="min-w-0">
                          <p className="text-base font-bold text-white truncate">
                            {isVet
                              ? `${patient.petName || 'Pet'} (${patient.ownerName})`
                              : patient.ownerName}
                          </p>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                            {isVet && patient.petSpecies && (
                              <span className="text-emerald-400 font-semibold">
                                {SPECIES_ICONS[patient.petSpecies] || '🐾'} {patient.petSpecies}
                              </span>
                            )}
                            <span>{item.slot}</span>
                          </p>
                        </div>
                      </div>

                      {/* Position in queue */}
                      <div className="text-right flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            idx === 0
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 text-xs font-bold'
                              : 'text-slate-400 border-slate-700 text-[11px]'
                          }
                        >
                          {idx === 0
                            ? '1st Next'
                            : idx === 1
                            ? '2nd Next'
                            : idx === 2
                            ? '3rd Next'
                            : `${idx + 1}th Next`}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Quick Summary Pill at bottom of right column */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Today Total</span>
                <span className="text-lg font-bold text-white font-mono">{data.stats.total}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Waiting</span>
                <span className="text-lg font-bold text-amber-400 font-mono">{data.stats.waiting}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Completed</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{data.stats.completed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER TICKER */}
      <footer className="px-8 py-3 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="font-semibold text-slate-400">WAITING LOUNGE DISPLAY</span>
          <span>·</span>
          <span className="truncate">
            Please proceed to Consultation Room when your Token is announced. For questions, visit the Reception Desk.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-slate-600 flex-shrink-0">
          SparkNexz Clinic OS
        </div>
      </footer>
    </div>
  )
}
