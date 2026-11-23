import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TVQueueDisplay } from '@/components/queue/TVQueueDisplay'

export const dynamic = 'force-dynamic'

interface QueuePageProps {
  params: Promise<{ slug: string }>
}

export default async function QueuePage({ params }: QueuePageProps) {
  const { slug } = await params

  if (!slug) {
    notFound()
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      address: true,
      phone: true,
      logoUrl: true,
      themeColor: true,
    },
  })

  if (!clinic) {
    notFound()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const [nowServing, upNext, waitingCount, completedCount, totalCount] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        clinicId: clinic.id,
        date: { gte: today, lte: endOfDay },
        status: 'IN_PROGRESS',
      },
      include: {
        patient: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
        date: { gte: today, lte: endOfDay },
        status: 'WAITING',
      },
      include: {
        patient: true,
      },
      orderBy: {
        tokenNumber: 'asc',
      },
      take: 6,
    }),
    prisma.appointment.count({
      where: {
        clinicId: clinic.id,
        date: { gte: today, lte: endOfDay },
        status: 'WAITING',
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId: clinic.id,
        date: { gte: today, lte: endOfDay },
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId: clinic.id,
        date: { gte: today, lte: endOfDay },
      },
    }),
  ])

  const initialData = {
    clinic: {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      type: clinic.type as 'HUMAN' | 'VET',
      address: clinic.address,
      phone: clinic.phone,
      logoUrl: clinic.logoUrl,
      themeColor: clinic.themeColor,
    },
    nowServing: nowServing
      ? {
          id: nowServing.id,
          tokenNumber: nowServing.tokenNumber,
          slot: nowServing.slot,
          notes: nowServing.notes,
          status: nowServing.status,
          patient: {
            id: nowServing.patient.id,
            ownerName: nowServing.patient.ownerName,
            phone: nowServing.patient.phone,
            age: nowServing.patient.age,
            gender: nowServing.patient.gender,
            petName: nowServing.patient.petName,
            petSpecies: nowServing.patient.petSpecies,
            petBreed: nowServing.patient.petBreed,
            petWeight: nowServing.patient.petWeight,
          },
        }
      : null,
    upNext: upNext.map((appt) => ({
      id: appt.id,
      tokenNumber: appt.tokenNumber,
      slot: appt.slot,
      notes: appt.notes,
      status: appt.status,
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
    })),
    stats: {
      total: totalCount,
      waiting: waitingCount,
      inProgress: nowServing ? 1 : 0,
      completed: completedCount,
    },
  }

  return <TVQueueDisplay initialData={initialData} slug={slug} />
}
