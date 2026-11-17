'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Stethoscope, Loader2, User, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const demoAccounts = [
  {
    label: 'Human Clinic Doctor',
    email: 'doctor@apex-dental.com',
    password: 'password123',
    icon: '🏥',
    role: 'Doctor',
    clinic: 'Apex Dental & Skin',
    color: 'bg-blue-500 hover:bg-blue-600',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    label: 'Human Clinic Receptionist',
    email: 'reception@apex-dental.com',
    password: 'password123',
    icon: '📋',
    role: 'Receptionist',
    clinic: 'Apex Dental & Skin',
    color: 'bg-sky-500 hover:bg-sky-600',
    badgeColor: 'bg-sky-100 text-sky-800',
  },
  {
    label: 'Vet Doctor',
    email: 'vet@paws-care.com',
    password: 'password123',
    icon: '🐾',
    role: 'Vet Doctor',
    clinic: 'Paws & Care Vet',
    color: 'bg-emerald-500 hover:bg-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    label: 'Vet Receptionist',
    email: 'reception@paws-care.com',
    password: 'password123',
    icon: '🗒️',
    role: 'Receptionist',
    clinic: 'Paws & Care Vet',
    color: 'bg-teal-500 hover:bg-teal-600',
    badgeColor: 'bg-teal-100 text-teal-800',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setError('')
    setLoadingDemo(account.email)
    setEmail(account.email)
    setPassword(account.password)

    try {
      const result = await signIn('credentials', {
        email: account.email,
        password: account.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Demo login failed. Please run the seed script first.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoadingDemo(null)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-none">SparkNexz</h1>
              <p className="text-blue-200 text-sm">Clinic & Vet OS</p>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Modern Clinic Management, Simplified
            </h2>
            <p className="text-blue-200 text-lg leading-relaxed">
              A unified platform for human clinics and veterinary hospitals. Manage appointments, prescriptions, and patient records — all in one place.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Human Clinics', icon: '🏥', desc: 'Dental, Skin & General' },
            { label: 'Vet Hospitals', icon: '🐾', desc: 'Pets & Animals' },
            { label: 'Role-Based Access', icon: '🔐', desc: 'Doctor & Receptionist' },
            { label: 'Multi-Tenant', icon: '🏢', desc: 'Fully Isolated Data' },
          ].map((feature) => (
            <div key={feature.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <div className="text-white font-semibold text-sm">{feature.label}</div>
              <div className="text-blue-200 text-xs">{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-none">SparkNexz</h1>
              <p className="text-gray-500 text-xs">Clinic & Vet OS</p>
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
              <CardDescription className="text-gray-500">
                Sign in to your clinic dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
                    One-Click Demo Login
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center mb-3">
                  Try any role instantly — no setup needed
                </p>
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleDemoLogin(account)}
                    disabled={loadingDemo !== null}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-white transition-all duration-200 ${account.color} disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]`}
                  >
                    {loadingDemo === account.email ? (
                      <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                    ) : (
                      <span className="text-xl flex-shrink-0">{account.icon}</span>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-sm">{account.label}</div>
                      <div className="text-xs opacity-80 truncate">{account.clinic} · {account.role}</div>
                    </div>
                    <span className="text-xs opacity-70 flex-shrink-0">→</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-gray-400">
                All demo accounts use password:{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">password123</code>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
