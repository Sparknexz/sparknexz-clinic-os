import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PublicBookingForm } from '@/components/booking/PublicBookingForm'

export const dynamic = 'force-dynamic'

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
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

  return (
    <PublicBookingForm
      clinic={{
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        type: clinic.type as 'HUMAN' | 'VET',
        address: clinic.address,
        phone: clinic.phone,
        logoUrl: clinic.logoUrl,
        themeColor: clinic.themeColor,
      }}
    />
  )
}
