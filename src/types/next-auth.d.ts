import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'SUPER_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | string
      clinicId: string
      clinicSlug: string
      clinicType: 'HUMAN' | 'VET' | string
      clinicName: string
      clinicThemeColor: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    role: string
    clinicId?: string | null
    clinicSlug?: string | null
    clinicType?: string | null
    clinicName?: string | null
    clinicThemeColor?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    clinicId: string
    clinicSlug: string
    clinicType: string
    clinicName: string
    clinicThemeColor: string
  }
}
