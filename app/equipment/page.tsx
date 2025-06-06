import { FormGuidance } from "@/components/form-guidance"

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-5">Equipment</h1>

      <FormGuidance type="info" title="Working with Equipment" className="mb-6">
        <p>
          Equipment data is stored locally and will sync when you're online. You can add new equipment, view details,
          and manage calibration schedules even when offline.
        </p>
      </FormGuidance>
    </div>
  )
}
