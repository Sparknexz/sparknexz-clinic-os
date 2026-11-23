import { PrismaClient, ClinicType, UserRole, AppointmentStatus, InvoiceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed for SparkNexz Clinic & Vet OS...')

  // Clear existing data cleanly in reverse order of foreign keys
  await prisma.invoice.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.vaccination.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()
  await prisma.clinic.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // ==========================================
  // 0. SUPER ADMIN (Global Platform Admin)
  // ==========================================
  const superAdmin = await prisma.user.create({
    data: {
      name: 'SparkNexz Super Admin',
      email: 'admin@sparknexz.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log('⚡ Super Admin created:', superAdmin.email)

  // ==========================================
  // 1. HUMAN CLINIC: Apex Dental & Skin Clinic
  // ==========================================
  const humanClinic = await prisma.clinic.create({
    data: {
      name: 'Apex Dental & Skin Clinic',
      slug: 'apex-dental',
      type: ClinicType.HUMAN,
      address: 'Suite 402, Metro Health Plaza, MG Road, Bengaluru, Karnataka 560001',
      phone: '+91 80 2345 6789',
      logoUrl: '/logos/apex-dental.png',
      themeColor: '#0ea5e9', // Sky blue
    },
  })

  // Human Clinic Users
  const doctorArjun = await prisma.user.create({
    data: {
      clinicId: humanClinic.id,
      name: 'Dr. Arjun Mehta',
      email: 'doctor@apex-dental.com',
      password: hashedPassword,
      role: UserRole.DOCTOR,
    },
  })

  const receptionistPriya = await prisma.user.create({
    data: {
      clinicId: humanClinic.id,
      name: 'Priya Sharma',
      email: 'reception@apex-dental.com',
      password: hashedPassword,
      role: UserRole.RECEPTIONIST,
    },
  })

  // Human Clinic Patients
  const patient1 = await prisma.patient.create({
    data: {
      clinicId: humanClinic.id,
      ownerName: 'Ravi Kumar',
      phone: '+91 98765 11111',
      age: 34,
      gender: 'Male',
    },
  })

  const patient2 = await prisma.patient.create({
    data: {
      clinicId: humanClinic.id,
      ownerName: 'Ananya Deshmukh',
      phone: '+91 98765 22222',
      age: 28,
      gender: 'Female',
    },
  })

  const patient3 = await prisma.patient.create({
    data: {
      clinicId: humanClinic.id,
      ownerName: 'Vikram Malhotra',
      phone: '+91 98765 33333',
      age: 45,
      gender: 'Male',
    },
  })

  const patient4 = await prisma.patient.create({
    data: {
      clinicId: humanClinic.id,
      ownerName: 'Meera Patel',
      phone: '+91 98765 44444',
      age: 39,
      gender: 'Female',
    },
  })

  const today = new Date()
  today.setHours(9, 0, 0, 0)

  // Human Clinic Today Appointments
  const apptH1 = await prisma.appointment.create({
    data: {
      clinicId: humanClinic.id,
      patientId: patient1.id,
      date: today,
      slot: '09:30 AM',
      tokenNumber: 1,
      status: AppointmentStatus.COMPLETED,
      notes: 'Root canal follow up and crown fitting',
    },
  })

  const apptH2 = await prisma.appointment.create({
    data: {
      clinicId: humanClinic.id,
      patientId: patient2.id,
      date: today,
      slot: '10:00 AM',
      tokenNumber: 2,
      status: AppointmentStatus.IN_PROGRESS,
      notes: 'Skin rash on forearms and mild itching',
    },
  })

  const apptH3 = await prisma.appointment.create({
    data: {
      clinicId: humanClinic.id,
      patientId: patient3.id,
      date: today,
      slot: '10:30 AM',
      tokenNumber: 3,
      status: AppointmentStatus.WAITING,
      notes: 'Severe toothache in lower left molar',
    },
  })

  const apptH4 = await prisma.appointment.create({
    data: {
      clinicId: humanClinic.id,
      patientId: patient4.id,
      date: today,
      slot: '11:00 AM',
      tokenNumber: 4,
      status: AppointmentStatus.WAITING,
      notes: 'Routine dental scaling and cleaning',
    },
  })

  // Sample Invoice for Completed Human Appointment
  await prisma.invoice.create({
    data: {
      clinicId: humanClinic.id,
      appointmentId: apptH1.id,
      consultationFee: 500,
      extraCharges: 300,
      totalAmount: 800,
      paymentMode: 'UPI',
      status: InvoiceStatus.PAID,
    },
  })

  // Prescription for Patient 1
  await prisma.prescription.create({
    data: {
      clinicId: humanClinic.id,
      appointmentId: apptH1.id,
      patientId: patient1.id,
      symptoms: 'Mild tooth sensitivity post-op',
      diagnosis: 'Post-endodontic healing',
      medicinesJson: JSON.stringify([
        { name: 'Amoxicillin 500mg', dosage: '1-0-1', timing: 'After Food', duration: '5 Days' },
        { name: 'Zerodol-SP', dosage: '1-0-1', timing: 'After Food', duration: '3 Days' },
      ]),
      nextVisitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // ==========================================
  // 2. VET CLINIC: Paws & Care Vet Hospital
  // ==========================================
  const vetClinic = await prisma.clinic.create({
    data: {
      name: 'Paws & Care Vet Hospital',
      slug: 'paws-care',
      type: ClinicType.VET,
      address: 'Plot 18, Green Valley Avenue, Indiranagar, Bengaluru, Karnataka 560038',
      phone: '+91 80 4123 9999',
      logoUrl: '/logos/paws-care.png',
      themeColor: '#10b981', // Emerald green
    },
  })

  // Vet Clinic Users
  const vetDoctorShalini = await prisma.user.create({
    data: {
      clinicId: vetClinic.id,
      name: 'Dr. Shalini Rao, BVSc',
      email: 'vet@paws-care.com',
      password: hashedPassword,
      role: UserRole.DOCTOR,
    },
  })

  const vetReceptionistKavita = await prisma.user.create({
    data: {
      clinicId: vetClinic.id,
      name: 'Kavita Nair',
      email: 'reception@paws-care.com',
      password: hashedPassword,
      role: UserRole.RECEPTIONIST,
    },
  })

  // Vet Patients (Pets + Owners)
  const pet1 = await prisma.patient.create({
    data: {
      clinicId: vetClinic.id,
      ownerName: 'Sunil Verma',
      phone: '+91 98450 12345',
      petName: 'Bruno',
      petSpecies: 'Dog',
      petBreed: 'Golden Retriever',
      age: 3,
      petWeight: 28.5,
      gender: 'Male',
    },
  })

  const pet2 = await prisma.patient.create({
    data: {
      clinicId: vetClinic.id,
      ownerName: 'Sneha Roy',
      phone: '+91 98450 67890',
      petName: 'Milo',
      petSpecies: 'Cat',
      petBreed: 'Persian Longhair',
      age: 2,
      petWeight: 4.2,
      gender: 'Male',
    },
  })

  const pet3 = await prisma.patient.create({
    data: {
      clinicId: vetClinic.id,
      ownerName: 'Tanvi Joshi',
      phone: '+91 98450 77777',
      petName: 'Bella',
      petSpecies: 'Dog',
      petBreed: 'Beagle',
      age: 1,
      petWeight: 11.0,
      gender: 'Female',
    },
  })

  const pet4 = await prisma.patient.create({
    data: {
      clinicId: vetClinic.id,
      ownerName: 'Rohan Sen',
      phone: '+91 98450 88888',
      petName: 'Rio',
      petSpecies: 'Bird',
      petBreed: 'Cockatiel',
      age: 1,
      petWeight: 0.1,
      gender: 'Male',
    },
  })

  // Vet Appointments Today
  const apptV1 = await prisma.appointment.create({
    data: {
      clinicId: vetClinic.id,
      patientId: pet1.id,
      date: today,
      slot: '09:30 AM',
      tokenNumber: 1,
      status: AppointmentStatus.COMPLETED,
      notes: 'Annual Rabies and DHPPi vaccination with ear checkup',
    },
  })

  const apptV2 = await prisma.appointment.create({
    data: {
      clinicId: vetClinic.id,
      patientId: pet2.id,
      date: today,
      slot: '10:00 AM',
      tokenNumber: 2,
      status: AppointmentStatus.IN_PROGRESS,
      notes: 'Lethargy, refusing wet food for 2 days',
    },
  })

  const apptV3 = await prisma.appointment.create({
    data: {
      clinicId: vetClinic.id,
      patientId: pet3.id,
      date: today,
      slot: '10:30 AM',
      tokenNumber: 3,
      status: AppointmentStatus.WAITING,
      notes: 'Limping on right hind leg after park play',
    },
  })

  const apptV4 = await prisma.appointment.create({
    data: {
      clinicId: vetClinic.id,
      patientId: pet4.id,
      date: today,
      slot: '11:00 AM',
      tokenNumber: 4,
      status: AppointmentStatus.WAITING,
      notes: 'Beak trim and feather health check',
    },
  })

  // Vet Invoices
  await prisma.invoice.create({
    data: {
      clinicId: vetClinic.id,
      appointmentId: apptV1.id,
      consultationFee: 500,
      extraCharges: 450,
      totalAmount: 950,
      paymentMode: 'Cash',
      status: InvoiceStatus.PAID,
    },
  })

  // Past 7 days historical invoices & appointments for rich analytics demo!
  for (let i = 1; i <= 6; i++) {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - i)
    pastDate.setHours(10, 0, 0, 0)

    // Past Human appointment & invoice
    const pastApptH = await prisma.appointment.create({
      data: {
        clinicId: humanClinic.id,
        patientId: i % 2 === 0 ? patient1.id : patient2.id,
        date: pastDate,
        slot: '11:00 AM',
        tokenNumber: i,
        status: AppointmentStatus.COMPLETED,
        notes: `Consultation on day -${i}`,
      },
    })

    const modes = ['UPI', 'Cash', 'Card']
    const amounts = [500, 800, 1200, 600, 750, 1500]
    await prisma.invoice.create({
      data: {
        clinicId: humanClinic.id,
        appointmentId: pastApptH.id,
        consultationFee: 500,
        extraCharges: amounts[i - 1] - 500,
        totalAmount: amounts[i - 1],
        paymentMode: modes[i % 3],
        status: InvoiceStatus.PAID,
        createdAt: pastDate,
      },
    })

    // Past Vet appointment & invoice
    const pastApptV = await prisma.appointment.create({
      data: {
        clinicId: vetClinic.id,
        patientId: i % 2 === 0 ? pet1.id : pet3.id,
        date: pastDate,
        slot: '11:30 AM',
        tokenNumber: i,
        status: AppointmentStatus.COMPLETED,
        notes: `Vet consultation on day -${i}`,
      },
    })

    await prisma.invoice.create({
      data: {
        clinicId: vetClinic.id,
        appointmentId: pastApptV.id,
        consultationFee: 500,
        extraCharges: amounts[6 - i] - 400,
        totalAmount: amounts[6 - i] + 100,
        paymentMode: modes[(i + 1) % 3],
        status: InvoiceStatus.PAID,
        createdAt: pastDate,
      },
    })
  }

  // Bruno's vaccinations
  await prisma.vaccination.create({
    data: {
      clinicId: vetClinic.id,
      patientId: pet1.id,
      vaccineName: 'Rabies (Defensor 3)',
      administeredDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      nextDueDate: today,
      reminderSent: true,
    },
  })

  await prisma.vaccination.create({
    data: {
      clinicId: vetClinic.id,
      patientId: pet1.id,
      vaccineName: 'DHPPi + Lepto',
      administeredDate: today,
      nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      reminderSent: false,
    },
  })

  console.log('✅ Database seeded successfully with:')
  console.log(' - Super Admin: admin@sparknexz.com / password123')
  console.log(' - Human Clinic: doctor@apex-dental.com & reception@apex-dental.com')
  console.log(' - Vet Clinic: vet@paws-care.com & reception@paws-care.com')
  console.log(' - Sample appointments, invoices, prescriptions, and past 7 days analytics data!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
