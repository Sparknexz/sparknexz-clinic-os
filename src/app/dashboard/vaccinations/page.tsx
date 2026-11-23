import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Syringe } from 'lucide-react'

export default async function VaccinationsPage() {
  const session = await auth()
  if (!session) return null

  const vaccinations = await prisma.vaccination.findMany({
    where: { clinicId: session.user.clinicId },
    include: { patient: true },
    orderBy: { administeredDate: 'desc' },
  })

  const isVet = session.user.clinicType === 'VET'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vaccination Records</h1>
        <p className="text-gray-500 mt-1">{vaccinations.length} records total</p>
      </div>

      <div className="space-y-3">
        {vaccinations.map((vax) => {
          const isOverdue = vax.nextDueDate && new Date(vax.nextDueDate) < new Date()
          return (
            <Card key={vax.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Syringe className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{vax.vaccineName}</p>
                      {isOverdue && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isVet
                        ? `${vax.patient.petName || 'Pet'} · ${vax.patient.ownerName}`
                        : vax.patient.ownerName}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-gray-400">
                        Given: {new Date(vax.administeredDate).toLocaleDateString('en-IN')}
                      </span>
                      {vax.nextDueDate && (
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          Due: {new Date(vax.nextDueDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {vaccinations.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Syringe className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No vaccination records</p>
          </div>
        )}
      </div>
    </div>
  )
}
