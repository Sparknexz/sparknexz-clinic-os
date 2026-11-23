import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Phone, PawPrint, User } from 'lucide-react'

export default async function PatientsPage() {
  const session = await auth()
  if (!session) return null

  const patients = await prisma.patient.findMany({
    where: { clinicId: session.user.clinicId },
    include: {
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const isVet = session.user.clinicType === 'VET'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isVet ? 'Pets & Owners' : 'Patients'}
          </h1>
          <p className="text-gray-500 mt-1">{patients.length} registered</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Card key={patient.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {isVet
                    ? (patient.petName?.charAt(0) || patient.ownerName.charAt(0)).toUpperCase()
                    : patient.ownerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {isVet ? (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{patient.petName || 'Unknown Pet'}</p>
                        <PawPrint className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {patient.petSpecies} · {patient.petBreed}
                        {patient.petWeight && ` · ${patient.petWeight}kg`}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500 truncate">{patient.ownerName}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-900 truncate">{patient.ownerName}</p>
                      <p className="text-xs text-gray-500">
                        {patient.age && `${patient.age} yrs`}
                        {patient.gender && ` · ${patient.gender}`}
                      </p>
                    </>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{patient.phone}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {patient._count.appointments} visit{patient._count.appointments !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(patient.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No patients yet</p>
          <p className="text-sm">Run the seed script to add sample data</p>
        </div>
      )}
    </div>
  )
}
