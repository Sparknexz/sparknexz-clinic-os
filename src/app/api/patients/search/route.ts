import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')?.trim()

    if (!phone || phone.length < 3) {
      return NextResponse.json({ patients: [] })
    }

    // Search patients by phone number belonging only to this clinic
    const patients = await prisma.patient.findMany({
      where: {
        clinicId: session.user.clinicId,
        phone: {
          contains: phone,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({ patients })
  } catch (error) {
    console.error('Error searching patients:', error)
    return NextResponse.json(
      { error: 'Failed to search patients' },
      { status: 500 }
    )
  }
}
