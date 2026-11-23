'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  User,
  Phone,
  Calendar,
  Clock,
  FileText,
  Loader2,
  PawPrint,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

interface Patient {
  id: string
  ownerName: string
  phone: string
  age?: number | null
  gender?: string | null
  petName?: string | null
  petSpecies?: string | null
  petBreed?: string | null
  petWeight?: number | null
}

interface NewAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clinicType: 'HUMAN' | 'VET'
  clinicThemeColor?: string
  onSuccess: (appointment: any) => void
}

const COMMON_SLOTS = [
  'Walk-in / Immediate',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
]

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other']

export function NewAppointmentModal({
  open,
  onOpenChange,
  clinicType,
  clinicThemeColor = '#0ea5e9',
  onSuccess,
}: NewAppointmentModalProps) {
  const isVet = clinicType === 'VET'

  // Search state
  const [searchPhone, setSearchPhone] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Selected existing patient (if any)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isAddingNewPetForOwner, setIsAddingNewPetForOwner] = useState(false)

  // Form Fields
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')

  // Vet specific
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('Dog')
  const [petBreed, setPetBreed] = useState('')
  const [petWeight, setPetWeight] = useState('')

  // Appointment fields
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [slot, setSlot] = useState('Walk-in / Immediate')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Live Phone Lookup with debounce
  useEffect(() => {
    if (!open) {
      // Reset state when closed
      setSearchPhone('')
      setSearchResults([])
      setHasSearched(false)
      setSelectedPatient(null)
      setIsAddingNewPetForOwner(false)
      setOwnerName('')
      setPhone('')
      setAge('')
      setPetName('')
      setPetSpecies('Dog')
      setPetBreed('')
      setPetWeight('')
      setNotes('')
      setErrorMessage('')
      return
    }
  }, [open])

  useEffect(() => {
    const trimmed = searchPhone.trim()
    if (trimmed.length < 3) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/patients/search?phone=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (data.patients) {
          setSearchResults(data.patients)
          setHasSearched(true)
        }
      } catch (err) {
        console.error('Failed to search phone:', err)
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchPhone])

  // Select an existing patient/pet
  const handleSelectExistingPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsAddingNewPetForOwner(false)
    setOwnerName(patient.ownerName)
    setPhone(patient.phone)
    if (patient.age) setAge(String(patient.age))
    if (patient.gender) setGender(patient.gender)
    if (patient.petName) setPetName(patient.petName)
    if (patient.petSpecies) setPetSpecies(patient.petSpecies)
    if (patient.petBreed) setPetBreed(patient.petBreed)
    if (patient.petWeight) setPetWeight(String(patient.petWeight))
  }

  // Choose to add a new pet for existing owner
  const handleAddNewPetForOwner = (existingOwner: Patient) => {
    setSelectedPatient(null)
    setIsAddingNewPetForOwner(true)
    setOwnerName(existingOwner.ownerName)
    setPhone(existingOwner.phone)
    setPetName('')
    setPetSpecies('Dog')
    setPetBreed('')
    setPetWeight('')
    setAge('')
  }

  // Start fresh registration
  const handleStartFreshRegistration = () => {
    setSelectedPatient(null)
    setIsAddingNewPetForOwner(false)
    setPhone(searchPhone)
    setOwnerName('')
    setAge('')
    setPetName('')
    setPetBreed('')
    setPetWeight('')
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const payload: any = {
        date,
        slot,
        notes,
      }

      if (selectedPatient) {
        payload.patientId = selectedPatient.id
      } else {
        payload.ownerName = ownerName.trim()
        payload.phone = phone.trim() || searchPhone.trim()
        payload.age = age ? parseInt(age, 10) : null
        payload.gender = gender
        payload.petName = isVet ? petName.trim() : null
        payload.petSpecies = isVet ? petSpecies : null
        payload.petBreed = isVet ? petBreed.trim() : null
        payload.petWeight = isVet && petWeight ? parseFloat(petWeight) : null
      }

      if (!payload.patientId && (!payload.ownerName || !payload.phone)) {
        setErrorMessage('Name and Phone number are required.')
        setIsSubmitting(false)
        return
      }

      if (isVet && !payload.patientId && !payload.petName) {
        setErrorMessage('Pet name is required for veterinary registration.')
        setIsSubmitting(false)
        return
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to create appointment')
        return
      }

      onSuccess(data.appointment)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
              style={{ backgroundColor: clinicThemeColor }}
            >
              {isVet ? <PawPrint className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                New Walk-in / Appointment
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {isVet
                  ? 'Paws & Care Vet Hospital · Smart Pet & Owner Lookup'
                  : 'Apex Dental & Skin Clinic · Instant Patient Registration'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SMART PHONE SEARCH */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200/80">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              1. Smart Phone Lookup (Quick Patient Check)
            </Label>
            {isSearching && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching...
              </span>
            )}
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter phone number (e.g. 98765...)"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          {/* SEARCH RESULTS: HUMAN CLINIC */}
          {!isVet && hasSearched && searchResults.length > 0 && !selectedPatient && (
            <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Found {searchResults.length} existing patient{searchResults.length > 1 ? 's' : ''}:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectExistingPatient(patient)}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600">
                        {patient.ownerName}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {patient.age ? `${patient.age}y` : 'Age N/A'} · {patient.gender || 'N/A'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{patient.phone}</p>
                    <p className="text-[11px] text-blue-600 font-medium mt-1">
                      → Click to Select
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH RESULTS: VET CLINIC */}
          {isVet && hasSearched && searchResults.length > 0 && !selectedPatient && !isAddingNewPetForOwner && (
            <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Owner Found: <span className="font-bold">{searchResults[0].ownerName}</span> ({searchResults.length} registered pet{searchResults.length > 1 ? 's' : ''})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleAddNewPetForOwner(searchResults[0])}
                  className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <PlusCircle className="w-3 h-3 mr-1" />
                  + Add New Pet for this Owner
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => handleSelectExistingPatient(pet)}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700">
                          {pet.petName || 'Unnamed Pet'}
                        </span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                        {pet.petSpecies}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {pet.petBreed || 'Mixed'} {pet.petWeight ? `· ${pet.petWeight}kg` : ''} {pet.age ? `· ${pet.age} yrs` : ''}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      → Book for this Pet
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE SELECTION BANNER */}
          {selectedPatient && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-900 font-semibold">
                    {isVet
                      ? `Selected Pet: ${selectedPatient.petName} (${selectedPatient.petSpecies} - ${selectedPatient.ownerName})`
                      : `Selected Patient: ${selectedPatient.ownerName} (${selectedPatient.phone})`}
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Existing record will be linked to the new appointment.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleStartFreshRegistration}
                className="text-xs text-gray-600 hover:text-red-600"
              >
                Change
              </Button>
            </div>
          )}

          {isAddingNewPetForOwner && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-emerald-900 font-semibold">
                    Adding New Pet for Existing Owner: {ownerName} ({phone})
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Owner details are pre-filled below. Please fill in the new pet's info.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleStartFreshRegistration}
                className="text-xs text-gray-600 hover:text-red-600"
              >
                Reset
              </Button>
            </div>
          )}

          {hasSearched && searchResults.length === 0 && !selectedPatient && (
            <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800">
              <span>No existing records for "{searchPhone}". Fill details below to register.</span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleStartFreshRegistration}
                className="text-xs"
              >
                Use this phone
              </Button>
            </div>
          )}
        </div>

        {/* STEP 2: REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!selectedPatient && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                2. {isVet ? 'Owner & Pet Details' : 'Patient Details'}
              </Label>

              {/* HUMAN FORM */}
              {!isVet && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ownerName" className="text-xs">
                      Patient Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ownerName"
                      placeholder="e.g. Ramesh Chandra"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 00000"
                      value={phone || searchPhone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="age" className="text-xs">Age (Years)</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="e.g. 32"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs">Gender</Label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* VET FORM */}
              {isVet && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="ownerName" className="text-xs">
                        Owner Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ownerName"
                        placeholder="e.g. Rajesh Kumar"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        required
                        disabled={isAddingNewPetForOwner}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 00000"
                        value={phone || searchPhone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isAddingNewPetForOwner}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/40 border border-emerald-200/60 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <PawPrint className="w-3.5 h-3.5" />
                      Pet Information
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="petName" className="text-xs">
                          Pet Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="petName"
                          placeholder="e.g. Max, Bella"
                          value={petName}
                          onChange={(e) => setPetName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="petSpecies" className="text-xs">
                          Species
                        </Label>
                        <select
                          id="petSpecies"
                          value={petSpecies}
                          onChange={(e) => setPetSpecies(e.target.value)}
                          className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-sm"
                        >
                          {SPECIES_OPTIONS.map((sp) => (
                            <option key={sp} value={sp}>
                              {sp}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="petBreed" className="text-xs">
                          Breed
                        </Label>
                        <Input
                          id="petBreed"
                          placeholder="e.g. Beagle, Persian"
                          value={petBreed}
                          onChange={(e) => setPetBreed(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="petAge" className="text-xs">
                          Pet Age (Years)
                        </Label>
                        <Input
                          id="petAge"
                          type="number"
                          placeholder="e.g. 2"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="petWeight" className="text-xs">
                          Weight (kg)
                        </Label>
                        <Input
                          id="petWeight"
                          type="number"
                          step="0.1"
                          placeholder="e.g. 12.5"
                          value={petWeight}
                          onChange={(e) => setPetWeight(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* STEP 3: APPOINTMENT DETAILS & AUTO TOKEN */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center justify-between">
              <span>3. Appointment Slot & Token</span>
              <span className="text-[11px] text-blue-600 font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto Sequential Token
              </span>
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="slot" className="text-xs">Slot / Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="slot"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full h-8 pl-9 pr-3 rounded-lg border border-input bg-background text-sm"
                  >
                    {COMMON_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs">Visit Reason / Notes</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <textarea
                  id="notes"
                  rows={2}
                  placeholder="e.g. Toothache, annual booster vaccination, skin allergy..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white font-medium px-5"
              style={{ backgroundColor: clinicThemeColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Token...
                </>
              ) : (
                'Assign Token & Book'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
