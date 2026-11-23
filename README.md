# SparkNexz Clinic & Vet OS

A modern, multi-tenant SaaS foundation built for **Human Clinics** and **Veterinary Hospitals** using Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn UI, and Prisma ORM with SQLite.

---

## 🚀 Features

- **Multi-Tenant Architecture**: Supports both **HUMAN** (`ClinicType.HUMAN`) and **VET** (`ClinicType.VET`) modes with isolated tenant data.
- **Dynamic Clinic Customization**: Dynamic theme coloring, clinic-specific branding, and mode badges (🏥 HUMAN MODE vs 🐾 VET MODE).
- **Role-Based Access Control**:
  - `SUPER_ADMIN`
  - `DOCTOR` (access to Prescriptions, Vaccinations, Queue, Appointments, Invoices)
  - `RECEPTIONIST` (access to Queue, Appointments, Patients, Invoices)
- **One-Click Demo Login**: Instantly switch between Doctor & Receptionist roles for both Human and Vet clinics with pre-configured demo buttons.
- **Medical Dashboard Layout**:
  - Collapsible desktop sidebar with persistent state
  - Mobile drawer navigation
  - Live patient queue tracker with token numbering and status tags
  - Real-time today stats (Appointments, Patients/Pets, Waiting queue, Completed visits)
- **SQLite Database**: Instant local zero-configuration development, easily switchable to PostgreSQL in production.

---

## 🔑 Demo Login Accounts

You can test every role immediately using the **One-Click Demo Login** buttons on `/login` or by entering the credentials below:

| Role | Clinic Mode | Email | Password |
|---|---|---|---|
| **Human Clinic Doctor** | 🏥 Apex Dental & Skin Clinic | `doctor@apex-dental.com` | `password123` |
| **Human Clinic Receptionist** | 🏥 Apex Dental & Skin Clinic | `reception@apex-dental.com` | `password123` |
| **Vet Doctor** | 🐾 Paws & Care Vet Hospital | `vet@paws-care.com` | `password123` |
| **Vet Receptionist** | 🐾 Paws & Care Vet Hospital | `reception@paws-care.com` | `password123` |

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

- **`Clinic`**: `id`, `name`, `slug`, `type` (`HUMAN` | `VET`), `address`, `phone`, `logoUrl`, `themeColor`, `createdAt`, `updatedAt`
- **`User`**: `id`, `clinicId`, `name`, `email`, `password`, `role` (`SUPER_ADMIN` | `DOCTOR` | `RECEPTIONIST`)
- **`Patient`**: `id`, `clinicId`, `ownerName`, `phone`, `age`, `gender`, `petName`, `petSpecies`, `petBreed`, `petWeight`, `createdAt`, `updatedAt`
- **`Appointment`**: `id`, `clinicId`, `patientId`, `date`, `slot`, `tokenNumber`, `status` (`WAITING` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`), `notes`
- **`Prescription`**: `id`, `clinicId`, `appointmentId`, `patientId`, `symptoms`, `diagnosis`, `medicinesJson`, `nextVisitDate`
- **`Vaccination`**: `id`, `clinicId`, `patientId`, `vaccineName`, `administeredDate`, `nextDueDate`, `reminderSent`
- **`Invoice`**: `id`, `clinicId`, `appointmentId`, `consultationFee`, `extraCharges`, `totalAmount`, `paymentMode`, `status` (`PAID` | `PENDING`)

---

## 🛠️ Switching to PostgreSQL

1. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/sparknexz_db?schema=public"
   ```
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run migrations and seed:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

---

## 💻 Commands

```bash
# Start development server
npm run dev

# Run Prisma migrations / push
npx prisma db push

# Re-run seed data
npx prisma db seed

# Build for production
npm run build
```
