import { FormInstructions } from "@/components/form-instructions"

export default function NewCalibrationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Calibration</h1>

      <FormInstructions
        title="Creating a New Calibration"
        description="Follow these steps to create a new calibration record"
        className="mb-6"
      >
        <ol className="list-decimal list-inside space-y-2">
          <li>Select the customer from the dropdown list</li>
          <li>Choose the equipment to be calibrated</li>
          <li>Select the calibration type (Load Cell or Speed/Displacement)</li>
          <li>Fill out the calibration form with all required measurements</li>
          <li>Save the calibration before generating the report</li>
        </ol>
        <p className="mt-3 text-blue-600">
          <strong>Note:</strong> All calibrations work offline and will sync when you reconnect.
        </p>
      </FormInstructions>
    </div>
  )
}
