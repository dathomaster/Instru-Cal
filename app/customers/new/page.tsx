"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, AlertCircle, Plus, Trash2, User, MapPin, Search } from "lucide-react"
import { calibrationDB } from "@/lib/db"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseAddressString } from "@/lib/address-parser"

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  title: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    specificLocation: "",
    notes: "",
  })
  const [contacts, setContacts] = useState<Contact[]>([{ id: "1", name: "", email: "", phone: "", title: "" }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addressQuery, setAddressQuery] = useState("")

  // Parse address when the user finishes typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery.trim().length > 10) {
        const parsedAddress = parseAddressString(addressQuery)

        // Only update if we got some valid components
        if (parsedAddress.street || parsedAddress.city || parsedAddress.state || parsedAddress.zipCode) {
          setFormData((prev) => ({
            ...prev,
            street: parsedAddress.street || prev.street,
            city: parsedAddress.city || prev.city,
            state: parsedAddress.state || prev.state,
            zipCode: parsedAddress.zipCode || prev.zipCode,
          }))
        }
      }
    }, 1000) // 1 second delay after typing stops

    return () => clearTimeout(timer)
  }, [addressQuery])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Company name is required"
    if (!formData.street.trim()) newErrors.street = "Street address is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.state.trim()) newErrors.state = "State is required"
    if (!formData.zipCode.trim()) newErrors.zipCode = "Zip code is required"

    // Validate at least one contact with required fields
    const validContacts = contacts.filter((contact) => contact.name.trim() && contact.phone.trim())
    if (validContacts.length === 0) {
      newErrors.contacts = "At least one contact with name and phone is required"
    }

    // Validate individual contacts
    contacts.forEach((contact, index) => {
      if (contact.name.trim() || contact.email.trim() || contact.phone.trim()) {
        if (!contact.name.trim()) {
          newErrors[`contact_${index}_name`] = "Contact name is required"
        }
        if (!contact.phone.trim()) {
          newErrors[`contact_${index}_phone`] = "Contact phone is required"
        }
        if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) {
          newErrors[`contact_${index}_email`] = "Invalid email format"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0]
      document.getElementById(firstErrorField)?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const validContacts = contacts.filter((contact) => contact.name.trim() && contact.phone.trim())

      const newCustomer = {
        id: Date.now().toString(),
        ...formData,
        location: `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        contacts: validContacts,
        contact: validContacts[0]?.name || "",
        email: validContacts[0]?.email || "",
        phone: validContacts[0]?.phone || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await calibrationDB.addCustomer(newCustomer)
      alert("Customer saved successfully!")
      router.push("/customers")
    } catch (error) {
      console.error("Error saving customer:", error)
      alert("Error saving customer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressQuery(e.target.value)
  }

  const parseAddressManually = () => {
    if (addressQuery.trim().length < 5) {
      alert("Please enter a complete address to parse")
      return
    }

    const parsedAddress = parseAddressString(addressQuery)
    setFormData((prev) => ({
      ...prev,
      street: parsedAddress.street || prev.street,
      city: parsedAddress.city || prev.city,
      state: parsedAddress.state || prev.state,
      zipCode: parsedAddress.zipCode || prev.zipCode,
    }))
  }

  const addContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: "",
      email: "",
      phone: "",
      title: "",
    }
    setContacts([...contacts, newContact])
  }

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((contact) => contact.id !== id))
    }
  }

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    setContacts(contacts.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact)))

    // Clear contact-specific errors
    const errorKey = `contact_${contacts.findIndex((c) => c.id === id)}_${field}`
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link href="/customers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center">
                  Company Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter company name"
                  required
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location of Calibration Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Address Search */}
              <div>
                <Label htmlFor="addressSearch">Search Address</Label>
                <div className="relative">
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 text-gray-400 h-4 w-4 z-10" />
                    <Input
                      id="addressSearch"
                      value={addressQuery}
                      onChange={handleAddressInputChange}
                      placeholder="Type full address (e.g. 123 Main St, New York, NY 10001)"
                      className="pl-10 pr-16"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 h-8"
                      onClick={parseAddressManually}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Parse
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Type the full address above and click "Parse", or fill in the fields manually below
                  </p>
                </div>
              </div>

              {/* Manual Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street" className="flex items-center">
                    Street Address <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleChange("street", e.target.value)}
                    placeholder="123 Main Street"
                    required
                    className={errors.street ? "border-red-500" : ""}
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.street}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city" className="flex items-center">
                    City <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="New York"
                    required
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="flex items-center">
                    State <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="NY"
                    required
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.state}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="zipCode" className="flex items-center">
                    Zip Code <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                    placeholder="10001"
                    required
                    className={errors.zipCode ? "border-red-500" : ""}
                  />
                  {errors.zipCode && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.zipCode}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="specificLocation">Specific Location of Calibration</Label>
                  <Input
                    id="specificLocation"
                    value={formData.specificLocation}
                    onChange={(e) => handleChange("specificLocation", e.target.value)}
                    placeholder="Building A, Floor 2, Room 205, etc."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Optional: Specify building, floor, room, or other location details
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contacts</CardTitle>
                <Button type="button" onClick={addContact} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {errors.contacts && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{errors.contacts}</AlertDescription>
                </Alert>
              )}

              {contacts.map((contact, index) => (
                <div key={contact.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <h4 className="font-medium">Contact {index + 1}</h4>
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
                      )}
                    </div>
                    {contacts.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeContact(contact.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`contact_${index}_name`} className="flex items-center">
                        Full Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`contact_${index}_name`}
                        value={contact.name}
                        onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                        placeholder="John Doe"
                        className={errors[`contact_${index}_name`] ? "border-red-500" : ""}
                      />
                      {errors[`contact_${index}_name`] && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors[`contact_${index}_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`contact_${index}_title`}>Job Title</Label>
                      <Input
                        id={`contact_${index}_title`}
                        value={contact.title}
                        onChange={(e) => updateContact(contact.id, "title", e.target.value)}
                        placeholder="Facility Manager"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`contact_${index}_phone`} className="flex items-center">
                        Phone Number <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`contact_${index}_phone`}
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        className={errors[`contact_${index}_phone`] ? "border-red-500" : ""}
                      />
                      {errors[`contact_${index}_phone`] && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors[`contact_${index}_phone`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`contact_${index}_email`}>Email Address</Label>
                      <Input
                        id={`contact_${index}_email`}
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                        placeholder="john@company.com"
                        className={errors[`contact_${index}_email`] ? "border-red-500" : ""}
                      />
                      {errors[`contact_${index}_email`] && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors[`contact_${index}_email`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Special instructions, access requirements, security procedures, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              All fields marked with <span className="text-red-500">*</span> are required.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 pt-6">
            <Link href="/customers" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Customer"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
