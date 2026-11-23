import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DoctorWorkspace } from '@/components/doctor/DoctorWorkspace'

export const dynamic = 'force-dynamic'

export default async function DoctorPage() {
  const session = await auth()
  if (!session?.user?.clinicId) {
    redirect('/login')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [appointments, clinic] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clinicId: session.user.clinicId,
        date: { gte: today, lt: tomorrow },
      },
      include: {
        patient: true,
        prescription: true,
      },
      orderBy: [
        // Show in-progress first, then waiting, then completed
        { status: 'asc' },
        { tokenNumber: 'asc' },
      ],
    }),
    prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
        themeColor: true,
      },
    }),
  ])

  if (!clinic) {
    redirect('/login')
  }

  // Serialize appointments cleanly for client component
  const serializedAppointments = appointments.map((appt) => ({
    id: appt.id,
    clinicId: appt.clinicId,
    patientId: appt.patientId,
    date: appt.date.toISOString(),
    slot: appt.slot,
    tokenNumber: appt.tokenNumber,
    status: appt.status as 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    notes: appt.notes,
    patient: {
      id: appt.patient.id,
      ownerName: appt.patient.ownerName,
      phone: appt.patient.phone,
      age: appt.patient.age,
      gender: appt.patient.gender,
      petName: appt.patient.petName,
      petSpecies: appt.patient.petSpecies,
      petBreed: appt.patient.petBreed,
      petWeight: appt.patient.petWeight,
    },
    prescription: appt.prescription
      ? {
          id: appt.prescription.id,
          symptoms: appt.prescription.symptoms,
          diagnosis: appt.prescription.diagnosis,
          medicinesJson: appt.prescription.medicinesJson,
          nextVisitDate: appt.prescription.nextVisitDate?.toISOString() || null,
        }
      : null,
  }))

  return (
    <DoctorWorkspace
      initialAppointments={serializedAppointments}
      clinic={{
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        type: clinic.type as 'HUMAN' | 'VET',
        address: clinic.address,
        phone: clinic.phone,
        themeColor: clinic.themeColor,
      }}
      doctorName={session.user.name || 'Doctor'}
      userRole={session.user.role}
    />
  )
}
