import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Phone, MapPin, Palette, Users, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) return null

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    include: { _count: { select: { users: true, patients: true } } },
  })

  if (!clinic) return null

  const isVet = session.user.clinicType === 'VET'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Clinic information and preferences</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Clinic Information</CardTitle>
          <CardDescription>Your clinic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5" />
                Clinic Name
              </div>
              <p className="text-gray-900 font-medium">{clinic.name}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5" />
                Type
              </div>
              <Badge className={isVet ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}>
                {isVet ? '🐾 Veterinary' : '🏥 Human Clinic'}
              </Badge>
            </div>
            {clinic.phone && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </div>
                <p className="text-gray-900">{clinic.phone}</p>
              </div>
            )}
            {clinic.address && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </div>
                <p className="text-gray-900 text-sm">{clinic.address}</p>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                <Palette className="h-3.5 w-3.5" />
                Theme Color
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: clinic.themeColor || '#0ea5e9' }} />
                <span className="text-gray-700 font-mono text-sm">{clinic.themeColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" />
                Stats
              </div>
              <p className="text-gray-900 text-sm">
                {clinic._count.users} staff · {clinic._count.patients} patients
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              {(session.user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{session.user.name}</p>
              <p className="text-sm text-gray-500">{session.user.email}</p>
              <Badge variant="outline" className="text-xs mt-1">{session.user.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
