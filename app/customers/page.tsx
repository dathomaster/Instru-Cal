import { FormGuidance } from "@/components/form-guidance"

export default function CustomersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-5">Customers</h1>

      <FormGuidance type="info" title="Working with Customers" className="mb-6">
        <p>
          All customer data is stored locally and will sync when you're online. You can add, edit, and view customer
          information even when offline.
        </p>
      </FormGuidance>
    </div>
  )
}
