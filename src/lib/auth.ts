import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.clinicId = (user.clinicId as string) || ''
        token.clinicSlug = user.clinicSlug || ''
        token.clinicType = user.clinicType || 'HUMAN'
        token.clinicName = user.clinicName || 'Clinic'
        token.clinicThemeColor = user.clinicThemeColor || '#0ea5e9'
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.clinicId = (token.clinicId as string) || ''
        session.user.clinicSlug = (token.clinicSlug as string) || ''
        session.user.clinicType = (token.clinicType as string) || 'HUMAN'
        session.user.clinicName = (token.clinicName as string) || 'Clinic'
        session.user.clinicThemeColor = (token.clinicThemeColor as string) || '#0ea5e9'
      }
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        const user = await prisma.user.findUnique({
          where: { email },
          include: { clinic: true },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId || '',
          clinicSlug: user.clinic?.slug || '',
          clinicType: user.clinic?.type || '',
          clinicName: user.clinic?.name || 'SparkNexz Admin',
          clinicThemeColor: user.clinic?.themeColor || '#0ea5e9',
        }
      },
    }),
  ],
})
