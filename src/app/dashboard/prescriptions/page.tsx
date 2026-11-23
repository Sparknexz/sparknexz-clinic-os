import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Pill, Stethoscope, ArrowRight } from 'lucide-react'

export default async function PrescriptionsPage() {
  const session = await auth()
  if (!session) return null

  const prescriptions = await prisma.prescription.findMany({
    where: { clinicId: session.user.clinicId },
    include: { patient: true, appointment: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const isVet = session.user.clinicType === 'VET'
  const themeColor = session.user.clinicThemeColor || '#0ea5e9'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-500 mt-1">Recent clinical prescriptions & drug orders</p>
        </div>

        {session.user.role === 'DOCTOR' && (
          <Link href="/dashboard/doctor">
            <Button
              className="text-white font-semibold text-xs shadow-xs"
              style={{ backgroundColor: themeColor }}
            >
              <Stethoscope className="w-4 h-4 mr-1.5" />
              Open Doctor Consultation Desk
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {prescriptions.map((rx) => {
          const medicines = rx.medicinesJson ? JSON.parse(rx.medicinesJson) : []
          return (
            <Card key={rx.id} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {isVet
                        ? `${rx.patient.petName || 'Pet'} · ${rx.patient.ownerName}`
                        : rx.patient.ownerName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Diagnosis:</span> {rx.diagnosis || 'N/A'}
                    </p>
                    {rx.symptoms && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium">Symptoms:</span> {rx.symptoms}
                      </p>
                    )}
                    {medicines.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {medicines.map((med: { name: string }, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                            <Pill className="h-3 w-3" />
                            {med.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {prescriptions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No prescriptions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
